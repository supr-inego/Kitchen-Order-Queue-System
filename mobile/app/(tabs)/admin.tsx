import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { api } from "@/api/client";
import { colors } from "@/constants/theme";
import type { Order, Product } from "@/types";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([
        api.get<Order[]>("/orders/"),
        api.get<Product[]>("/products/"),
      ]);
      setOrders(Array.isArray(o.data) ? o.data : []);
      setProducts(Array.isArray(p.data) ? p.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10000);
    return () => clearInterval(iv);
  }, [load]);

  const pending = orders.filter((o) => o.status === "pending").length;
  const preparing = orders.filter((o) => o.status === "preparing").length;
  const ready = orders.filter((o) => o.status === "ready").length;
  const available = products.filter((p) => p.is_available).length;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.sub}>Live stats from shared database</Text>
      <View style={styles.grid}>
        <Stat label="Pending" value={pending} />
        <Stat label="Preparing" value={preparing} />
        <Stat label="Ready" value={ready} />
        <Stat label="Menu items" value={available} />
      </View>
      <Text style={styles.hint}>
        Manage products & coupons on web. Orders and queue update here in real time.
      </Text>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 26, fontWeight: "800" },
  sub: { color: colors.muted, marginBottom: 20, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 32, fontWeight: "800" },
  statLabel: { color: colors.muted, marginTop: 4 },
  hint: { marginTop: 24, color: colors.muted, fontSize: 13, lineHeight: 20 },
});
