-- Add user_id column to stock_updates table
ALTER TABLE public.stock_updates 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update existing stock_updates to link with user_id from inventory table
UPDATE public.stock_updates 
SET user_id = i.user_id 
FROM public.inventory i 
WHERE stock_updates.inventory_id = i.id;
