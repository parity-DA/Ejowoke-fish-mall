-- Check current enum values for fish_size
SELECT unnest(enum_range(NULL::fish_size)) AS enum_values;

-- Change the size column from enum to text to allow custom sizes
ALTER TABLE public.inventory 
ALTER COLUMN size TYPE text;
