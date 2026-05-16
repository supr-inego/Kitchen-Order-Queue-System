export type UserRole = "admin" | "customer";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  address: string;
  age: number | null;
  birthday: string | null;
  phone: string;
  role: UserRole;
  is_active: boolean;
  date_joined: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  current_price: string;
  category: string;
  is_available: boolean;
  image_url: string;
}

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed" | "free_item";
  discount_value: string;
  min_order_total: string;
}

export interface AppliedCoupon {
  coupon: Coupon;
  discount_preview: number | null;
}

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  unit_price: string;
}

export interface QueueTicket {
  id: number;
  ticket_number: number;
  status: string;
}

export interface Order {
  id: number;
  note: string;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  subtotal?: number;
  total_price: number;
  discount_amount: string;
  coupon_info?: Coupon | null;
  coupon_code_display?: string | null;
  customer_name?: string;
  customer_email?: string;
  queue_ticket?: QueueTicket | null;
}
