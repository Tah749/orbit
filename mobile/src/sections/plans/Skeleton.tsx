import { View } from "react-native";
import { useTheme } from "../../theme";
import { Skeleton, SkeletonRow } from "../../ui";

/** Mirrors the plans page: the next-trip headline, two lists of rows. */
export function PlansSkeleton() {
  const { c } = useTheme();
  return (
    <View style={{ gap: 28 }}>
      <View style={{ gap: 10 }}>
        <Skeleton width={60} height={10} />
        <Skeleton width="80%" height={34} />
        <Skeleton width="60%" height={12} />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line }}>
        <SkeletonRow />
        <SkeletonRow />
      </View>
      <View style={{ gap: 10 }}>
        <Skeleton width="45%" height={20} />
        <View style={{ borderTopWidth: 1, borderTopColor: c.ink }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </View>
      </View>
    </View>
  );
}
