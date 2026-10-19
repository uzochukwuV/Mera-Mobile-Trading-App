import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Key, ReactElement, useEffect, useState } from "react";
import { ACCENT, ACCENT_INK, BG, BORDER, CARD, CARD_SOFT, DOWN, FONT, INK, MONO, MUTED, PAPER, RADIUS, SECONDARY, SHEET } from "./homeTheme";
import { PillButton } from "./ui";
import { AccountProps } from "./types";

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          hitSlop={8}
          onPress={() => onSignOut?.()}
          style={styles.iconButton}
        >
          <Ionicons name="log-out-outline" size={24} color={INK} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.profileMain}>
              <Text style={styles.handle}>{handle}</Text>
              <Text style={styles.address} numberOfLines={1}>
                {address}
              </Text>
              {connectedAt ? (
                <Text style={styles.caption}>Key connected {connectedAt}</Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={editing ? "Cancel editing" : "Edit profile"}
              hitSlop={8}
              onPress={() => {
                if (editing) {
                  setEditing(false);
                  setDraft(handle);
                } else {
                  setEditing(true);
                }
                onEditProfile?.();
              }}
              style={styles.iconButton}
            >
              <Ionicons
                name={editing ? "close" : "pencil"}
                size={20}
                color={SECONDARY}
              />
            </Pressable>
          </View>
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
              <PillButton
                label={savingHandle ? "Saving…" : "Save handle"}
                busy={savingHandle}
                disabled={draft.trim().length === 0}
                onPress={() => onSaveHandle?.(draft.trim())}
              />
            </View>
          ) : null}
        </View>

        {keys && keys.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Trading keys · {keys.length}
            </Text>
            {keys.map((key) => {
              const armed = armRevoke === key.id;
              const revoking = revokingId === key.id;
              return (
                <View key={key.id} style={styles.keyRow}>
                  <Ionicons name="key-outline" size={18} color={SECONDARY} />
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

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>Trader profile</Text>
            <Text style={styles.cardHint}>Public profiles can be copied.</Text>
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
          <PillButton
            label={savingProfile ? "Saving…" : "Save profile"}
            busy={savingProfile}
            onPress={() => onSaveLeaderProfile?.({ isPublic: pub, bio })}
          />
        </View>

        <View style={styles.list}>
          <SettingRow
            icon="link-outline"
            label="Connect Perpl"
            sub={perplStatus ?? undefined}
            onPress={onConnectPerpl}
          />
          <View style={styles.hairline} />
          <SettingRow icon="lock-closed-outline" label="Lock" onPress={onLock} />
          <View style={styles.hairline} />
          <SettingRow icon="share-outline" label="Export account" onPress={onExport} />
          <View style={styles.hairline} />
          <SettingRow icon="wallet-outline" label="Withdraw funds" onPress={onWithdraw} />
        </View>
      </ScrollView>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress?: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={SECONDARY} />
      </View>
      <View style={styles.settingMain}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub ? <Text style={styles.settingSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={MUTED} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: BG, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: { fontFamily: FONT, color: INK, fontSize: 26, fontWeight: "400", lineHeight: 32 },
  iconButton: { padding: 4 },
  scroll: { gap: 16, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 8 },
  profileCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  profileRow: { alignItems: "center", flexDirection: "row", gap: 16 },
  avatar: {
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: RADIUS.pill,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: { fontFamily: FONT, color: ACCENT_INK, fontSize: 22, fontWeight: "400", lineHeight: 28 },
  profileMain: { flex: 1, gap: 4 },
  handle: { fontFamily: FONT, color: INK, fontSize: 20, fontWeight: "400", lineHeight: 26 },
  address: { color: SECONDARY, fontFamily: MONO, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: FONT, color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  handleForm: { gap: 12, marginTop: 12 },
  handleInput: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontFamily: FONT,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  handleError: { fontFamily: FONT, color: DOWN, fontSize: 13, fontWeight: "400", lineHeight: 18 },
  card: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardHead: { gap: 4 },
  cardTitle: { fontFamily: FONT, color: INK, fontSize: 18, fontWeight: "400", lineHeight: 24 },
  cardHint: { fontFamily: FONT, color: MUTED, fontSize: 12, lineHeight: 16 },
  keyRow: {
    alignItems: "center",
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  keyLabel: { fontFamily: FONT, color: INK, flex: 1, fontSize: 14, fontWeight: "400", lineHeight: 20 },
  revoke: { fontFamily: FONT, color: DOWN, fontSize: 13, fontWeight: "400" },
  bioInput: {
    backgroundColor: SHEET,
    borderColor: BORDER,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    color: INK,
    fontFamily: FONT,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  list: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  settingIcon: {
    alignItems: "center",
    backgroundColor: CARD_SOFT,
    borderRadius: RADIUS.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  settingMain: { flex: 1, gap: 4 },
  settingLabel: { fontFamily: FONT, color: INK, fontSize: 15, fontWeight: "400", lineHeight: 20 },
  settingSub: { fontFamily: FONT, color: MUTED, fontSize: 12, fontWeight: "400", lineHeight: 16 },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  toggle: {
    borderRadius: RADIUS.pill,
    height: 30,
    justifyContent: "center",
    paddingHorizontal: 4,
    width: 52,
  },
  toggleOff: { backgroundColor: BORDER },
  toggleOn: { backgroundColor: INK },
  knob: { borderRadius: RADIUS.pill, height: 24, width: 24 },
  knobOff: { alignSelf: "flex-start", backgroundColor: PAPER },
  knobOn: { alignSelf: "flex-end", backgroundColor: PAPER },
  hairline: { backgroundColor: BORDER, height: 1, marginHorizontal: 12, width: "auto" },
  pressed: { opacity: 0.85 },
});

export default AccountScreen;
