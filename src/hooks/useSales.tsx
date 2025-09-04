import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Sale {
  id: string;
  user_id: string;
  customer_id?: string;
  total_amount: number;
  discount?: number;
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
  inventory?: {
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

  const fetchSales = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customers(name),
          sale_items(*, inventory(name))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data?.map(sale => ({
        ...sale,
        payment_method: sale.payment_method as 'cash' | 'card' | 'transfer' | 'credit',
        status: sale.status as 'pending' | 'completed' | 'cancelled'
      })) || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching sales',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData: {
    customer_id?: string;
    payment_method: 'cash' | 'card' | 'transfer' | 'credit';
    status?: 'pending' | 'completed' | 'cancelled';
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      pieces_sold?: number;
    }>;
    discount?: number;
    total_amount: number;
  }) => {
    if (!user) return;

    try {
      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          user_id: user.id,
          customer_id: saleData.customer_id,
          total_amount: saleData.total_amount,
          discount: saleData.discount || 0,
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
        total_price: item.quantity * item.unit_price,
        pieces_sold: item.pieces_sold || 0
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock quantities and pieces
      for (const item of saleData.items) {
        // Get current stock first
        const { data: product, error: fetchError } = await supabase
          .from('inventory')
          .select('stock_quantity, total_pieces')
          .eq('id', item.product_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching product stock:', fetchError);
          continue;
        }

        // Check if there's sufficient stock before proceeding
        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product. Available: ${product.stock_quantity}kg, Requested: ${item.quantity}kg`);
        }
        
        if ((product.total_pieces || 0) < (item.pieces_sold || 0)) {
          throw new Error(`Insufficient pieces for product. Available: ${product.total_pieces || 0} pieces, Requested: ${item.pieces_sold || 0} pieces`);
        }

        // Update with new stock quantity and pieces
        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        const newPieces = Math.max(0, (product.total_pieces || 0) - (item.pieces_sold || 0));
        
        const { error: stockError } = await supabase
          .from('inventory')
          .update({ 
            stock_quantity: newStock,
            total_pieces: newPieces
          })
          .eq('id', item.product_id)
          .eq('user_id', user.id);

        if (stockError) {
          console.error('Error updating stock:', stockError);
          throw new Error(`Failed to update inventory: ${stockError.message}`);
        }
      }

      toast({
        title: 'Sale completed successfully!',
        description: `Sale total: ₦${total_amount.toLocaleString()}`,
      });

      return sale;
    } catch (error: any) {
      toast({
        title: 'Error creating sale',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateSale = async (id: string, saleData: {
    customer_id?: string;
    payment_method: 'cash' | 'card' | 'transfer' | 'credit';
    status?: 'pending' | 'completed' | 'cancelled';
    items: Array<{
      id?: string;
      product_id: string;
      quantity: number;
      unit_price: number;
      pieces_sold?: number;
    }>;
  }) => {
    if (!user) return;

    try {
      // Get original sale items to revert inventory changes
      const { data: originalSale, error: originalError } = await supabase
        .from('sale_items')
        .select('product_id, quantity, pieces_sold')
        .eq('sale_id', id);

      if (originalError) throw originalError;

      // Revert inventory changes from original sale
      for (const originalItem of originalSale || []) {
        const { data: product, error: fetchError } = await supabase
          .from('inventory')
          .select('stock_quantity, total_pieces')
          .eq('id', originalItem.product_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) continue;

        // Add back the original quantities
        const restoredStock = product.stock_quantity + originalItem.quantity;
        const restoredPieces = (product.total_pieces || 0) + (originalItem.pieces_sold || 0);

        await supabase
          .from('inventory')
          .update({ 
            stock_quantity: restoredStock,
            total_pieces: restoredPieces
          })
          .eq('id', originalItem.product_id)
          .eq('user_id', user.id);
      }

      // Calculate new total amount
      const total_amount = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // Update the sale
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          customer_id: saleData.customer_id,
          total_amount,
          payment_method: saleData.payment_method,
          status: saleData.status || 'completed'
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (saleError) throw saleError;

      // Delete existing sale items
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      // Create new sale items
      const saleItems = saleData.items.map(item => ({
        sale_id: id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        pieces_sold: item.pieces_sold || 0
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Apply new inventory changes
      for (const item of saleData.items) {
        const { data: product, error: fetchError } = await supabase
          .from('inventory')
          .select('stock_quantity, total_pieces')
          .eq('id', item.product_id)
          .eq('user_id', user.id)
          .single();

        if (fetchError) continue;

        // Subtract new quantities
        const newStock = Math.max(0, product.stock_quantity - item.quantity);
        const newPieces = Math.max(0, (product.total_pieces || 0) - (item.pieces_sold || 0));

        await supabase
          .from('inventory')
          .update({ 
            stock_quantity: newStock,
            total_pieces: newPieces
          })
          .eq('id', item.product_id)
          .eq('user_id', user.id);
      }

      toast({
        title: 'Sale updated successfully!',
        description: `Sale total: ₦${total_amount.toLocaleString()}`,
      });

      // Refresh sales data
      fetchSales();
    } catch (error: any) {
      toast({
        title: 'Error updating sale',
        description: error.message,
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
    } catch (error: any) {
      toast({
        title: 'Error updating sale',
        description: error.message,
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
        .from('inventory')
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
          .from('inventory')
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
    } catch (error: any) {
      toast({
        title: 'Error deleting sale',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

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
  }, [user]);

  return {
    sales,
    loading,
    createSale,
    updateSale,
    updateSaleStatus,
    deleteSale,
    refetch: fetchSales,
  };
};
