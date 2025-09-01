import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Purchase {
  id: string;
  user_id: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  purchase_items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id?: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export const usePurchases = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          purchase_items (
            id,
            product_id,
            quantity,
            unit_cost,
            total_cost,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchases:', error);
        toast({
          title: "Error loading purchases",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPurchases(data || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPurchase = async (purchaseData: {
    supplier_name: string;
    total_amount: number;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
    }>;
  }) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Insert the purchase
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          supplier_name: purchaseData.supplier_name,
          total_amount: purchaseData.total_amount,
          status: 'completed',
        })
        .select()
        .single();

      if (purchaseError) {
        toast({
          title: "Failed to create purchase",
          description: purchaseError.message,
          variant: "destructive",
        });
        return { error: purchaseError };
      }

      // Insert purchase items
      if (purchaseData.items.length > 0) {
        const items = purchaseData.items.map(item => ({
          ...item,
          purchase_id: purchase.id,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_items')
          .insert(items);

        if (itemsError) {
          console.error('Error inserting purchase items:', itemsError);
        }
      }

      await fetchPurchases();
      toast({
        title: "Purchase created successfully",
        description: `Purchase from ${purchaseData.supplier_name} has been recorded.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error creating purchase:', error);
      return { error };
    }
  };

  const updatePurchase = async (id: string, updates: Partial<Purchase>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('purchases')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Failed to update purchase",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchPurchases();
      toast({
        title: "Purchase updated successfully",
        description: "The purchase has been updated.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating purchase:', error);
      return { error };
    }
  };

  const deletePurchase = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Failed to delete purchase",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchPurchases();
      toast({
        title: "Purchase deleted successfully",
        description: "The purchase has been removed.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting purchase:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('purchases-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPurchases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    purchases,
    loading,
    addPurchase,
    updatePurchase,
    deletePurchase,
    refetch: fetchPurchases,
  };
};
