import { useState } from "react";

import { View, Text, Pressable, StyleSheet } from "react-native";

import { OrderStatusBar } from "./OrderStatusBar";

import { OrderTotalsSummary } from "./OrderTotalsSummary";

import { colors } from "@/constants/theme";

import { getOrderTotals, money } from "@/utils/orderTotals";

import type { Order } from "@/types";



function statusStyle(status: string) {

  switch (status) {

    case "pending":

      return { bg: colors.warningBg, text: colors.warning };

    case "preparing":

      return { bg: "#ffedd5", text: "#c2410c" };

    case "ready":

      return { bg: colors.successBg, text: colors.success };

    case "cancelled":

      return { bg: colors.errorBg, text: colors.error };

    default:

      return { bg: "#f3f4f6", text: colors.muted };

  }

}



export function OrderCard({ order, showCustomer }: { order: Order; showCustomer?: boolean }) {

  const [open, setOpen] = useState(false);

  const st = statusStyle(order.status);

  const { discount } = getOrderTotals(order);



  return (

    <Pressable style={styles.card} onPress={() => setOpen((v) => !v)}>

      <View style={styles.header}>

        <View style={styles.flex}>

          <Text style={styles.title}>

            Order #{order.id}

            {order.queue_ticket?.ticket_number != null && (

              <Text style={styles.sub}> · Queue #{order.queue_ticket.ticket_number}</Text>

            )}

          </Text>

          {showCustomer && !!(order as Order & { customer_name?: string }).customer_name && (

            <Text style={styles.customer}>

              {(order as Order & { customer_name?: string }).customer_name}

            </Text>

          )}

          <Text style={styles.date}>{new Date(order.created_at).toLocaleString()}</Text>

          {!!order.note && (

            <Text style={styles.note} numberOfLines={2}>

              {order.note}

            </Text>

          )}

        </View>

        <View style={styles.right}>

          <View style={[styles.badge, { backgroundColor: st.bg }]}>

            <Text style={[styles.badgeText, { color: st.text }]}>{order.status}</Text>

          </View>

          {discount > 0 && (

            <Text style={styles.discountBadge}>−₱{money(discount)}</Text>

          )}

          <Text style={styles.total}>₱{money(order.total_price)}</Text>

        </View>

      </View>

      <OrderStatusBar status={order.status} />

      {open && (

        <View style={styles.details}>

          {(order.items || []).map((it) => (

            <View key={it.id} style={styles.line}>

              <Text style={styles.itemName}>{it.product?.name}</Text>

              <Text style={styles.itemQty}>×{it.quantity}</Text>

              <Text style={styles.itemPrice}>₱{money(Number(it.unit_price) * it.quantity)}</Text>

            </View>

          ))}

          <OrderTotalsSummary order={order} />

        </View>

      )}

    </Pressable>

  );

}



const styles = StyleSheet.create({

  card: {

    backgroundColor: colors.card,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: colors.border,

    padding: 14,

    marginBottom: 12,

  },

  header: { flexDirection: "row", gap: 12 },

  flex: { flex: 1 },

  right: { alignItems: "flex-end", gap: 6 },

  title: { fontWeight: "800", fontSize: 16 },

  sub: { fontWeight: "400", fontSize: 12, color: colors.muted },

  customer: { fontSize: 13, color: colors.muted, marginTop: 2 },

  date: { fontSize: 12, color: colors.muted, marginTop: 2 },

  note: { fontSize: 12, color: colors.muted, fontStyle: "italic", marginTop: 4 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },

  discountBadge: { fontSize: 11, fontWeight: "700", color: colors.success },

  total: { fontWeight: "800", fontSize: 15 },

  details: {

    marginTop: 12,

    paddingTop: 12,

    borderTopWidth: 1,

    borderTopColor: colors.border,

  },

  line: {

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 6,

    gap: 8,

  },

  itemName: { flex: 1, fontWeight: "600", fontSize: 14 },

  itemQty: { color: colors.muted, fontSize: 13 },

  itemPrice: { fontWeight: "700", fontSize: 13 },

});


