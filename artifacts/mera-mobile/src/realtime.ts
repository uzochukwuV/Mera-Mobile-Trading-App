import { ensureSession, getSupabaseConfig } from "./session";

// Minimal Supabase Realtime v2 client over the Phoenix protocol.
// No dependency: one WebSocket, one channel per table, postgres_changes
// bindings with the caller's JWT for RLS. The app subscribes by table;
// App.tsx maps tables to data reloads (screens stay presentational).

type ChangeType = "INSERT" | "UPDATE" | "DELETE";

type ChangePayload = {
  type: ChangeType;
  schema: string;
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

type TableHandler = (payload: ChangePayload) => void;

const HEARTBEAT_MS = 25_000;
const WATCHDOG_MS = 70_000;
const BACKOFF_START_MS = 1_000;
const BACKOFF_MAX_MS = 30_000;

function wsUrl(): string | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  const ws = url.replace(/^http/, "ws");
  return `${ws}/realtime/v1/websocket?apikey=${encodeURIComponent(anonKey)}&vsn=1`;
}

class RealtimeFeed {
  private ws: WebSocket | null = null;
  private ref = 0;
  private subs = new Map<string, Set<TableHandler>>();
  private joined = new Set<string>();
  private started = false;
  private backoffMs = BACKOFF_START_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatRef: string | null = null;

  start(): void {
    if (this.started) return;
    this.started = true;
    this.backoffMs = BACKOFF_START_MS;
    void this.connect();
  }

  stop(): void {
    this.started = false;
    this.clearTimers();
    try {
      this.ws?.close(1000, "stop");
    } catch {
      // Socket already gone.
    }
    this.ws = null;
    this.joined.clear();
  }

  subscribe(table: string, handler: TableHandler): () => void {
    let handlers = this.subs.get(table);
    if (!handlers) {
      handlers = new Set();
      this.subs.set(table, handlers);
    }
    handlers.add(handler);
    if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.joined.has(table)) {
      void this.join(table);
    }
    return () => {
      handlers?.delete(handler);
      if (handlers?.size === 0) {
        this.subs.delete(table);
        this.leave(table);
      }
    };
  }

  private nextRef(): string {
    this.ref += 1;
    return String(this.ref);
  }

  private async connect(): Promise<void> {
    if (!this.started) return;
    const url = wsUrl();
    if (url === null) return;
    try {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => {
        this.backoffMs = BACKOFF_START_MS;
        this.joined.clear();
        for (const table of this.subs.keys()) {
          void this.join(table);
        }
        this.startHeartbeat();
        this.kickWatchdog();
      };
      ws.onmessage = (event) => {
        this.kickWatchdog();
        this.handleMessage(event.data);
      };
      ws.onerror = () => {
        // onclose follows with the details; reconnect there.
      };
      ws.onclose = (event) => {
        if (this.ws === ws) this.ws = null;
        this.joined.clear();
        this.clearTimers();
        if (this.started && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private async join(table: string): Promise<void> {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    let token = "";
    try {
      token = (await ensureSession()).access_token;
    } catch {
      return;
    }
    if (this.ws !== ws) return;
    ws.send(
      JSON.stringify({
        topic: `realtime:public:${table}`,
        event: "phx_join",
        payload: {
          config: {
            broadcast: { ack: false, self: false },
            presence: { key: "" },
            postgres_changes: [{ event: "*", schema: "public", table }],
          },
          access_token: token,
        },
        ref: this.nextRef(),
      }),
    );
  }

  private leave(table: string): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    this.joined.delete(table);
    ws.send(
      JSON.stringify({
        topic: `realtime:public:${table}`,
        event: "phx_leave",
        payload: {},
        ref: this.nextRef(),
      }),
    );
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;
    let msg: {
      topic?: string;
      event?: string;
      ref?: string | null;
      payload?: {
        status?: string;
        data?: {
          type?: string;
          schema?: string;
          table?: string;
          record?: Record<string, unknown>;
          old_record?: Record<string, unknown> | null;
        };
      };
    };
    try {
      msg = JSON.parse(raw) as typeof msg;
    } catch {
      return;
    }
    if (msg.event === "phx_reply" && msg.ref === this.heartbeatRef) {
      this.heartbeatRef = null;
      return;
    }
    if (msg.event === "phx_reply" && msg.payload?.status === "ok") {
      if (typeof msg.topic === "string") {
        const prefix = "realtime:public:";
        if (msg.topic.startsWith(prefix)) {
          this.joined.add(msg.topic.slice(prefix.length));
        }
      }
      return;
    }
    if (msg.event !== "postgres_changes") return;
    const data = msg.payload?.data;
    if (!data || typeof data.table !== "string") return;
    if (data.type !== "INSERT" && data.type !== "UPDATE" && data.type !== "DELETE") {
      return;
    }
    const handlers = this.subs.get(data.table);
    if (!handlers || handlers.size === 0) return;
    const payload: ChangePayload = {
      type: data.type,
      schema: data.schema ?? "public",
      table: data.table,
      record: data.record ?? {},
      old_record: data.old_record ?? null,
    };
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch {
        // One bad subscriber must not break the feed.
      }
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      const ws = this.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      // Unacked heartbeat + watchdog expiry below both funnel to reconnect.
      if (this.heartbeatRef === null) {
        this.heartbeatRef = this.nextRef();
        ws.send(
          JSON.stringify({
            topic: "phoenix",
            event: "heartbeat",
            payload: {},
            ref: this.heartbeatRef,
          }),
        );
      }
    }, HEARTBEAT_MS);
  }

  private kickWatchdog(): void {
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = setTimeout(() => {
      // Silent too long (missed heartbeats included) — reconnect.
      try {
        this.ws?.close(4400, "watchdog");
      } catch {
        this.scheduleReconnect();
      }
    }, WATCHDOG_MS);
  }

  private scheduleReconnect(): void {
    if (!this.started || this.reconnectTimer) return;
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, BACKOFF_MAX_MS);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
    this.heartbeatRef = null;
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.watchdogTimer) clearTimeout(this.watchdogTimer);
    this.watchdogTimer = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}

const feed = new RealtimeFeed();

export { feed };
export type { ChangePayload, TableHandler };
