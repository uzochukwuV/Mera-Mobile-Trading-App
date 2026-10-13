import type { ReactElement } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, LinkButton } from "../Button";
import { Card } from "../ui";
import { monoFont, palette, radii, spacing, text } from "../theme";
import type { AccountProps } from "./types";

export function AccountScreen(props: AccountProps = {}): ReactElement {
  const {
    address = "0x7f3a…9c21",
    handle = "anon-trader",
    connectedAt = "Jun 12",
    keyCount = 1,
    onLock,
    onExport,
    onSignOut,
    onRevokeKey,
    onEditProfile,
  } = props;

  const initial = handle.slice(0, 1).toUpperCase();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Account</Text>

        <Card style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.profileMain}>
              <Text style={styles.handle}>{handle}</Text>
              <View style={styles.addressPill}>
                <Text style={styles.address}>{address}</Text>
              </View>
              <Text style={text.caption}>Key connected {connectedAt}</Text>
            </View>
          </View>
          <View style={styles.keysRow}>
            <Text style={text.caption}>
              {keyCount} trading key{keyCount === 1 ? "" : "s"}
            </Text>
            <LinkButton title="Revoke" onPress={() => onRevokeKey?.()} />
          </View>
          <Button title="Edit profile" onPress={() => onEditProfile?.()} />
        </Card>

        <Card style={styles.settings} padding={0}>
          <Pressable
            accessibilityRole="button"
            onPress={onLock}
            style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
          >
            <Text style={styles.settingLabel}>Lock</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <View style={styles.hairline} />
          <Pressable
            accessibilityRole="button"
            onPress={onExport}
            style={({ pressed }) => [styles.settingRow, pressed ? styles.pressed : null]}
          >
            <Text style={styles.settingLabel}>Export account</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={onSignOut}
          style={({ pressed }) => [styles.signOut, pressed ? styles.pressed : null]}
        >
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  address: { color: palette.graphite, fontFamily: monoFont, fontSize: 13, lineHeight: 18 },
  addressPill: {
    alignSelf: "flex-start",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.full,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: { color: palette.ink, fontSize: 22, fontWeight: "600", lineHeight: 28 },
  card: { gap: spacing.md },
  chevron: { color: palette.ash, fontSize: 18, fontWeight: "600", lineHeight: 22 },
  hairline: { backgroundColor: palette.border, height: 1, width: "100%" },
  handle: { color: palette.ink, fontSize: 18, fontWeight: "600", lineHeight: 26 },
  keysRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  pressed: { opacity: 0.85 },
  profileMain: { flex: 1, gap: spacing.xs },
  profileRow: { flexDirection: "row", gap: spacing.md },
  screen: { backgroundColor: palette.bg, flex: 1 },
  scroll: { gap: spacing.md, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  settingLabel: { color: palette.ink, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settings: { gap: 0, overflow: "hidden" },
  signOut: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: palette.error,
    borderRadius: radii.button,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%",
  },
  signOutLabel: { color: palette.error, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  title: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.37,
    lineHeight: 31,
  },
});

export default AccountScreen;
