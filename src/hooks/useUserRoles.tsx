import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type UserRole = 'super_admin' | 'admin' | 'user';

interface UserWithRole {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

interface UserRolesContextType {
  userRole: UserRole | null;
  loading: boolean;
  users: UserWithRole[];
  assignRole: (userId: string, role: UserRole) => Promise<{ error: any }>;
  inviteUser: (email: string, role: UserRole) => Promise<{ error: any; data?: any }>;
  deleteUser: (userId: string) => Promise<{ error: any }>;
  fetchUsers: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const UserRolesContext = createContext<UserRolesContextType | undefined>(undefined);

export const useUserRoles = () => {
  const context = useContext(UserRolesContext);
  if (context === undefined) {
    throw new Error('useUserRoles must be used within a UserRolesProvider');
  }
  return context;
};

export const UserRolesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    try {
      // Use SQL query directly since RPC might not be available
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return 'user';
      }

      return data.role as UserRole;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }
  };

  const fetchUsers = async () => {
    try {
      // Step 1: Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError || !profiles) {
        console.error('Error fetching profiles:', profilesError);
        toast({ title: "Error", description: "Could not fetch user profiles.", variant: "destructive" });
        return;
      }

      // Step 2: Get all user roles in a single query
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        toast({ title: "Error", description: "Could not fetch user roles.", variant: "destructive" });
        // We can still proceed, but users might have default roles
      }
      
      // Step 3: Create a map for quick role lookup
      const roleMap = new Map<string, UserRole>();
      if (roles) {
        for (const role of roles) {
          roleMap.set(role.user_id, role.role as UserRole);
        }
      }

      // Step 4: Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = profiles.map(profile => ({
        id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        // Default to 'user' if no role is found in the map
        role: roleMap.get(profile.user_id) || 'user',
        created_at: profile.created_at,
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: "Error", description: "An unexpected error occurred while fetching users.", variant: "destructive" });
    }
  };

  const assignRole = async (userId: string, role: UserRole) => {
    if (userRole !== 'super_admin') {
      const error = new Error("You do not have permission to assign roles.");
      toast({ title: "Permission Denied", description: error.message, variant: "destructive" });
      return { error };
    }

    try {
      // Use the database function to avoid constraint issues
      const { error } = await supabase.rpc('assign_user_role', {
        target_user_id: userId,
        new_role: role
      });

      if (error) {
        toast({
          title: "Failed to assign role",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchUsers();
      toast({
        title: "Role assigned successfully",
        description: `User has been assigned the ${role} role.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Failed to assign role",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteUser = async (userId: string) => {
    if (userRole !== 'super_admin') {
      const error = new Error("You do not have permission to delete users.");
      toast({ title: "Permission Denied", description: error.message, variant: "destructive" });
      return { error };
    }

    try {
      // Calling the secure RPC function to delete the user.
      const { error } = await supabase.rpc('delete_user_securely', { user_id_to_delete: userId });

      if (error) {
        toast({
          title: "Failed to delete user",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Refresh users list
      await fetchUsers();
      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the system.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Failed to delete user",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const inviteUser = async (email: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email,
          role,
          inviterName: user?.user_metadata?.full_name || 'Administrator'
        }
      });

      if (error) {
        toast({
          title: "Failed to invite user",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchUsers();
      toast({
        title: "User invited successfully",
        description: `Invitation sent to ${email} with ${role} role. Temporary password: ${data.temporaryPassword}`,
      });

      return { error: null, data };
    } catch (error) {
      console.error('Error inviting user:', error);
      return { error };
    }
  };

  const hasRole = (role: UserRole): boolean => {
    if (!userRole) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'user': 1,
      'admin': 2,
      'super_admin': 3,
    };

    return roleHierarchy[userRole] >= roleHierarchy[role];
  };

  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  useEffect(() => {
    if (user) {
      fetchUserRole(user.id).then((role) => {
        setUserRole(role);
        if (role === 'super_admin') {
          fetchUsers();
        }
        setLoading(false);
      });
    } else {
      setUserRole(null);
      setLoading(false);
      setUsers([]);
    }
  }, [user]);

  const value = {
    userRole,
    loading,
    users,
    assignRole,
    inviteUser,
    deleteUser,
    fetchUsers,
    hasRole,
    isSuperAdmin,
    isAdmin,
  };

  return (
    <UserRolesContext.Provider value={value}>
      {children}
    </UserRolesContext.Provider>
  );
};
