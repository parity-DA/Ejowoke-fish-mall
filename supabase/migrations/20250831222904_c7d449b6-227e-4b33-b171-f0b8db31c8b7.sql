-- Add missing business fields to customers table
ALTER TABLE public.customers 
ADD COLUMN channel TEXT DEFAULT 'walk-in' CHECK (channel IN ('walk-in', 'retailer', 'restaurant', 'wholesaler')),
ADD COLUMN credit_limit DECIMAL(10,2) DEFAULT 0,
ADD COLUMN outstanding_balance DECIMAL(10,2) DEFAULT 0,
ADD COLUMN total_purchases DECIMAL(10,2) DEFAULT 0,
ADD COLUMN last_purchase_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN notes TEXT;
