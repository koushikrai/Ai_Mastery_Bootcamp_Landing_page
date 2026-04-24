-- Run this in your Supabase SQL Editor

-- 1. Create the pricing table
CREATE TABLE IF NOT EXISTS public.asdc_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id text NOT NULL,
  variant_key text NOT NULL DEFAULT 'default',
  price numeric NOT NULL,
  original_price numeric NOT NULL,
  coupon_enabled boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, variant_key)
);

-- 2. Create the coupons table
CREATE TABLE IF NOT EXISTS public.asdc_coupons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_amount numeric NOT NULL,
  applicable_product_id text NOT NULL,
  applicable_variant_key text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Set up Row Level Security (RLS)
-- Enable RLS on the tables
ALTER TABLE public.asdc_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asdc_coupons ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public READ access (so the website can fetch the prices and validate coupons)
CREATE POLICY "Allow public read access for pricing" ON public.asdc_pricing
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access for coupons" ON public.asdc_coupons
  FOR SELECT USING (true);

-- Create policies to allow public INSERT/UPDATE/DELETE access 
-- (⚠️ NOTE: Since we are using the Anon Key on the admin panel without Auth for now, we need to allow public edits. For a production app, you should lock this down to authenticated admins only).
CREATE POLICY "Allow public all access for pricing admin" ON public.asdc_pricing
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access for coupons admin" ON public.asdc_coupons
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed initial data
INSERT INTO public.asdc_pricing (product_id, variant_key, original_price, price, coupon_enabled)
VALUES 
  ('kids', 'Batch 1', 11999, 7999, true),
  ('pro', 'Batch 1', 14999, 9999, true)
ON CONFLICT (product_id, variant_key) DO NOTHING;

INSERT INTO public.asdc_coupons (code, discount_amount, applicable_product_id, applicable_variant_key, is_active)
VALUES 
  ('WELCOME2000', 2000, 'kids', null, true)
ON CONFLICT (code) DO NOTHING;
