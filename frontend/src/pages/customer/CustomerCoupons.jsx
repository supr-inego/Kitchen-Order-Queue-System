import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { apiDetail, saveCouponForCheckout } from "../../utils/couponWallet";
import { discountLabel, money } from "../../utils/orderTotals";

export default function CustomerCoupons() {
  const navigate = useNavigate();
  const [available, setAvailable] = useState([]);
  const [wallet, setWallet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimBusy, setClaimBusy] = useState(null);
  const [msg, setMsg] = useState({ text: "", ok: false });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [availRes, walletRes] = await Promise.all([
        api.get("/coupons/available/"),
        api.get("/coupons/mine/"),
      ]);
      setAvailable(Array.isArray(availRes.data) ? availRes.data : []);
      setWallet(Array.isArray(walletRes.data) ? walletRes.data : []);
    } catch (err) {
      setMsg({ text: apiDetail(err, "Could not load coupons."), ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleClaim(code) {
    setClaimBusy(code);
    setMsg({ text: "", ok: false });
    try {
      const r = await api.post("/coupons/claim/", { code });
      setMsg({ text: r.data.message || "Coupon claimed!", ok: true });
      loadAll();
    } catch (err) {
      setMsg({ text: apiDetail(err, "Could not claim coupon."), ok: false });
    } finally {
      setClaimBusy(null);
    }
  }

  function useOnOrder(claim) {
    saveCouponForCheckout({
      coupon: claim.coupon,
      discount_preview: null,
      claim_id: claim.id,
    });
    navigate("/order");
  }

  const walletReady = wallet.filter((w) => !w.is_used);
  const walletUsed = wallet.filter((w) => w.is_used);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Coupons & Promotions</h1>
        <p className="text-sm text-gray-500 mt-1">
          All active offers from the restaurant appear here. Claim one, then use it at checkout — same on web and mobile.
        </p>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <strong>No code needed:</strong> Staff create promotions in admin. You’ll see them below — tap{" "}
        <strong>Claim</strong> to save to your wallet, then <strong>Use on order</strong> when you checkout.
      </div>

      {msg.text && (
        <div
          className={`rounded-2xl p-4 text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
        >
          {msg.text}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-extrabold text-lg">Available promotions</h2>
        {loading ? (
          <p className="text-gray-400">Loading promotions...</p>
        ) : available.length === 0 ? (
          <div className="rounded-2xl bg-white border p-8 text-center text-gray-400">
            No active promotions right now. Check back later.
          </div>
        ) : (
          available.map((row) => {
            const c = row.coupon;
            const busy = claimBusy === c.code;
            return (
              <div
                key={c.id}
                className="rounded-2xl bg-white border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="font-extrabold text-xl font-mono">{c.code}</div>
                  {c.description && <p className="text-sm text-gray-500 mt-1">{c.description}</p>}
                  <p className="text-sm font-semibold text-green-700 mt-1">{discountLabel(c)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Number(c.min_order_total) > 0 && <>Min. order ₱{money(c.min_order_total)} · </>}
                    {row.status_message}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  {row.in_wallet && row.wallet_claim_id ? (
                    <button
                      type="button"
                      onClick={() =>
                        useOnOrder({
                          id: row.wallet_claim_id,
                          coupon: c,
                        })
                      }
                      className="rounded-xl bg-black text-white px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
                    >
                      Use on order →
                    </button>
                  ) : row.can_claim ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleClaim(c.code)}
                      className="rounded-xl bg-black text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-40 whitespace-nowrap"
                    >
                      {busy ? "Claiming..." : "Claim coupon"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium px-2">{row.status_message}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {walletReady.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-extrabold text-lg">Your wallet ({walletReady.length})</h2>
          {walletReady.map((claim) => {
            const c = claim.coupon;
            return (
              <div
                key={claim.id}
                className="rounded-2xl bg-green-50 border border-green-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="font-mono font-bold text-lg">{c.code}</span>
                  <p className="text-sm text-green-800">{discountLabel(c)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => useOnOrder(claim)}
                  className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold"
                >
                  Use on order →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {walletUsed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-extrabold text-lg text-gray-500">Already used ({walletUsed.length})</h2>
          {walletUsed.map((claim) => (
            <div key={claim.id} className="rounded-2xl bg-gray-50 border p-4 opacity-70">
              <span className="font-mono font-bold line-through">{claim.coupon.code}</span>
              <span className="text-xs text-gray-400 ml-2">
                Used {claim.used_at ? new Date(claim.used_at).toLocaleDateString() : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">
        Ready to order? <Link to="/order" className="underline font-semibold text-black">Go to menu & cart</Link>
      </p>
    </div>
  );
}
