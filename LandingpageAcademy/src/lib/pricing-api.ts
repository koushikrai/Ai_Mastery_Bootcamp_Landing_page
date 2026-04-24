import { supabase } from '../supabase-client';

export type ProductPricing = {
  id?: string;
  product_id: string; // e.g., 'kids-camp' or 'pro-bootcamp'
  variant_key: string; // e.g., 'batch-1'
  price: number;
  original_price: number;
  coupon_enabled: boolean;
  updated_at?: string;
};

export type CouponCode = {
  id?: string;
  code: string;
  discount_amount: number;
  applicable_product_id: string; // e.g., 'kids-camp'
  applicable_variant_key: string | null; // null = all variants
  is_active: boolean;
  created_at?: string;
};

// ─── Pricing ──────────────────────────────────────────────────────────

export const getProductPricing = async (): Promise<ProductPricing[]> => {
  const { data, error } = await supabase
    .from("asdc_pricing")
    .select("*")
    .order("product_id");
  if (error) {
    console.error("Error fetching pricing:", error.message);
    return [];
  }
  return data || [];
};

export const upsertProductPrice = async (
  row: Omit<ProductPricing, "id" | "updated_at">
): Promise<ProductPricing> => {
  const { data, error } = await supabase
    .from("asdc_pricing")
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "product_id,variant_key" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

// ─── Coupons ─────────────────────────────────────────────────────────────

export const getCouponCodes = async (): Promise<CouponCode[]> => {
  const { data, error } = await supabase
    .from("asdc_coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching coupons:", error.message);
    return [];
  }
  return data || [];
};

export const createCouponCode = async (
  coupon: Omit<CouponCode, "id" | "created_at">
): Promise<CouponCode> => {
  const { data, error } = await supabase
    .from("asdc_coupons")
    .insert(coupon)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const updateCouponCode = async (
  id: string,
  updates: Partial<CouponCode>
): Promise<CouponCode> => {
  const { data, error } = await supabase
    .from("asdc_coupons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteCouponCode = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("asdc_coupons")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
};

/**
 * Validate a coupon code submitted by a customer.
 * Returns the discount amount if valid, or null if invalid/inactive.
 */
export const validateCouponCode = async (
  code: string,
  productId: string,
  variantKey: string
): Promise<{ discount: number; message: string } | null> => {
  const { data, error } = await supabase
    .from("asdc_coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("applicable_product_id", productId)
    .eq("is_active", true)
    .limit(1);

  if (error || !data || data.length === 0) return null;

  const coupon = data[0] as CouponCode;

  // If the coupon is tied to a specific variant, check it matches
  if (coupon.applicable_variant_key && coupon.applicable_variant_key !== variantKey) {
    return null;
  }

  return {
    discount: coupon.discount_amount,
    message: `Promo code applied! ₹${coupon.discount_amount.toLocaleString()} discount.`,
  };
};
