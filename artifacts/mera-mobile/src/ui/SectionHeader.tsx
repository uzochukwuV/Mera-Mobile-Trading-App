import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { palette, spacing, text } from "../theme";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={text.title}>{title}</Text>
        {subtitle ? <Text style={text.small}>{subtitle}</Text> : null}
      </View>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: "flex-end", justifyContent: "center" },
  copy: { gap: 2 },
  row: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export { SectionHeader };