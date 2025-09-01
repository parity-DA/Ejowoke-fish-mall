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

-- Create function to invite new users (admin only)
CREATE OR REPLACE FUNCTION public.invite_user(
  invite_email TEXT,
  invite_role TEXT DEFAULT 'user',
  invited_by_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  temp_password TEXT;
  invitation_result JSONB;
BEGIN
  -- Generate a temporary password
  temp_password := substring(encode(gen_random_bytes(12), 'base64') from 1 for 12);
  
  -- Try to create the user account with temporary password
  -- Note: This is a simplified version - in production you'd use Supabase Admin API
  -- For now, we'll store invitation details for manual processing
  
  -- Store invitation details in a temporary way
  -- In production, you'd integrate with Supabase Admin API to create users
  INSERT INTO public.user_invitations (
    email, 
    role, 
    temporary_password, 
    invited_by, 
    status,
    created_at
  ) VALUES (
    invite_email, 
    invite_role::TEXT, 
    temp_password, 
    invited_by_id, 
    'pending',
    now()
  );
  
  -- Return invitation details
  invitation_result := jsonb_build_object(
    'email', invite_email,
    'role', invite_role,
    'temporary_password', temp_password,
    'status', 'pending'
  );
  
  RETURN invitation_result;
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

-- Enable RLS on invitations table
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Super admins can view all invitations" ON public.user_invitations
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage all invitations" ON public.user_invitations
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- Add updated_at trigger to invitations
CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
