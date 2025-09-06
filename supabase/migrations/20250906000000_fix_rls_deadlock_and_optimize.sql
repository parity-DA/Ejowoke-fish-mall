-- Step 1: Drop all existing RLS policies on the affected tables to start clean.
-- These policies are causing deadlocks or are conflicting.

-- Drop business-level policies from the first migration
DROP POLICY IF EXISTS "Users can view their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.customers;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.products;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.sales;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.sale_items;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.purchases;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.payments;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.stock_updates;
DROP POLICY IF EXISTS "Users can manage data within their own business" ON public.inventory; -- Assuming this was added

-- Drop user-id based policies from the second migration
DROP POLICY IF EXISTS "Users can manage their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can manage sale items for their sales" ON public.sale_items;
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can manage purchase items for their purchases" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage their own stock updates" ON public.stock_updates;

-- Also drop policies on profiles and user_roles if they exist, to be safe
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Step 2: Create a secure function to get the business_id for the current user.
-- This function will be used in the new RLS policies.
-- It avoids the deadlock by not being used on the `profiles` table itself.
CREATE OR REPLACE FUNCTION public.get_current_user_business_id()
RETURNS UUID AS $$
DECLARE
  business_uuid UUID;
BEGIN
  SELECT business_id INTO business_uuid FROM public.profiles WHERE user_id = auth.uid();
  RETURN business_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Re-create RLS policies correctly.

-- Enable RLS on tables if it's not already enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- Add for any other tables that need it

-- Policy for profiles: Users can see and edit their own profile.
-- This is the key to breaking the deadlock. It does NOT use the function.
CREATE POLICY "Users can manage their own profile" ON public.profiles
FOR ALL USING (auth.uid() = user_id);

-- Policy for user_roles: Users can see their own role.
-- Admins/super_admins might need broader access, but this is the safe baseline.
CREATE POLICY "Users can view their own role" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

-- A super_admin should be able to see all roles and profiles.
CREATE POLICY "Super admins can manage all profiles and roles" ON public.profiles
FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all profiles and roles" ON public.user_roles
FOR ALL USING (public.is_super_admin(auth.uid()));


-- Policies for data tables, now using the non-deadlocking function.
CREATE POLICY "Business-level access for customers" ON public.customers
FOR ALL USING (business_id = public.get_current_user_business_id())
WITH CHECK (business_id = public.get_current_user_business_id());

CREATE POLICY "Business-level access for products" ON public.products
FOR ALL USING (business_id = public.get_current_user_business_id())
WITH CHECK (business_id = public.get_current_user_business_id());

CREATE POLICY "Business-level access for inventory" ON public.inventory
FOR ALL USING (business_id = public.get_current_user_business_id())
WITH CHECK (business_id = public.get_current_user_business_id());

CREATE POLICY "Business-level access for sales" ON public.sales
FOR ALL USING (business_id = public.get_current_user_business_id())
WITH CHECK (business_id = public.get_current_user_business_id());

CREATE POLICY "Business-level access for sale_items" ON public.sale_items
FOR ALL USING (business_id = public.get_current_user_business_id())
WITH CHECK (business_id = public.get_current_user_business_id());

CREATE POLICY "Business-level access for expenses" ON public.expenses
FOR ALL USING (business_id = public.get_current_user_business_id())
WITH CHECK (business_id = public.get_current_user_business_id());

CREATE POLICY "Business-level access for businesses" ON public.businesses
FOR ALL USING (id = public.get_current_user_business_id())
WITH CHECK (id = public.get_current_user_business_id());

-- Step 4: Create an RPC function to handle the complex dashboard query.
-- This moves the logic from the client to the database for performance and security.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(target_date TEXT)
RETURNS JSONB AS $$
DECLARE
  business_uuid UUID;
  stats JSONB;
BEGIN
  -- Get the business_id for the current user
  business_uuid := public.get_current_user_business_id();

  -- Calculate start and end timestamps for the target date
  -- Example: '2023-10-27' becomes '2023-10-27T00:00:00' to '2023-10-28T00:00:00'
  -- This is a simplified example; a robust implementation would handle timezones carefully.
  -- For this fix, we assume target_date is in 'YYYY-MM-DD' format.

  -- Aggregate all stats in a single query for efficiency
  SELECT jsonb_build_object(
    'todaySales', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM public.sales
      WHERE business_id = business_uuid AND status = 'completed'
      AND created_at >= target_date::date AND created_at < (target_date::date + INTERVAL '1 day')
    ),
    'totalSales', (
      SELECT COALESCE(SUM(total_amount), 0)
      FROM public.sales
      WHERE business_id = business_uuid AND status = 'completed'
    ),
    'totalCustomers', (
      SELECT COUNT(DISTINCT customer_id)
      FROM public.sales
      WHERE business_id = business_uuid AND status = 'completed'
      AND created_at >= target_date::date AND created_at < (target_date::date + INTERVAL '1 day')
    ),
    'totalPiecesRemaining', (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM public.inventory
        WHERE business_id = business_uuid
    ),
    'recentSales', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'customer_name', COALESCE(c.name, 'Walk-in Customer'),
          'amount', s.total_amount,
          'time', to_char(s.created_at, 'YYYY-MM-DD HH24:MI:SS'),
          'status', s.status
        )
      ), '[]'::jsonb)
      FROM (
        SELECT * FROM public.sales
        WHERE business_id = business_uuid
        AND created_at >= target_date::date AND created_at < (target_date::date + INTERVAL '1 day')
        ORDER BY created_at DESC
        LIMIT 5
      ) s
      LEFT JOIN public.customers c ON s.customer_id = c.id
    ),
    'lowStockAlerts', (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', i.id,
                'name', i.name,
                'current_stock', i.stock_quantity,
                'minimum_stock', i.minimum_stock
            )
        ), '[]'::jsonb)
        FROM public.inventory i
        WHERE i.business_id = business_uuid AND i.stock_quantity <= i.minimum_stock
    )
    -- Add other stats as needed...
  ) INTO stats;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Drop the old, problematic function
DROP FUNCTION IF EXISTS public.get_user_business_id(user_uuid UUID) CASCADE;
