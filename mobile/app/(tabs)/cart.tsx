import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { api, apiErrorMessage } from "@/api/client";
import { useCart } from "@/context/CartContext";
import { colors } from "@/constants/theme";
import { money } from "@/utils/money";
import { loadCouponForCheckout, clearCouponForCheckout } from "@/utils/couponWallet";
import type { Order, Product } from "@/types";

export default function CartScreen() {
  const {
    cart,
    products,
    setProducts,
    appliedCoupon,
    setAppliedCoupon,
    couponCode,
    setCouponCode,
    clearCart,
  } = useCart();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean; needsClaim?: boolean }>({
    text: "",
    ok: false,
  });

  const loadProducts = useCallback(async () => {
    if (products.length > 0) return;
    const res = await api.get("/products/");
    const list = Array.isArray(res.data) ? res.data : [];
    setProducts((list as Product[]).filter((p) => p.is_available));
  }, [products.length, setProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const saved = loadCouponForCheckout();
    if (saved?.coupon?.code) {
      setCouponCode(saved.coupon.code);
      setCouponMsg({
        text: `Using ${saved.coupon.code} from wallet — tap Apply to confirm.`,
        ok: true,
      });
    }
  }, [setCouponCode]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const p = products.find((x) => x.id === Number(id));
          if (!p) return null;
          return {
            ...p,
            qty,
            subtotal: Number(p.current_price) * qty,
          };
        })
        .filter(Boolean) as Array<
        (typeof products)[0] & { qty: number; subtotal: number }
      >,
    [cart, products]
  );

  const subtotal = cartItems.reduce((s, i) => s + i.subtotal, 0);

  function getDiscount() {
    if (!appliedCoupon) return 0;
    const { coupon, discount_preview } = appliedCoupon;
    if (coupon.discount_type === "free_item") {
      if (cartItems.length === 0) return 0;
      return Math.min(...cartItems.map((i) => Number(i.current_price)));
    }
    return Math.min(Number(discount_preview || 0), subtotal);
  }

  const discount = getDiscount();
  const total = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    if (!couponCode.trim() || cartItems.length === 0) return;
    setCouponBusy(true);
    setCouponMsg({ text: "", ok: false });
    setAppliedCoupon(null);
    try {
      const r = await api.post("/coupons/validate/", {
        code: couponCode.trim(),
        order_total: subtotal,
      });
      setAppliedCoupon(r.data);
      const { coupon, discount_preview } = r.data;
      const label =
        coupon.discount_type === "free_item"
          ? "Cheapest item will be free!"
          : coupon.discount_type === "percentage"
            ? `${coupon.discount_value}% off applied!`
            : `₱${money(discount_preview)} discount applied!`;
      setCouponMsg({ text: `✅ ${label}`, ok: true });
    } catch (err) {
      const data = (err as { response?: { data?: { needs_claim?: boolean } } })?.response?.data;
      setCouponMsg({
        text: apiErrorMessage(err, "Invalid or expired coupon."),
        ok: false,
        needsClaim: !!data?.needs_claim,
      });
    } finally {
      setCouponBusy(false);
    }
  }

  async function placeOrder() {
    if (cartItems.length === 0) {
      Alert.alert("Cart empty", "Add at least one item from the Menu tab.");
      return;
    }
    setBusy(true);
    try {
      const r = await api.post<Order>("/orders/", {
        note,
        coupon_code: appliedCoupon ? appliedCoupon.coupon.code : "",
        items_payload: cartItems.map((i) => ({
          product: i.id,
          quantity: i.qty,
        })),
      });
      clearCart();
      clearCouponForCheckout();
      setNote("");
      Alert.alert(
        "Order placed",
        `Order #${r.data.id} · Queue ticket #${r.data.queue_ticket?.ticket_number ?? "—"}`,
        [{ text: "View orders", onPress: () => router.push("/(tabs)/orders") }]
      );
    } catch (err) {
      Alert.alert("Order failed", apiErrorMessage(err, "Could not place order."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      <Text style={styles.sub}>Coupons & orders sync with the web app</Text>

      {cartItems.length === 0 ? (
        <Text style={styles.empty}>Your cart is empty. Add items from Menu.</Text>
      ) : (
        <>
          {cartItems.map((i) => (
            <View key={i.id} style={styles.line}>
              <View style={styles.flex}>
                <Text style={styles.itemName}>{i.name}</Text>
                <Text style={styles.itemMeta}>
                  ₱{money(i.current_price)} × {i.qty}
                </Text>
              </View>
              <Text style={styles.itemTotal}>₱{money(i.subtotal)}</Text>
            </View>
          ))}

          <View style={styles.row}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.bold}>₱{money(subtotal)}</Text>
          </View>

          <View style={styles.couponBox}>
            <View style={styles.couponHeader}>
              <Text style={styles.section}>🏷️ Coupon</Text>
              <Pressable onPress={() => router.push("/(tabs)/coupons")}>
                <Text style={styles.claimLink}>Claim coupons</Text>
              </Pressable>
            </View>
            {!appliedCoupon ? (
              <View style={styles.couponRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="CODE"
                  autoCapitalize="characters"
                  value={couponCode}
                  onChangeText={(t) => setCouponCode(t.toUpperCase())}
                />
                <Pressable
                  style={styles.applyBtn}
                  onPress={applyCoupon}
                  disabled={couponBusy}
                >
                  {couponBusy ? (
                    <ActivityIndicator size="small" />
                  ) : (
                    <Text style={styles.applyText}>Apply</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.appliedRow}>
                <Text style={styles.appliedCode}>{appliedCoupon.coupon.code}</Text>
                <Pressable
                  onPress={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponMsg({ text: "", ok: false });
                    clearCouponForCheckout();
                  }}
                >
                  <Text style={styles.remove}>Remove</Text>
                </Pressable>
              </View>
            )}
            {!!couponMsg.text && (
              <View>
                <Text
                  style={[
                    styles.couponMsg,
                    { color: couponMsg.ok ? colors.success : colors.error },
                  ]}
                >
                  {couponMsg.text}
                </Text>
                {couponMsg.needsClaim && (
                  <Pressable onPress={() => router.push("/(tabs)/coupons")}>
                    <Text style={styles.claimLink}>Go to My Coupons →</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {discount > 0 && (
            <View style={styles.row}>
              <Text style={{ color: colors.success }}>Discount</Text>
              <Text style={{ color: colors.success, fontWeight: "700" }}>
                −₱{money(discount)}
              </Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{money(total)}</Text>
          </View>

          <Text style={styles.section}>Special instructions</Text>
          <TextInput
            style={styles.note}
            multiline
            placeholder="e.g. No onions..."
            value={note}
            onChangeText={setNote}
          />

          <Pressable
            style={[styles.placeBtn, busy && styles.disabled]}
            onPress={placeOrder}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeText}>Place Order · ₱{money(total)}</Text>
            )}
          </Pressable>

          <Pressable onPress={clearCart}>
            <Text style={styles.clear}>Clear cart</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800" },
  sub: { fontSize: 12, color: colors.muted, marginBottom: 16 },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
  line: {
    flexDirection: "row",
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flex: { flex: 1 },
  itemName: { fontWeight: "700" },
  itemMeta: { fontSize: 12, color: colors.muted },
  itemTotal: { fontWeight: "800" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  muted: { color: colors.muted },
  bold: { fontWeight: "700" },
  couponBox: { marginTop: 12, marginBottom: 8 },
  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  claimLink: { fontSize: 12, color: "#2563eb", fontWeight: "600" },
  section: { fontWeight: "700", fontSize: 14 },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.card,
    fontFamily: "monospace",
  },
  applyBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  applyText: { fontWeight: "700" },
  appliedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.successBg,
    padding: 12,
    borderRadius: 12,
  },
  appliedCode: { fontWeight: "700", color: colors.success },
  remove: { color: colors.error },
  couponMsg: { fontSize: 12, marginTop: 6 },
  totalLabel: { fontWeight: "800", fontSize: 16 },
  totalValue: { fontWeight: "800", fontSize: 20 },
  note: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  placeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  placeText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  disabled: { opacity: 0.5 },
  clear: { textAlign: "center", color: colors.muted, marginTop: 12 },
});
