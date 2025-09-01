-- Create helper functions for user role management using text instead of enum
CREATE OR REPLACE FUNCTION public.assign_user_role(
  target_user_id UUID,
  new_role TEXT,
  assigner_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove existing role for this user (only one role per user)
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Insert new role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role::app_role, assigner_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_user_role(
  target_user_id UUID,
  role_to_remove TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_roles 
  WHERE user_id = target_user_id AND role = role_to_remove::app_role;
  
  -- If no roles left, assign default 'user' role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'user');
  END IF;
END;
$$;
