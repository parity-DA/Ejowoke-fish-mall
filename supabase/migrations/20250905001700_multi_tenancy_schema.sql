-- Part 1: Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Part 2: Add business_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Part 3: Add business_id to all data tables
ALTER TABLE public.customers
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.products
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.sales
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.sale_items
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.purchases
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_items
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.payments
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.expenses
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

ALTER TABLE public.stock_updates
ADD COLUMN business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Part 4: Create get_user_business_id function
CREATE OR REPLACE FUNCTION public.get_user_business_id(user_uuid UUID)
RETURNS UUID AS $$
  SELECT business_id FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Part 5: Rewrite RLS Policies for Multi-Tenancy

-- Drop old user-specific policies
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Users can manage their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can manage sale items for their sales" ON public.sale_items;
DROP POLICY IF EXISTS "Users can manage their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can manage purchase items for their purchases" ON public.purchase_items;
DROP POLICY IF EXISTS "Users can manage their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage their own stock data" ON public.stock_updates;

-- Drop old super-admin policies
DROP POLICY IF EXISTS "Super admins can manage all customers" ON public.customers;
DROP POLICY IF EXISTS "Super admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Super admins can manage all sales" ON public.sales;
DROP POLICY IF EXISTS "Super admins can manage all sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Super admins can manage all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Super admins can manage all purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Super admins can manage all payments" ON public.payments;
DROP POLICY IF EXISTS "Super admins can manage all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Super admins have full access to stock updates" ON public.stock_updates;


-- Create new business-level policies
CREATE POLICY "Users can manage data within their own business" ON public.customers FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.products FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.sales FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.sale_items FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.purchases FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.purchase_items FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.payments FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.expenses FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));
CREATE POLICY "Users can manage data within their own business" ON public.stock_updates FOR ALL USING (business_id = public.get_user_business_id(auth.uid())) WITH CHECK (business_id = public.get_user_business_id(auth.uid()));

-- Part 6: Create function to handle new user setup
CREATE OR REPLACE FUNCTION public.create_business_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_business_id UUID;
BEGIN
  -- Create a new business
  INSERT INTO public.businesses (name)
  VALUES (NEW.raw_user_meta_data->>'full_name' || '''s Business')
  RETURNING id INTO new_business_id;

  -- Update the user's profile with the new business_id
  UPDATE public.profiles
  SET business_id = new_business_id
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_business_for_user();
