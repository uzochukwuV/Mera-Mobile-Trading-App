import type { ReactElement } from "react";
import { Image, StatusBar, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BORDER, PAPER } from "./homeTheme";
import type { SplashProps } from "./types";

const WAVE = BORDER;

// White splash with the Mera mark centered over faint wave arcs.
// No text, no status — it auto-advances.
export function SplashScreen(_: SplashProps = {}): ReactElement {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <Svg
        viewBox="0 0 720 460"
        preserveAspectRatio="xMidYMax slice"
        style={styles.waves}
      >
        <Path
          d="M-40,120 Q360,20 760,120 L760,170 Q360,70  -40,170 Z"
          fill={WAVE}
          opacity={0.55}
        />
        <Path
          d="M-40,210 Q360,110 760,210 L760,260 Q360,160 -40,260 Z"
          fill={WAVE}
          opacity={0.7}
        />
        <Path
          d="M-40,300 Q360,200 760,300 L760,350 Q360,250 -40,350 Z"
          fill={WAVE}
          opacity={0.85}
        />
        <Path
          d="M-40,390 Q360,290 760,390 L760,440 Q360,340 -40,440 Z"
          fill={WAVE}
        />
      </Svg>
      <Image
        accessibilityLabel="Pera"
        resizeMode="contain"
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    height: 128,
    width: 128,
  },
  screen: {
    alignItems: "center",
    backgroundColor: PAPER,
    flex: 1,
    justifyContent: "center",
  },
  waves: {
    bottom: 0,
    height: 460,
    left: 0,
    position: "absolute",
    right: 0,
    width: "100%",
  },
});

export default SplashScreen;