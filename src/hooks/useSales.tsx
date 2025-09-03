import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Sale {
  id: string;
  user_id: string;
  customer_id?: string;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'credit';
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
  };
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: {
    name: string;
  };
}

export interface SaleWithItems extends Sale {
  sale_items: SaleItem[];
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSales = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name),
          sale_items(*, products(name))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data?.map(sale => ({
        ...sale,
        payment_method: sale.payment_method as 'cash' | 'card' | 'transfer' | 'credit',
        status: sale.status as 'pending' | 'completed' | 'cancelled'
      })) || []);
    } catch (error) {
      toast({
        title: 'Error fetching sales',
        description: (error as AuthError).message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createSale = async (saleData: {
    customer_id?: string;
    payment_method: 'cash' | 'card' | 'transfer' | 'credit';
    status?: 'pending' | 'completed' | 'cancelled';
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
    }>;
  }) => {
    if (!user) return;

    try {
      // Calculate total amount
      const total_amount = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          user_id: user.id,
          customer_id: saleData.customer_id,
          total_amount,
          payment_method: saleData.payment_method,
          status: saleData.status || 'completed'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = saleData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock quantities
      for (const item of saleData.items) {
        // Get current stock first
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching product stock:', fetchError);
          continue;
        }

        // Update with new stock quantity
        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id)
          .eq('user_id', user.id);

        if (stockError) {
          console.error('Error updating stock:', stockError);
        }
      }

      toast({
        title: 'Sale completed successfully!',
        description: `Sale total: ₦${total_amount.toLocaleString()}`,
      });

      return sale;
    } catch (error) {
      toast({
        title: 'Error creating sale',
        description: (error as AuthError).message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateSaleStatus = async (id: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sale status updated successfully!',
      });

      return data;
    } catch (error) {
      toast({
        title: 'Error updating sale',
        description: (error as AuthError).message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    if (!user) return;

    try {
      // First, get the sale items to restore stock
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id', id);

      if (saleItemsError) throw saleItemsError;

      // Restore stock for each product
      for (const item of saleItems || []) {
        // Get current stock
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching product for stock restoration:', fetchError);
          continue;
        }

        // Update with restored stock quantity
        const restoredStock = product.stock_quantity + item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: restoredStock })
          .eq('id', item.product_id)
          .eq('user_id', user.id);

        if (stockError) {
          console.error('Error restoring stock:', stockError);
        }
      }

      // Delete sale items first
      const { error: itemsDeleteError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (itemsDeleteError) throw itemsDeleteError;

      // Delete the sale
      const { error: saleDeleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (saleDeleteError) throw saleDeleteError;

      toast({
        title: 'Sale deleted successfully!',
        description: 'Product stock has been restored.',
      });

      // Refresh the sales list
      fetchSales();
    } catch (error) {
      toast({
        title: 'Error deleting sale',
        description: (error as AuthError).message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user, fetchSales]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchSales(); // Refetch to get updated relations
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSales]);

  return {
    sales,
    loading,
    createSale,
    updateSaleStatus,
    deleteSale,
    refetch: fetchSales,
  };
};
