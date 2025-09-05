-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own stock updates" ON public.stock_updates;
DROP POLICY IF EXISTS "Users can insert stock updates for their inventory" ON public.stock_updates;

-- Grant broad access to admins and super_admins
-- Grant SELECT and INSERT access to admins and super_admins
CREATE POLICY "Admins can view and add stock updates"
ON public.stock_updates
FOR SELECT, INSERT
USING (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Grant full access to super_admins
CREATE POLICY "Super admins have full access to stock updates"
ON public.stock_updates
FOR ALL
USING (get_user_role(auth.uid()) = 'super_admin')
WITH CHECK (get_user_role(auth.uid()) = 'super_admin');

-- Re-create specific policies for regular users
CREATE POLICY "Users can manage their own stock data"
ON public.stock_updates
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.inventory
        WHERE inventory.id = stock_updates.inventory_id
        AND inventory.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.inventory
        WHERE inventory.id = stock_updates.inventory_id
        AND inventory.user_id = auth.uid()
    )
);
