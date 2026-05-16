import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { AppliedCoupon, Product } from "@/types";

type CartMap = Record<number, number>;

interface CartContextValue {
  cart: CartMap;
  products: Product[];
  setProducts: (p: Product[]) => void;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
  appliedCoupon: AppliedCoupon | null;
  setAppliedCoupon: (c: AppliedCoupon | null) => void;
  couponCode: string;
  setCouponCode: (c: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartMap>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponCode, setCouponCode] = useState("");

  const addToCart = useCallback((id: number) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => {
      const n = (prev[id] || 0) - 1;
      if (n <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: n };
    });
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      setCart((prev) => ({ ...prev, [id]: qty }));
    }
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    setAppliedCoupon(null);
    setCouponCode("");
  }, []);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((s, q) => s + q, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      products,
      setProducts,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      cartCount,
      appliedCoupon,
      setAppliedCoupon,
      couponCode,
      setCouponCode,
    }),
    [
      cart,
      products,
      addToCart,
      removeFromCart,
      setQty,
      clearCart,
      cartCount,
      appliedCoupon,
      couponCode,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
