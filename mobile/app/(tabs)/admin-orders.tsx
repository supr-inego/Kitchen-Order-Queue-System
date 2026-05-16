import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { api, apiErrorMessage } from "@/api/client";
import { OrderCard } from "@/components/OrderCard";
import { colors } from "@/constants/theme";
import type { Order } from "@/types";

const NEXT_STATUS: Record<string, string> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const res = await api.get<Order[]>("/orders/");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 8000);
    return () => clearInterval(iv);
  }, [load]);

  async function advanceStatus(order: Order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await api.patch(`/orders/${order.id}/`, { status: next });
      load();
    } catch (err) {
      console.warn(apiErrorMessage(err));
    }
  }

  const filters = ["all", "pending", "preparing", "ready", "completed"] as const;
  const shown =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>All Orders</Text>
        <View style={styles.chips}>
          {filters.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && styles.chipOn]}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextOn]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={shown}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <View>
            <OrderCard order={item} showCustomer />
            {NEXT_STATUS[item.status] && (
              <Pressable
                style={styles.advance}
                onPress={() => advanceStatus(item)}
              >
                <Text style={styles.advanceText}>
                  Mark as {NEXT_STATUS[item.status]}
                </Text>
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  chipTextOn: { color: "#fff" },
  list: { padding: 16, paddingTop: 0 },
  advance: {
    marginTop: -4,
    marginBottom: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  advanceText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
});
