-- Add pieces_sold column to sale_items table
ALTER TABLE public.sale_items 
ADD COLUMN pieces_sold INTEGER DEFAULT 0;
