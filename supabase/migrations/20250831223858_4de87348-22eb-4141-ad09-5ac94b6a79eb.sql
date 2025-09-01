-- Check if user_roles table exists and create if not
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    assigned_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Create security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- Create policies using security definer functions
CREATE POLICY "Super admins can view all user roles" ON public.user_roles
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Fix the profiles table policy
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Create trigger to automatically assign 'user' role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign default 'user' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for new user role assignment (only if not exists)
DROP TRIGGER IF EXISTS on_auth_user_role_created ON auth.users;
CREATE TRIGGER on_auth_user_role_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Add updated_at trigger to user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
