import { ActivityIndicator, StyleSheet, View } from "react-native";
import { palette } from "../theme";

type SpinnerProps = {
  size?: "small" | "large";
  color?: string;
};

function Spinner({ size = "small", color = palette.muted }: SpinnerProps) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});

export { Spinner };