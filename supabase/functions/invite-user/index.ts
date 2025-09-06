import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { InvitationEmail } from './invitation-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  inviterName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user is authenticated and is super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is super admin and get their profile
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role, business_id')
      .eq('user_id', user.id)
      .single();

    if (adminProfileError || adminProfile?.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Only super admins can invite users." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, role, inviterName }: InviteUserRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a temporary password
    const tempPassword = generatePassword();

    // Create user account using Supabase Admin API
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        invited: true,
        invited_by: user.id,
        role: role
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Assign role to the new user using the database function
    const { error: roleAssignError } = await supabase.rpc('assign_user_role', {
      target_user_id: newUser.user.id,
      new_role: role,
      assigner_id: user.id
    });

    if (roleAssignError) {
      console.error("Error assigning role:", roleAssignError);
    }

    // Create profile for the new user
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: newUser.user.id,
        email: email,
        full_name: '', // Will be filled by user
        business_id: adminProfile.business_id,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
    }

    // Store invitation record
    const { error: inviteError } = await supabase
      .from('user_invitations')
      .insert({
        email: email,
        role: role,
        temporary_password: tempPassword,
        invited_by: user.id,
        status: 'sent'
      });

    if (inviteError) {
      console.error("Error storing invitation:", inviteError);
    }

    // Send invitation email
    const html = await renderAsync(
      React.createElement(InvitationEmail, {
        invitedEmail: email,
        temporaryPassword: tempPassword,
        role: role,
        inviterName: inviterName || 'Administrator',
        loginUrl: `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/v1/authorize?redirect_to=${encodeURIComponent(req.headers.get('origin') || '')}/auth`
      })
    );

    const emailResult = await resend.emails.send({
      from: "EJowoke Fish Mall <onboarding@resend.dev>",
      to: [email],
      subject: `You've been invited to EJowoke Fish Mall`,
      html: html,
    });

    console.log("Invitation sent successfully:", emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "User invited successfully",
        user: {
          id: newUser.user.id,
          email: email,
          role: role
        },
        temporaryPassword: tempPassword
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: unknown) {
    console.error("Error in invite-user function:", error);
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

serve(handler);
