import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error fetching customers',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  },[user, toast]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'business_id'>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, user_id: user.id, business_id: profile.business_id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Customer added successfully!',
        description: `${data.name} has been added to your customer list.`,
      });

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error adding customer',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Customer updated successfully!',
        description: `${data.name} has been updated.`,
      });

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error updating customer',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Customer deleted successfully!',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error deleting customer',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user, fetchCustomers]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomers(prev => [payload.new as Customer, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCustomers(prev => prev.map(customer => 
              customer.id === payload.new.id ? payload.new as Customer : customer
            ));
          } else if (payload.eventType === 'DELETE') {
            setCustomers(prev => prev.filter(customer => customer.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
};
