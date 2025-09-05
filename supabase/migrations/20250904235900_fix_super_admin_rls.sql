-- Drop existing incorrect policies for super admins
DROP POLICY IF EXISTS "Super admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Super admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Super admins can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Super admins can view all sale items" ON public.sale_items;
DROP POLICY IF EXISTS "Super admins can view all purchases" ON public.purchases;
DROP POLICY IF EXISTS "Super admins can view all purchase items" ON public.purchase_items;
DROP POLICY IF EXISTS "Super admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Super admins can view all expenses" ON public.expenses;

-- Create new, correct policies for super admins with full access
CREATE POLICY "Super admins can manage all customers" ON public.customers FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
CREATE POLICY "Super admins can manage all products" ON public.products FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
CREATE POLICY "Super admins can manage all sales" ON public.sales FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
CREATE POLICY "Super admins can manage all sale items" ON public.sale_items FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
CREATE POLICY "Super admins can manage all purchases" ON public.purchases FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
CREATE POLICY "Super admins can manage all purchase items" ON public.purchase_items FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
CREATE POLICY "Super admins can manage all payments" ON public.payments FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
CREATE POLICY "Super admins can manage all expenses" ON public.expenses FOR ALL USING (public.get_user_role(auth.uid()) = 'super_admin') WITH CHECK (public.get_user_role(auth.uid()) = 'super_admin');
