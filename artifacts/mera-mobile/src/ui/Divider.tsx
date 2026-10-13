import { StyleSheet, View, type ViewStyle } from "react-native";
import { palette } from "../theme";

type DividerProps = {
  vertical?: boolean;
  spacing?: number;
  style?: ViewStyle;
};

function Divider({ vertical = false, spacing: gap = 0, style }: DividerProps) {
  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { marginVertical: vertical ? 0 : gap, marginHorizontal: vertical ? gap : 0 },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: { backgroundColor: palette.border, height: 1, width: "100%" },
  vertical: { backgroundColor: palette.border, height: "100%", width: 1 },
});

export { Divider };