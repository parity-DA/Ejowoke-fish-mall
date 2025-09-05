import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface InventoryItem {
  id: string;
  specie: string;
  size?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  cost_price: number; // per kg in ₦
  selling_price: number; // per kg in ₦
  stock_quantity: number; // current stock in kg
  total_kg_supplied: number;
  total_pieces: number;
  total_pieces_supplied: number;
  minimum_stock: number; // deprecated
  minimum_stock_kg: number; // in kg
  barcode?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInventory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching inventory',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const insertData: any = {
        name: itemData.name,
        size: itemData.size || null,
        cost_price: itemData.cost_price,
        selling_price: itemData.selling_price,
        stock_quantity: itemData.total_kg_supplied,
        total_kg_supplied: itemData.total_kg_supplied,
        total_pieces: itemData.total_pieces_supplied,
        total_pieces_supplied: itemData.total_pieces_supplied,
        minimum_stock: 0, // deprecated field
        minimum_stock_kg: itemData.minimum_stock_kg,
        barcode: itemData.barcode || null,
        user_id: user.id,
        specie: 'Catfish'
      };

      const { data, error } = await supabase
        .from('inventory')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Inventory item added successfully!',
        description: `${data.name} (${data.size}) has been added to your inventory.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error adding inventory item',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates as any)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Inventory item updated successfully!',
        description: `${data.name} has been updated.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Error updating inventory item',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Inventory item deleted successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting inventory item',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user]);

  // Force refresh inventory when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchInventory();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInventory(prev => [payload.new as InventoryItem, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setInventory(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new as InventoryItem : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setInventory(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const totalPieces = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.total_pieces || 0), 0);
  }, [inventory]);

  return {
    inventory,
    loading,
    totalPieces,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    refetch: fetchInventory,
  };
};
