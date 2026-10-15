import { useEffect, useState, type ReactElement } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TopFilterBar } from "./TabChrome";
import {
  ACCENT,
  ACCENT_INK,
  BG,
  BORDER,
  CARD,
  CARD_SOFT,
  DOWN,
  INK,
  MUTED,
  PAPER,
  RADIUS,
  SECONDARY,
  SHEET,
} from "./homeTheme";
import type { AccountProps } from "./types";

export function AccountScreen(props: AccountProps = {}): ReactElement {
  const {
    address = "0x7f3a…9c21",
    handle = "anon-trader",
    connectedAt,
    keyCount = 1,
    keys,
    revokingId = null,
    perplStatus,
    handleError = null,
    savingHandle = false,
    leaderProfile = null,
    savingProfile = false,
    profileError = null,
    onConnectPerpl,
    onLock,
    onExport,
    onSignOut,
    onRevokeKey,
    onEditProfile,
    onSaveHandle,
    onWithdraw,
    onSaveLeaderProfile,
  } = props;

  const initial = handle.slice(0, 1).toUpperCase();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(handle);
  const [armRevoke, setArmRevoke] = useState<string | null>(null);
  const [pub, setPub] = useState(leaderProfile?.isPublic ?? false);
  const [bio, setBio] = useState(leaderProfile?.bio ?? "");
  const [pubDirty, setPubDirty] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(handle);
  }, [handle, editing]);

  useEffect(() => {
    if (!pubDirty && leaderProfile) {
      setPub(leaderProfile.isPublic);
      setBio(leaderProfile.bio);
    }
  }, [leaderProfile, pubDirty]);

  return (
    <View style={styles.screen}>
      <TopFilterBar />
      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Account</Text>

          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={styles.profileMain}>
                <Text style={styles.handle}>{handle}</Text>
                <View style={styles.addressPill}>
                  <Text style={styles.address}>{address}</Text>
                </View>
                {connectedAt ? (
                  <Text style={styles.caption}>Key connected {connectedAt}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.keysRow}>
              <Text style={styles.caption}>
                {keys ? keys.length : keyCount} trading key
                {(keys ? keys.length : keyCount) === 1 ? "" : "s"}
              </Text>
            </View>
            {keys && keys.length > 0 ? (
              <View style={styles.keyList}>
                {keys.map((key) => {
                  const armed = armRevoke === key.id;
                  const revoking = revokingId === key.id;
                  return (
                    <View key={key.id} style={styles.keyRow}>
                      <Text style={styles.keyLabel} numberOfLines={1}>
                        {key.label}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          armed ? `Confirm revoke ${key.label}` : `Revoke ${key.label}`
                        }
                        disabled={revoking}
                        hitSlop={8}
                        onPress={() => {
                          if (armed) {
                            setArmRevoke(null);
                            onRevokeKey?.(key.id);
                          } else {
                            setArmRevoke(key.id);
                          }
                        }}
                      >
                        <Text style={styles.revoke}>
                          {revoking ? "Revoking…" : armed ? "Tap again" : "Revoke"}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (editing) {
                  setEditing(false);
                  setDraft(handle);
                } else {
                  setEditing(true);
                }
                onEditProfile?.();
              }}
              style={({ pressed }) => [
                styles.editButton,
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.editLabel}>
                {editing ? "Cancel" : "Edit profile"}
              </Text>
            </Pressable>
            {editing ? (
              <View style={styles.handleForm}>
                <TextInput
                  accessibilityLabel="Handle"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!savingHandle}
                  maxLength={24}
                  onChangeText={setDraft}
                  placeholder="3–24 letters, digits, underscore"
                  placeholderTextColor={MUTED}
                  style={styles.handleInput}
                  value={draft}
                />
                {handleError ? (
                  <Text style={styles.handleError}>{handleError}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save handle"
                  disabled={savingHandle || draft.trim().length === 0}
                  onPress={() => onSaveHandle?.(draft.trim())}
                  style={({ pressed }) => [
                    styles.saveButton,
                    savingHandle || pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.saveLabel}>
                    {savingHandle ? "Saving…" : "Save handle"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.profileRow}>
              <Text style={styles.cardTitle}>Trader profile</Text>
              <Text style={styles.cardHint}>
                Public profiles can be followed and copied.
              </Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: pub }}
              accessibilityLabel="Public trader profile"
              onPress={() => {
                setPub((value) => !value);
                setPubDirty(true);
              }}
              style={styles.toggleRow}
            >
              <Text style={styles.settingLabel}>Public profile</Text>
              <View style={[styles.toggle, pub ? styles.toggleOn : styles.toggleOff]}>
                <View style={[styles.knob, pub ? styles.knobOn : styles.knobOff]} />
              </View>
            </Pressable>
            <TextInput
              accessibilityLabel="Trader bio"
              editable={!savingProfile}
              maxLength={500}
              multiline
              numberOfLines={2}
              onChangeText={(value) => {
                setBio(value);
                setPubDirty(true);
              }}
              placeholder="One line about your style…"
              placeholderTextColor={MUTED}
              style={styles.bioInput}
              value={bio}
            />
            {profileError ? (
              <Text style={styles.handleError}>{profileError}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save trader profile"
              disabled={savingProfile}
              onPress={() => onSaveLeaderProfile?.({ isPublic: pub, bio })}
              style={({ pressed }) => [
                styles.saveButton,
                savingProfile || pressed ? styles.pressed : null,
              ]}
            >
              <Text style={styles.saveLabel}>
                {savingProfile ? "Saving…" : "Save profile"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.settings}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onConnectPerpl?.()}
              style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
            >
              <View style={styles.settingMain}>
                <Text style={styles.settingLabel}>Connect Perpl</Text>
                {perplStatus ? (
                  <Text style={styles.settingSub}>{perplStatus}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </Pressable>
            <View style={styles.hairline} />
            <Pressable
              accessibilityRole="button"
              onPress={() => onLock?.()}
              style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
            >
              <Text style={styles.settingLabel}>Lock</Text>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </Pressable>
            <View style={styles.hairline} />
            <Pressable
              accessibilityRole="button"
              onPress={() => onExport?.()}
              style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
            >
              <Text style={styles.settingLabel}>Export account</Text>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </Pressable>
            <View style={styles.hairline} />
            <Pressable
              accessibilityRole="button"
              onPress={() => onWithdraw?.()}
              style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
            >
              <Text style={styles.settingLabel}>Withdraw funds</Text>
              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => onSignOut?.()}
            style={({ pressed }) => [styles.signOut, pressed ? styles.pressed : null]}
          >
            <Text style={styles.signOutLabel}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  address: { color: SECONDARY, fontFamily: "Menlo", fontSize: 13, lineHeight: 18 },
  addressPill: {
    alignSelf: "flex-start",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: RADIUS.pill,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: { color: ACCENT_INK, fontSize: 22, fontWeight: "800", lineHeight: 28 },
  caption: { color: MUTED, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  bioInput: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  cardHint: { color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  cardTitle: { color: INK, fontSize: 18, fontWeight: "700", lineHeight: 24 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    marginHorizontal: 20,
    padding: 16,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: "100%",
  },
  editLabel: { color: INK, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  hairline: { backgroundColor: BORDER, height: 1, width: "100%" },
  handle: { color: INK, fontSize: 18, fontWeight: "700", lineHeight: 26 },
  handleError: { color: DOWN, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  handleForm: { gap: 10 },
  handleInput: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  keyLabel: { color: INK, flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20 },
  keyList: { gap: 4 },
  keyRow: {
    alignItems: "center",
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  keysRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pressed: { opacity: 0.85 },
  profileMain: { flex: 1, gap: 6 },
  profileRow: { flexDirection: "row", gap: 14 },
  revoke: { color: DOWN, fontSize: 13, fontWeight: "600" },
  saveButton: {
    alignItems: "center",
    backgroundColor: INK,
    borderRadius: RADIUS.pill,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  saveLabel: { color: PAPER, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  screen: { backgroundColor: BG, flex: 1 },
  scroll: { gap: 14, paddingBottom: 28, paddingTop: 6 },
  settingLabel: { color: INK, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  settingMain: { flex: 1, gap: 2 },
  sheet: {
    backgroundColor: SHEET,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
    overflow: "hidden",
    paddingTop: 12,
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingSub: { color: MUTED, fontSize: 12, fontWeight: "500", lineHeight: 16 },
  settings: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 20,
    borderWidth: 1,
    gap: 0,
    marginHorizontal: 20,
    overflow: "hidden",
  },
  signOut: {
    alignItems: "center",
    borderColor: DOWN,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginHorizontal: 20,
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  signOutLabel: { color: DOWN, fontSize: 16, fontWeight: "600", lineHeight: 22 },
  title: {
    color: INK,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.4,
    lineHeight: 32,
    paddingHorizontal: 20,
  },
  toggle: {
    borderRadius: RADIUS.pill,
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 52,
  },
  toggleOff: { backgroundColor: BORDER },
  toggleOn: { backgroundColor: INK },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  knob: { borderRadius: RADIUS.pill, height: 24, width: 24 },
  knobOff: { backgroundColor: PAPER, alignSelf: "flex-start" },
  knobOn: { backgroundColor: PAPER, alignSelf: "flex-end" },
});

export default AccountScreen;
