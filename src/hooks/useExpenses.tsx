import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Expense {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category?: string;
  amount: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export const useExpenses = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        toast({
          title: "Error loading expenses",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          ...expenseData,
          user_id: user.id,
        });

      if (error) {
        toast({
          title: "Failed to add expense",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchExpenses();
      toast({
        title: "Expense added successfully",
        description: `Expense of ₦${expenseData.amount.toLocaleString()} has been recorded.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error adding expense:', error);
      return { error };
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Failed to update expense",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchExpenses();
      toast({
        title: "Expense updated successfully",
        description: "The expense has been updated.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { error };
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Failed to delete expense",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchExpenses();
      toast({
        title: "Expense deleted successfully",
        description: "The expense has been removed.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, fetchExpenses]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchExpenses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchExpenses]);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
};
