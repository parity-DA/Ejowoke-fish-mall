import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type UserRole = 'super_admin' | 'admin' | 'user';

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
      // Get all profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError || !profiles) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get roles for each user
      const usersWithRoles: UserWithRole[] = [];
      
      for (const profile of profiles) {
        const role = await fetchUserRole(profile.user_id);
        usersWithRoles.push({
          id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          role: role,
          created_at: profile.created_at,
        });
      }

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const assignRole = async (userId: string, role: UserRole) => {
    try {
      // Use the database function to avoid constraint issues
      const { error } = await supabase.rpc('assign_user_role', {
        target_user_id: userId,
        new_role: role,
        assigner_id: user?.id
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
    try {
      // Delete user using Supabase admin API
      const { error } = await supabase.auth.admin.deleteUser(userId);

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
        setLoading(false);
      });

      // Only super admins can see all users
      fetchUserRole(user.id).then((role) => {
        if (role === 'super_admin') {
          fetchUsers();
        }
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
