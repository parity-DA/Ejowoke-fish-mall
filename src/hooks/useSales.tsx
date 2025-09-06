import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Database } from '@/integrations/supabase/types';

type Sale = Database['public']['Tables']['sales']['Row'];
type SaleItem = Database['public']['Tables']['sale_items']['Row'];
type SaleItemWithInventory = SaleItem & { inventory: { name: string } | null };

export interface SaleWithItems extends Sale {
  sale_items: SaleItemWithInventory[];
  customers: { name: string } | null;
}

export const useSales = () => {
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchSales = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
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
      setSales(data as SaleWithItems[] || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error fetching sales',
        description: message,
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
      pieces_sold?: number;
    }>;
    discount?: number;
    total_amount: number;
    amount_paid: number;
    created_at?: string;
  }) => {
    if (!user || !profile) return;

    try {
      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          user_id: user.id,
          business_id: profile.business_id,
          customer_id: saleData.customer_id,
          total_amount: saleData.total_amount,
          amount_paid: saleData.amount_paid,
          discount: saleData.discount || 0,
          payment_method: saleData.payment_method,
          status: saleData.status || 'completed',
          created_at: saleData.created_at
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

      // Batch-fetch all products to check stock
      const productIds = saleData.items.map(item => item.product_id);
      const { data: products, error: productsError } = await supabase
        .from('inventory')
        .select('id, stock_quantity, total_pieces')
        .in('id', productIds)
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productMap = new Map(products.map(p => [p.id, p]));

      // Validate stock and prepare updates
      const stockUpdates = [];
      for (const item of saleData.items) {
        const product = productMap.get(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found.`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for product. Available: ${product.stock_quantity}kg, Requested: ${item.quantity}kg`);
        }
        
        if ((product.total_pieces || 0) < (item.pieces_sold || 0)) {
          throw new Error(`Insufficient pieces for product. Available: ${product.total_pieces || 0} pieces, Requested: ${item.pieces_sold || 0} pieces`);
        }

        stockUpdates.push({
          id: item.product_id,
          stock_quantity: Math.max(0, product.stock_quantity - item.quantity),
          total_pieces: Math.max(0, (product.total_pieces || 0) - (item.pieces_sold || 0)),
        });
      }

      // Batch-update inventory
      const { error: stockError } = await supabase
        .from('inventory')
        .upsert(stockUpdates);

      if (stockError) {
        console.error('Error updating stock:', stockError);
        throw new Error(`Failed to update inventory: ${stockError.message}`);
      }

      toast({
        title: 'Sale completed successfully!',
        description: `Sale total: ₦${saleData.total_amount.toLocaleString()}`,
      });

      return sale;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error creating sale',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateSale = async (id: string, saleData: {
    customer_id?: string;
    payment_method: 'cash' | 'card' | 'transfer' | 'credit';
    status?: 'pending' | 'completed' | 'cancelled';
    created_at?: string;
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

      // --- Inventory Reconciliation ---
      // 1. Get all unique product IDs from both old and new sale items
      const productIds = Array.from(new Set([
        ...(originalSale || []).map(item => item.product_id),
        ...saleData.items.map(item => item.product_id)
      ]));

      // 2. Batch-fetch all relevant products
      const { data: products, error: productsError } = await supabase
        .from('inventory')
        .select('id, stock_quantity, total_pieces')
        .in('id', productIds)
        .eq('user_id', user.id);

      if (productsError) throw productsError;

      const productMap = new Map(products.map(p => [p.id, {
        stock_quantity: p.stock_quantity,
        total_pieces: p.total_pieces || 0
      }]));

      // 3. Revert original quantities
      for (const originalItem of originalSale || []) {
        const product = productMap.get(originalItem.product_id);
        if (product) {
          product.stock_quantity += originalItem.quantity;
          product.total_pieces += originalItem.pieces_sold || 0;
        }
      }

      // 4. Apply new quantities and validate stock
      for (const newItem of saleData.items) {
        const product = productMap.get(newItem.product_id);
        if (!product) {
          throw new Error(`Product with ID ${newItem.product_id} not found.`);
        }
        if (product.stock_quantity < newItem.quantity) {
          throw new Error(`Insufficient stock for product. Available: ${product.stock_quantity}, Requested: ${newItem.quantity}`);
        }
        if (product.total_pieces < (newItem.pieces_sold || 0)) {
           throw new Error(`Insufficient pieces for product. Available: ${product.total_pieces}, Requested: ${newItem.pieces_sold}`);
        }
        product.stock_quantity -= newItem.quantity;
        product.total_pieces -= newItem.pieces_sold || 0;
      }

      // 5. Prepare for batch update
      const stockUpdates = Array.from(productMap.entries()).map(([id, data]) => ({
        id,
        stock_quantity: data.stock_quantity,
        total_pieces: data.total_pieces,
      }));

      // Calculate new total amount
      const total_amount = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      // Update the sale
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          customer_id: saleData.customer_id,
          total_amount,
          payment_method: saleData.payment_method,
          status: saleData.status || 'completed',
          created_at: saleData.created_at
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

      // 6. Batch-update inventory
      const { error: stockError } = await supabase
        .from('inventory')
        .upsert(stockUpdates);

      if (stockError) {
        console.error('Error updating stock:', stockError);
        throw new Error(`Failed to update inventory: ${stockError.message}`);
      }

      toast({
        title: 'Sale updated successfully!',
        description: `Sale total: ₦${total_amount.toLocaleString()}`,
      });

      // Refresh sales data
      fetchSales();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error updating sale',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateSaleStatus = async (id: string, status: 'pending' | 'completed' | 'cancelled') => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sale status updated successfully!',
      });

      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error updating sale',
        description: message,
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
        .select('product_id, quantity, pieces_sold')
        .eq('sale_id', id);

      if (saleItemsError) throw saleItemsError;

      // Batch-fetch all products to restore stock
      const productIds = (saleItems || []).map(item => item.product_id);
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('inventory')
          .select('id, stock_quantity, total_pieces')
          .in('id', productIds)
          .eq('user_id', user.id);

        if (productsError) throw productsError;

        const productMap = new Map(products.map(p => [p.id, p]));
        const stockUpdates = [];

        for (const item of saleItems || []) {
          const product = productMap.get(item.product_id);
          if (product) {
            stockUpdates.push({
              id: item.product_id,
              stock_quantity: product.stock_quantity + item.quantity,
              total_pieces: (product.total_pieces || 0) + (item.pieces_sold || 0),
            });
          }
        }

        if (stockUpdates.length > 0) {
          const { error: stockError } = await supabase
            .from('inventory')
            .upsert(stockUpdates);

          if (stockError) {
            console.error('Error restoring stock:', stockError);
            // Decide if you want to throw or just log
          }
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error deleting sale',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    if(user) fetchSales();
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

  const recordPayment = async (saleId: string, amount: number) => {
    if (!user) return;

    try {
      // First, get the sale to calculate the new amount paid
      const { data: sale, error: fetchError } = await supabase
        .from('sales')
        .select('total_amount, amount_paid')
        .eq('id', saleId)
        .single();

      if (fetchError) throw fetchError;

      const newAmountPaid = (sale.amount_paid || 0) + amount;
      const newStatus = newAmountPaid >= sale.total_amount ? 'completed' : 'pending';

      const { error: updateError } = await supabase
        .from('sales')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
        })
        .eq('id', saleId);

      if (updateError) throw updateError;

      toast({
        title: 'Payment recorded successfully!',
        description: `₦${amount.toLocaleString()} has been added to the sale.`,
      });

      fetchSales();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error recording payment',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    sales,
    loading,
    createSale,
    updateSale,
    updateSaleStatus,
    deleteSale,
    recordPayment,
    refetch: fetchSales,
  };
};
