import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Payment {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description?: string;
  category?: string;
  payment_method: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export const usePayments = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('business_id', profile.business_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Error loading payments",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  const addPayment = async (paymentData: Omit<Payment, 'id' | 'created_at' | 'user_id'>) => {
    if (!user || !profile) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          user_id: user.id,
          business_id: profile.business_id,
        });

      if (error) {
        toast({
          title: "Failed to record payment",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchPayments();
      toast({
        title: "Payment recorded successfully",
        description: `Payment of ₦${paymentData.amount.toLocaleString()} has been recorded.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error adding payment:', error);
      return { error };
    }
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    if (!user || !profile) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .eq('business_id', profile.business_id);

      if (error) {
        toast({
          title: "Failed to update payment",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchPayments();
      toast({
        title: "Payment updated successfully",
        description: "The payment has been updated.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating payment:', error);
      return { error };
    }
  };

  const deletePayment = async (id: string) => {
    if (!user || !profile) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)
        .eq('business_id', profile.business_id);

      if (error) {
        toast({
          title: "Failed to delete payment",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchPayments();
      toast({
        title: "Payment deleted successfully",
        description: "The payment has been removed.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting payment:', error);
      return { error };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchPayments();
    }
  }, [profile, fetchPayments]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !profile) return;

    const channel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `business_id=eq.${profile.business_id}`,
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile, fetchPayments]);

  return {
    payments,
    loading,
    addPayment,
    updatePayment,
    deletePayment,
    refetch: fetchPayments,
  };
};
