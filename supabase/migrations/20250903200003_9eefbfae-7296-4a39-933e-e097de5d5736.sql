-- Update inventory table structure for catfish inventory system
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS specie TEXT DEFAULT 'Catfish',
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS total_kg_supplied NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pieces_supplied INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_stock_kg NUMERIC DEFAULT 0;

-- Update existing columns to match new requirements
ALTER TABLE public.inventory 
ALTER COLUMN cost_price TYPE NUMERIC,
ALTER COLUMN selling_price TYPE NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN public.inventory.cost_price IS 'Cost price per kg in ₦';
COMMENT ON COLUMN public.inventory.selling_price IS 'Selling price per kg in ₦';
COMMENT ON COLUMN public.inventory.total_kg_supplied IS 'Total kg supplied to inventory';
COMMENT ON COLUMN public.inventory.stock_quantity IS 'Current stock quantity in kg';
COMMENT ON COLUMN public.inventory.minimum_stock IS 'Minimum stock threshold in pieces (deprecated)';
COMMENT ON COLUMN public.inventory.minimum_stock_kg IS 'Minimum stock threshold in kg';

-- Create stock_updates table if it doesn't exist with proper structure
CREATE TABLE IF NOT EXISTS public.stock_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  supplier_name TEXT,
  driver_name TEXT,
  quantity_added_kg NUMERIC NOT NULL,
  pieces_added INTEGER,
  update_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS on stock_updates
ALTER TABLE public.stock_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for stock_updates
CREATE POLICY "Users can view their own stock updates" 
ON public.stock_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory 
    WHERE inventory.id = stock_updates.inventory_id 
    AND inventory.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert stock updates for their inventory" 
ON public.stock_updates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inventory 
    WHERE inventory.id = stock_updates.inventory_id 
    AND inventory.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own stock updates" 
ON public.stock_updates 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory 
    WHERE inventory.id = stock_updates.inventory_id 
    AND inventory.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own stock updates" 
ON public.stock_updates 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.inventory 
    WHERE inventory.id = stock_updates.inventory_id 
    AND inventory.user_id = auth.uid()
  )
);

-- Super admin policies for stock_updates
CREATE POLICY "Super admins can view all stock updates" 
ON public.stock_updates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Create trigger for updated_at on stock_updates
CREATE TRIGGER update_stock_updates_updated_at
  BEFORE UPDATE ON public.stock_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
