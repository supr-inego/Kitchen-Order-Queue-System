import { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import { colors } from "@/constants/theme";
import { money } from "@/utils/money";
import { imageProxyUrl, normalizeImageUrl } from "@/utils/imageUrl";
import type { Product } from "@/types";

const EMOJIS: Record<string, string> = {
  Mains: "🍽️",
  Sides: "🥗",
  Beverages: "🥤",
  Desserts: "🍰",
  Snacks: "🍟",
  Specials: "⭐",
  Other: "🍴",
};

interface Props {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onSetQty: (n: number) => void;
}

export function ProductCard({ product, qty, onAdd, onRemove, onSetQty }: Props) {
  const [imgMode, setImgMode] = useState<"direct" | "proxy" | "failed">("direct");
  const cat = product.category || "Other";
  const normalized = normalizeImageUrl(product.image_url);
  const imgUri =
    imgMode === "proxy" && normalized
      ? imageProxyUrl(normalized)
      : normalized;

  return (
    <View style={[styles.card, qty > 0 && styles.cardActive]}>
      {imgUri && imgMode !== "failed" ? (
        <Image
          source={{ uri: imgUri }}
          style={styles.image}
          onError={() => {
            if (imgMode === "direct") setImgMode("proxy");
            else setImgMode("failed");
          }}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.emoji}>{EMOJIS[cat] || "🍴"}</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.name}>{product.name}</Text>
            {!!product.description && (
              <Text style={styles.desc} numberOfLines={2}>
                {product.description}
              </Text>
            )}
            {!!product.category && (
              <Text style={styles.cat}>{product.category}</Text>
            )}
          </View>
          <Text style={styles.price}>₱{money(product.current_price)}</Text>
        </View>
        {qty === 0 ? (
          <Pressable style={styles.addBtn} onPress={onAdd}>
            <Text style={styles.addBtnText}>Add to Cart</Text>
          </Pressable>
        ) : (
          <View style={styles.qtyRow}>
            <Pressable style={styles.qtyBtn} onPress={onRemove}>
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <TextInput
              style={styles.qtyInput}
              keyboardType="number-pad"
              value={String(qty)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (!n || n <= 0) onSetQty(0);
                else onSetQty(n);
              }}
            />
            <Pressable style={styles.qtyBtn} onPress={onAdd}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 12,
  },
  cardActive: { borderColor: colors.primary, borderWidth: 2 },
  image: { width: "100%", height: 140 },
  placeholder: {
    height: 140,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 40 },
  body: { padding: 14 },
  row: { flexDirection: "row", gap: 8, marginBottom: 12 },
  flex: { flex: 1 },
  name: { fontWeight: "700", fontSize: 15 },
  desc: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cat: { fontSize: 11, color: colors.muted, marginTop: 2 },
  price: { fontWeight: "800", fontSize: 15 },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  addBtnText: { color: colors.primaryText, fontWeight: "600", fontSize: 14 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, fontWeight: "700" },
  qtyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    textAlign: "center",
    paddingVertical: 6,
    fontWeight: "700",
  },
});
