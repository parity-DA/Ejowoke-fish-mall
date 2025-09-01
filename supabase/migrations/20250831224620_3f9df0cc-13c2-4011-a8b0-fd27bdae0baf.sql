-- Update the trigger to assign super_admin role to new users instead of user role
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign 'super_admin' role to new users by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'super_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create user invitations table to track invites
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    temporary_password TEXT,
    invited_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
    UNIQUE(email, status) -- Prevent duplicate pending invitations
);

-- Enable RLS on invitations table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'user_invitations' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;
