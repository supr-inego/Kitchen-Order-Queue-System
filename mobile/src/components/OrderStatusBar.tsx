import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

const FLOW = ["pending", "preparing", "ready", "completed"] as const;

export function OrderStatusBar({ status }: { status: string }) {
  if (status === "cancelled") return null;
  const step = FLOW.indexOf(status as (typeof FLOW)[number]);

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        {FLOW.map((s, i) => (
          <View
            key={s}
            style={[styles.segment, i <= step ? styles.active : styles.inactive]}
          />
        ))}
      </View>
      <View style={styles.labels}>
        {FLOW.map((s) => (
          <Text key={s} style={styles.label}>
            {s}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  bar: { flexDirection: "row", gap: 4 },
  segment: { flex: 1, height: 5, borderRadius: 4 },
  active: { backgroundColor: colors.primary },
  inactive: { backgroundColor: "#e5e7eb" },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  label: { fontSize: 9, color: colors.muted, textTransform: "capitalize", flex: 1 },
});
