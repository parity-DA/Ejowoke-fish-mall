import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface StockUpdate {
  id: string;
  inventory_id: string;
  driver_name?: string;
  quantity_added_kg: number;
  pieces_added?: number;
  update_date: string;
  created_at: string;
  // Joined data from inventory
  inventory?: {
    id: string;
    name: string;
    size?: string;
    specie: string;
    cost_price: number;
  };
}

export const useStock = () => {
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchStockUpdates = async ({ startDate, endDate }: { startDate: string, endDate: string }) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_updates')
        .select(`
          id,
          inventory_id, 
          driver_name,
          quantity_added_kg,
          pieces_added,
          update_date,
          created_at,
          inventory:inventory_id (
            id,
            name,
            size,
            specie,
            cost_price
          )
        `)
        .gte('update_date', startDate)
        .lte('update_date', endDate)
        .order('update_date', { ascending: false });

      if (error) throw error;
      setStockUpdates(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching stock updates',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addStockUpdate = async (updateData: {
    inventory_id: string;
    driver_name?: string;
    quantity_added_kg: number;
    pieces_added?: number;
    update_date: string;
  }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Start a transaction to update both stock_updates and inventory
      const { data: stockUpdate, error: stockError } = await supabase
        .from('stock_updates')
        .insert([{ 
          ...updateData, 
          user_id: user.id,
          business_id: profile.business_id
        }])
        .select(`
          *,
          inventory:inventory_id (
            id,
            name,
            size,
            specie,
            stock_quantity,
            total_pieces
          )
        `)
        .single();

      if (stockError) throw stockError;

      // Update the inventory quantities
      const currentInventory = stockUpdate.inventory as any;
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          stock_quantity: (currentInventory.stock_quantity || 0) + updateData.quantity_added_kg,
          total_pieces: (currentInventory.total_pieces || 0) + (updateData.pieces_added || 0)
        })
        .eq('id', updateData.inventory_id)
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      toast({
        title: 'Stock updated successfully!',
        description: `Added ${updateData.quantity_added_kg}kg${updateData.pieces_added ? ` (${updateData.pieces_added} pieces)` : ''} to ${currentInventory.name}.`,
      });

      return { success: true, data: stockUpdate };
    } catch (error: any) {
      toast({
        title: 'Error updating stock',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  const updateStockUpdate = async (id: string, updates: Partial<StockUpdate>) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // RPC call to handle the update atomically
      const { error } = await supabase.rpc('update_stock_and_inventory', {
        update_id: id,
        new_quantity: updates.quantity_added_kg,
        new_pieces: updates.pieces_added,
        new_date: updates.update_date,
        new_driver: updates.driver_name
      });

      if (error) throw error;

      toast({
        title: 'Stock update modified successfully!',
      });

      return { success: true };

    } catch (error: any) {
      toast({
        title: 'Error updating stock record',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    }
  };

  const deleteStockUpdate = async (id: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    try {
      // First get the stock update details to reverse the inventory changes
      const { data: stockUpdate, error: fetchError } = await supabase
        .from('stock_updates')
        .select('*, inventory!inner(*)')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the stock update
      const { error: deleteError } = await supabase
        .from('stock_updates')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Reverse the inventory changes
      const currentInventory = stockUpdate.inventory as any;
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          stock_quantity: Math.max(0, (currentInventory.stock_quantity || 0) - stockUpdate.quantity_added_kg),
          total_pieces: Math.max(0, (currentInventory.total_pieces || 0) - (stockUpdate.pieces_added || 0))
        })
        .eq('id', stockUpdate.inventory_id)
        .eq('user_id', user?.id);

      if (inventoryError) throw inventoryError;

      toast({
        title: 'Stock update deleted successfully!',
      });
      return { success: true };
    } catch (error: any) {
      toast({
        title: 'Error deleting stock update',
        description: error.message,
        variant: 'destructive',
      });
      return { success: false, error };
    }
  };

  // Removed initial data fetch useEffect. The component is now responsible for fetching data.

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('stock-updates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_updates'
        },
        (payload) => {
          // The component is responsible for refetching.
          // This subscription can be enhanced to notify the component.
          // For now, we'll just log the change.
          console.log('Stock update changed:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    stockUpdates,
    loading,
    addStockUpdate,
    updateStockUpdate,
    deleteStockUpdate,
    fetchStockUpdates,
  };
};
