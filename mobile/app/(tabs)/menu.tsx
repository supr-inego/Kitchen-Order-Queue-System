import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { api } from "@/api/client";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { POLL_PRODUCTS_MS } from "@/constants/config";
import { colors } from "@/constants/theme";
import type { Product } from "@/types";

export default function MenuScreen() {
  const { cart, setProducts, addToCart, removeFromCart, setQty } = useCart();
  const [products, setLocalProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const load = useCallback(async () => {
    try {
      const res = await api.get<Product[]>("/products/");
      const list = Array.isArray(res.data) ? res.data : [];
      const available = list.filter((p) => p.is_available);
      setLocalProducts(available);
      setProducts(available);
    } finally {
      setLoading(false);
    }
  }, [setProducts]);

  useEffect(() => {
    load();
    const iv = setInterval(load, POLL_PRODUCTS_MS);
    return () => clearInterval(iv);
  }, [load]);

  const categories = [
    "All",
    ...new Set(products.map((p) => p.category || "Other")),
  ];

  const shown = products.filter((p) => {
    const s = search.toLowerCase();
    const catOk = catFilter === "All" || (p.category || "Other") === catFilter;
    const searchOk =
      !s ||
      p.name.toLowerCase().includes(s) ||
      (p.description || "").toLowerCase().includes(s);
    return catOk && searchOk;
  });

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.sub}>Synced with web · updates every 15s</Text>
        <TextInput
          style={styles.search}
          placeholder="Search menu..."
          value={search}
          onChangeText={setSearch}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cats}>
          {categories.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCatFilter(c)}
              style={[styles.chip, catFilter === c && styles.chipActive]}
            >
              <Text style={[styles.chipText, catFilter === c && styles.chipTextActive]}>
                {c}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? "Loading menu..." : "No items found."}
          </Text>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            qty={cart[item.id] || 0}
            onAdd={() => addToCart(item.id)}
            onRemove={() => removeFromCart(item.id)}
            onSetQty={(n) => setQty(item.id, n)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, paddingBottom: 0 },
  title: { fontSize: 26, fontWeight: "800" },
  sub: { fontSize: 12, color: colors.muted, marginBottom: 12 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.card,
    marginBottom: 10,
  },
  cats: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: colors.primaryText },
  list: { padding: 16, paddingTop: 8 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
});
