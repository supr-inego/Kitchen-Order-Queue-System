import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { api, apiErrorMessage } from "@/api/client";
import { colors } from "@/constants/theme";

interface QueueItem {
  id: number;
  ticket_number: number;
  name: string;
  customer_name: string;
  status: string;
  order_id: number | null;
}

export default function AdminQueueScreen() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<QueueItem[]>("/queue/");
      setQueue(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  async function callNext() {
    setCalling(true);
    try {
      await api.post("/queue/next/");
      load();
    } catch (err) {
      console.warn(apiErrorMessage(err, "No waiting tickets."));
    } finally {
      setCalling(false);
    }
  }

  function badgeColor(status: string) {
    switch (status) {
      case "waiting":
        return colors.warningBg;
      case "cooking":
        return "#ffedd5";
      case "serving":
        return colors.successBg;
      default:
        return "#f3f4f6";
    }
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Kitchen Queue</Text>
        <Pressable style={styles.nextBtn} onPress={callNext} disabled={calling}>
          {calling ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.nextText}>Call Next</Text>
          )}
        </Pressable>
      </View>
      <FlatList
        data={queue}
        keyExtractor={(q) => String(q.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: badgeColor(item.status) }]}>
            <Text style={styles.ticket}>#{item.ticket_number}</Text>
            <View style={styles.flex}>
              <Text style={styles.name}>{item.customer_name || item.name}</Text>
              <Text style={styles.meta}>
                Order #{item.order_id} · {item.status}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? "Loading..." : "Queue empty."}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "800" },
  nextBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  nextText: { color: "#fff", fontWeight: "700" },
  list: { padding: 16, paddingTop: 0 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticket: { fontSize: 28, fontWeight: "800", width: 56 },
  flex: { flex: 1 },
  name: { fontWeight: "700", fontSize: 16 },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2, textTransform: "capitalize" },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
});
