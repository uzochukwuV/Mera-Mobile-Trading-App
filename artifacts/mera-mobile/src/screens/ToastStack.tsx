// Toast stack — a React Native port of Bencho's "Toast stack".
//
// MIT licensed, part of Bencho (https://bencho.dev). The web block
// stacks notices at a corner and slides them in; here the queue lives
// in a hook and each row owns its own entrance, so a toast can arrive
// while another is leaving without either waiting for the other.
//
// The host is `pointerEvents="box-none"`: the stack never swallows a
// press meant for the screen under it, only the cards themselves take
// a tap (and a tap dismisses).

import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { BORDER, CARD, DOWN, FONT, INK, MUTED, RADIUS, SHADOW_SOFT, UP } from "./homeTheme";

export type ToastTone = "ok" | "error" | "info";

export type Toast = {
  id: string;
  title: string;
  body?: string;
  tone?: ToastTone;
};

const LIFETIME = 3800;
const MAX = 3;
let seq = 0;

export function useToasts(): {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id"> & { id?: string }) => void;
  dismiss: (id: string) => void;
} {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string): void => {
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
    setToasts((v) => v.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, "id"> & { id?: string }): void => {
      const id = toast.id ?? `toast-${++seq}`;
      setToasts((v) => [...v.filter((t) => t.id !== id), { ...toast, id }].slice(-MAX));
      if (timers.current[id]) clearTimeout(timers.current[id]);
      timers.current[id] = setTimeout(() => dismiss(id), LIFETIME);
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
      timers.current = {};
    },
    [],
  );

  return { toasts, push, dismiss };
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}): ReactElement {
  return (
    <View pointerEvents="box-none" style={styles.host}>
      {toasts.map((toast) => (
        <ToastRow
          key={toast.id}
          toast={toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </View>
  );
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}): ReactElement {
  const at = useRef(new Animated.Value(0)).current;
  const gone = useRef(false);

  useEffect(() => {
    Animated.timing(at, {
      toValue: 1,
      duration: 260,
      easing: Easing.bezier(0.24, 1.2, 0.38, 1),
      useNativeDriver: true,
    }).start();
  }, [at]);

  const leave = (): void => {
    if (gone.current) return;
    gone.current = true;
    Animated.timing(at, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  const tone = toast.tone ?? "info";
  const colour = tone === "ok" ? UP : tone === "error" ? DOWN : INK;
  const icon =
    tone === "ok"
      ? "checkmark-circle"
      : tone === "error"
        ? "alert-circle"
        : "information-circle";

  const translateY = at.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const scale = at.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <Animated.View
      style={[styles.card, { opacity: at, transform: [{ translateY }, { scale }] }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${toast.title}. Dismiss.`}
        onPress={leave}
        style={styles.row}
      >
        <Ionicons name={icon} size={20} color={colour} />
        <View style={styles.copy}>
          <Text style={styles.title}>{toast.title}</Text>
          {toast.body !== undefined ? (
            <Text style={styles.body}>{toast.body}</Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    bottom: 20,
    gap: 8,
    left: 16,
    position: "absolute",
    right: 16,
    zIndex: 50,
  },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  copy: { flex: 1, gap: 4 },
  title: {
    color: INK,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
  },
  body: { fontFamily: FONT, color: MUTED, fontSize: 12, lineHeight: 16 },
});
