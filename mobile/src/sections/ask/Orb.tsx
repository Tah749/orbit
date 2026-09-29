import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../theme";

/** The Tracked mark: a monoline ring with an accent dot. Ink follows the theme. */
export function Orb({ size = 20 }: { size?: number }) {
  const { c } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={44} cy={56} r={29} fill="none" stroke={c.ink} strokeWidth={11} />
      <Circle cx={84} cy={22} r={10} fill={c.accent} />
    </Svg>
  );
}
