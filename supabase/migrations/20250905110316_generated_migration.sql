-- Add business_id to expenses table
ALTER TABLE public.expenses ADD COLUMN business_id UUID;

-- Add foreign key constraint for business_id in expenses table
ALTER TABLE public.expenses ADD CONSTRAINT expenses_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Add business_id to payments table
ALTER TABLE public.payments ADD COLUMN business_id UUID;

-- Add foreign key constraint for business_id in payments table
ALTER TABLE public.payments ADD CONSTRAINT payments_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Enable Row Level Security for expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting expenses
CREATE POLICY "Enable read access for own business" ON public.expenses FOR SELECT USING (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Create policy for inserting expenses
CREATE POLICY "Enable insert for own business" ON public.expenses FOR INSERT WITH CHECK (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Create policy for updating expenses
CREATE POLICY "Enable update for own business" ON public.expenses FOR UPDATE USING (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Create policy for deleting expenses
CREATE POLICY "Enable delete for own business" ON public.expenses FOR DELETE USING (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Enable Row Level Security for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policy for selecting payments
CREATE POLICY "Enable read access for own business" ON public.payments FOR SELECT USING (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Create policy for inserting payments
CREATE POLICY "Enable insert for own business" ON public.payments FOR INSERT WITH CHECK (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Create policy for updating payments
CREATE POLICY "Enable update for own business" ON public.payments FOR UPDATE USING (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));

-- Create policy for deleting payments
CREATE POLICY "Enable delete for own business" ON public.payments FOR DELETE USING (business_id = (SELECT business_id FROM public.user_profiles WHERE user_id = auth.uid()));
