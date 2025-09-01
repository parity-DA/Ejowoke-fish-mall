-- Create business_settings table for persistent business configuration
CREATE TABLE public.business_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL DEFAULT 'My Business',
    address TEXT,
    phone TEXT,
    email TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    low_stock_threshold INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own business settings" 
ON public.business_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own business settings" 
ON public.business_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business settings" 
ON public.business_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all business settings" 
ON public.business_settings 
FOR SELECT 
USING (is_super_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix the user roles constraint issue by using the existing database function
-- Update the assignRole function to use the database function instead of direct SQL
