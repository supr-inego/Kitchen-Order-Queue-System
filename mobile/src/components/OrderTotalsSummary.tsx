import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";
import { discountLabel, getOrderTotals } from "@/utils/orderTotals";
import { money } from "@/utils/money";
import type { Order } from "@/types";

export function OrderTotalsSummary({ order }: { order: Order }) {
  const { subtotal, discount, total, couponCode } = getOrderTotals(order);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>₱{money(subtotal)}</Text>
      </View>
      {couponCode && (
        <Text style={styles.coupon}>
          Coupon {couponCode}
          {order.coupon_info ? ` · ${discountLabel(order.coupon_info)}` : ""}
        </Text>
      )}
      {discount > 0 && (
        <View style={styles.row}>
          <Text style={styles.discountLabel}>Discount</Text>
          <Text style={styles.discountValue}>−₱{money(discount)}</Text>
        </View>
      )}
      <View style={[styles.row, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₱{money(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, color: colors.muted },
  value: { fontSize: 13, fontWeight: "600" },
  coupon: { fontSize: 12, color: "#1d4ed8", fontWeight: "600" },
  discountLabel: { fontSize: 13, color: colors.success, fontWeight: "600" },
  discountValue: { fontSize: 13, color: colors.success, fontWeight: "700" },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 15, fontWeight: "800" },
  totalValue: { fontSize: 15, fontWeight: "800" },
});
