import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Stock {
  id: string;
  user_id: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  stock_items?: StockItem[];
}

export interface StockItem {
  id: string;
  stock_id?: string;
  inventory_item_id: string;
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

export const useStock = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stock, setStock] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStock = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('stock')
        .select(`
          *,
          stock_items (
            id,
            inventory_item_id,
            quantity,
            unit_cost,
            total_cost,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stock:', error);
        toast({
          title: "Error loading stock",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setStock(data || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (stockData: {
    supplier_name: string;
    total_amount: number;
    items: Array<{
      inventory_item_id: string;
      quantity: number;
      unit_cost: number;
      total_cost: number;
    }>;
  }) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      // Insert the stock
      const { data: stock, error: stockError } = await supabase
        .from('stock')
        .insert({
          user_id: user.id,
          supplier_name: stockData.supplier_name,
          total_amount: stockData.total_amount,
          status: 'completed',
        })
        .select()
        .single();

      if (stockError) {
        toast({
          title: "Failed to create stock",
          description: stockError.message,
          variant: "destructive",
        });
        return { error: stockError };
      }

      // Insert stock items
      if (stockData.items.length > 0) {
        const items = stockData.items.map(item => ({
          ...item,
          stock_id: stock.id,
        }));

        const { error: itemsError } = await supabase
          .from('stock_items')
          .insert(items);

        if (itemsError) {
          console.error('Error inserting stock items:', itemsError);
        }
      }

      await fetchStock();
      toast({
        title: "Stock created successfully",
        description: `Stock from ${stockData.supplier_name} has been recorded.`,
      });

      return { error: null };
    } catch (error) {
      console.error('Error creating stock:', error);
      return { error };
    }
  };

  const updateStock = async (id: string, updates: Partial<Stock>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('stock')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Failed to update stock",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchStock();
      toast({
        title: "Stock updated successfully",
        description: "The stock has been updated.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating stock:', error);
      return { error };
    }
  };

  const deleteStock = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('stock')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Failed to delete stock",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      await fetchStock();
      toast({
        title: "Stock deleted successfully",
        description: "The stock has been removed.",
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting stock:', error);
      return { error };
    }
  };

  useEffect(() => {
    fetchStock();
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('stock-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStock();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    stock,
    loading,
    addStock,
    updateStock,
    deleteStock,
    refetch: fetchStock,
  };
};
