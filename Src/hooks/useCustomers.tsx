import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  channel: 'walk-in' | 'retailer' | 'restaurant' | 'wholesaler';
  credit_limit: number;
  outstanding_balance: number;
  total_purchases: number;
  last_purchase_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers((data || []).map(customer => ({
        ...customer,
        channel: customer.channel as 'walk-in' | 'retailer' | 'restaurant' | 'wholesaler'
      })));
    } catch (error: any) {
      toast({
        title: 'Error fetching customers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ ...customerData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Customer added successfully!',
        description: `${data.name} has been added to your customer list.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error adding customer',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Customer updated successfully!',
        description: `${data.name} has been updated.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating customer',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Customer deleted successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting customer',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

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
            setCustomers(prev => prev.filter(customer => customer.id !== payload.old.id));
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
