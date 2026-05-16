import { useCallback, useEffect, useState } from "react";

import {

  View,

  Text,

  Pressable,

  StyleSheet,

  ScrollView,

  ActivityIndicator,

} from "react-native";

import { router } from "expo-router";

import { api, apiErrorMessage } from "@/api/client";

import { saveCouponForCheckout } from "@/utils/couponWallet";

import { colors } from "@/constants/theme";

import { discountLabel, money } from "@/utils/orderTotals";
import type { Coupon } from "@/types";



interface CouponData {

  code: string;

  description: string;

  discount_type: string;

  discount_value: string;

  min_order_total: string;

  id: number;

}



interface AvailableRow {

  coupon: CouponData;

  status: string;

  can_claim: boolean;

  in_wallet: boolean;

  wallet_claim_id: number | null;

  status_message: string;

}



interface WalletClaim {

  id: number;

  is_used: boolean;

  coupon: CouponData;

}



export default function CouponsScreen() {

  const [available, setAvailable] = useState<AvailableRow[]>([]);

  const [wallet, setWallet] = useState<WalletClaim[]>([]);

  const [loading, setLoading] = useState(true);

  const [claimBusy, setClaimBusy] = useState<string | null>(null);

  const [msg, setMsg] = useState({ text: "", ok: false });



  const load = useCallback(async () => {

    setLoading(true);

    try {

      const [availRes, walletRes] = await Promise.all([

        api.get<AvailableRow[]>("/coupons/available/"),

        api.get<WalletClaim[]>("/coupons/mine/"),

      ]);

      setAvailable(Array.isArray(availRes.data) ? availRes.data : []);

      setWallet(Array.isArray(walletRes.data) ? walletRes.data : []);

    } catch (err) {

      setMsg({ text: apiErrorMessage(err, "Could not load coupons."), ok: false });

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    load();

  }, [load]);



  async function claimCode(code: string) {

    setClaimBusy(code);

    setMsg({ text: "", ok: false });

    try {

      const r = await api.post("/coupons/claim/", { code });

      setMsg({ text: r.data.message || "Claimed!", ok: true });

      load();

    } catch (err) {

      setMsg({ text: apiErrorMessage(err, "Could not claim."), ok: false });

    } finally {

      setClaimBusy(null);

    }

  }



  const walletReady = wallet.filter((w) => !w.is_used);



  return (

    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>Coupons & Promotions</Text>

      <Text style={styles.sub}>

        All active offers appear here — no code search needed. Claim, then use at checkout.

      </Text>



      {!!msg.text && (

        <Text style={[styles.msg, { color: msg.ok ? colors.success : colors.error }]}>{msg.text}</Text>

      )}



      <Text style={styles.section}>Available promotions</Text>

      {loading ? (

        <ActivityIndicator color={colors.primary} />

      ) : available.length === 0 ? (

        <Text style={styles.empty}>No active promotions right now.</Text>

      ) : (

        available.map((row) => {

          const c = row.coupon;

          const busy = claimBusy === c.code;

          return (

            <View key={c.id} style={styles.card}>

              <Text style={styles.code}>{c.code}</Text>

              {!!c.description && <Text style={styles.desc}>{c.description}</Text>}

              <Text style={styles.discount}>{discountLabel(c as Coupon)}</Text>

              <Text style={styles.hint}>

                {Number(c.min_order_total) > 0 ? `Min. ₱${money(c.min_order_total)} · ` : ""}

                {row.status_message}

              </Text>

              {row.in_wallet && row.wallet_claim_id ? (

                <Pressable

                  style={styles.useBtn}

                  onPress={() => {

                    saveCouponForCheckout({ coupon: c as Coupon });

                    router.push("/(tabs)/cart");

                  }}

                >

                  <Text style={styles.useText}>Use on order</Text>

                </Pressable>

              ) : row.can_claim ? (

                <Pressable style={styles.useBtn} onPress={() => claimCode(c.code)} disabled={busy}>

                  {busy ? (

                    <ActivityIndicator color="#fff" />

                  ) : (

                    <Text style={styles.useText}>Claim coupon</Text>

                  )}

                </Pressable>

              ) : null}

            </View>

          );

        })

      )}



      {walletReady.length > 0 && (

        <>

          <Text style={[styles.section, { marginTop: 20 }]}>Your wallet ({walletReady.length})</Text>

          {walletReady.map((claim) => (

            <View key={claim.id} style={[styles.card, styles.walletCard]}>

              <Text style={styles.code}>{claim.coupon.code}</Text>

              <Text style={styles.discount}>{discountLabel(claim.coupon as Coupon)}</Text>

              <Pressable

                style={styles.useBtn}

                onPress={() => {

                  saveCouponForCheckout({ coupon: claim.coupon as Coupon });

                  router.push("/(tabs)/cart");

                }}

              >

                <Text style={styles.useText}>Use on order</Text>

              </Pressable>

            </View>

          ))}

        </>

      )}

    </ScrollView>

  );

}



const styles = StyleSheet.create({

  container: { padding: 16, paddingBottom: 40 },

  title: { fontSize: 26, fontWeight: "800" },

  sub: { color: colors.muted, marginBottom: 16, fontSize: 13 },

  msg: { marginBottom: 12, fontSize: 13 },

  section: { fontWeight: "800", fontSize: 16, marginBottom: 8 },

  empty: { color: colors.muted, textAlign: "center", marginTop: 20 },

  card: {

    backgroundColor: colors.card,

    borderRadius: 14,

    padding: 14,

    marginBottom: 10,

    borderWidth: 1,

    borderColor: colors.border,

  },

  walletCard: { backgroundColor: "#ecfdf5", borderColor: "#86efac" },

  code: { fontFamily: "monospace", fontWeight: "800", fontSize: 18 },

  desc: { color: colors.muted, fontSize: 13, marginTop: 4 },

  discount: { color: colors.success, fontWeight: "600", marginTop: 4 },

  hint: { color: colors.muted, fontSize: 11, marginTop: 6 },

  useBtn: {

    marginTop: 10,

    backgroundColor: colors.primary,

    borderRadius: 10,

    padding: 10,

    alignItems: "center",

  },

  useText: { color: "#fff", fontWeight: "700" },

});


