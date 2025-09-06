-- Re-introduce user_id-based RLS policies for multi-tenancy compatibility
-- This allows the frontend to continue using user_id for queries while
-- the business_id logic can coexist for other purposes.

-- Policies for tables used in the dashboard
CREATE POLICY "Users can manage their own sales" ON public.sales FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage sale items for their sales" ON public.sale_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.sales WHERE public.sales.id = public.sale_items.sale_id AND public.sales.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.sales WHERE public.sales.id = public.sale_items.sale_id AND public.sales.user_id = auth.uid()));

CREATE POLICY "Users can manage their own inventory" ON public.inventory FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own customers" ON public.customers FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for other tables to ensure consistency
CREATE POLICY "Users can manage their own products" ON public.products FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own purchases" ON public.purchases FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage purchase items for their purchases" ON public.purchase_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.purchases WHERE public.purchases.id = public.purchase_items.purchase_id AND public.purchases.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.purchases WHERE public.purchases.id = public.purchase_items.purchase_id AND public.purchases.user_id = auth.uid()));

CREATE POLICY "Users can manage their own payments" ON public.payments FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expenses" ON public.expenses FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own stock updates" ON public.stock_updates FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
