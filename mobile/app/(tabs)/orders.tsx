import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { api } from "@/api/client";
import { OrderCard } from "@/components/OrderCard";
import { POLL_ORDERS_MS } from "@/constants/config";
import { colors } from "@/constants/theme";
import type { Order } from "@/types";

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const prevReady = useRef<Set<number>>(new Set());
  const initialized = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<Order[]>("/orders/");
      const list = Array.isArray(res.data) ? res.data : [];
      if (!initialized.current) {
        list
          .filter((o) => o.status === "ready")
          .forEach((o) => prevReady.current.add(o.id));
        initialized.current = true;
      } else {
        list.forEach((o) => {
          if (o.status === "ready" && !prevReady.current.has(o.id)) {
            prevReady.current.add(o.id);
            Alert.alert(
              "Ready for pickup! 🎉",
              `Order #${o.id} is ready. Queue ticket #${o.queue_ticket?.ticket_number ?? "—"}`
            );
          }
        });
      }
      setOrders(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, POLL_ORDERS_MS);
    return () => clearInterval(iv);
  }, [load]);

  const active = orders.filter((o) =>
    ["pending", "preparing", "ready"].includes(o.status)
  );
  const past = orders.filter((o) =>
    ["completed", "cancelled"].includes(o.status)
  );

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.sub}>Auto-refreshes every 5s · same data as web</Text>
      </View>
      <FlatList
        data={[...active, ...past]}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          active.length > 0 ? (
            <Text style={styles.section}>Active ({active.length})</Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? "Loading..." : "No orders yet."}
          </Text>
        }
        renderItem={({ item, index }) => (
          <>
            {past.length > 0 &&
              index === active.length &&
              active.length > 0 && (
                <Text style={[styles.section, { marginTop: 16 }]}>
                  Past orders
                </Text>
              )}
            <OrderCard order={item} />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "800" },
  sub: { fontSize: 12, color: colors.muted },
  list: { padding: 16, paddingTop: 0 },
  section: { fontWeight: "700", marginBottom: 8, color: colors.muted },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
});
