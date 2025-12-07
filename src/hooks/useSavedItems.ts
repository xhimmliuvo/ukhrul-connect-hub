import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ItemType = 'business' | 'product' | 'place' | 'event';

interface SavedItem {
  id: string;
  item_type: ItemType;
  item_id: string;
  created_at: string;
}

export function useSavedItems(itemType?: ItemType) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch saved items
  useEffect(() => {
    if (!user) {
      setSavedItems([]);
      setLoading(false);
      return;
    }

    async function fetchSavedItems() {
      let query = supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user!.id);

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching saved items:', error);
        return;
      }

      // Cast the data to proper type
      const typedData: SavedItem[] = (data || []).map(item => ({
        ...item,
        item_type: item.item_type as ItemType
      }));

      setSavedItems(typedData);
      setLoading(false);
    }

    fetchSavedItems();
  }, [user, itemType]);

  // Toggle save status
  const toggleSave = useCallback(async (type: ItemType, itemId: string) => {
    if (!user) return { error: new Error('Must be logged in to save items') };

    const existingItem = savedItems.find(
      (item) => item.item_type === type && item.item_id === itemId
    );

    if (existingItem) {
      // Remove from saved
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', existingItem.id);

      if (!error) {
        setSavedItems((prev) => prev.filter((item) => item.id !== existingItem.id));
      }
      return { error };
    } else {
      // Add to saved
      const { data, error } = await supabase
        .from('saved_items')
        .insert({
          user_id: user.id,
          item_type: type,
          item_id: itemId,
        })
        .select()
        .single();

      if (!error && data) {
        const newItem: SavedItem = {
          ...data,
          item_type: data.item_type as ItemType
        };
        setSavedItems((prev) => [...prev, newItem]);
      }
      return { error };
    }
  }, [user, savedItems]);

  // Check if item is saved
  const isSaved = useCallback((type: ItemType, itemId: string) => {
    return savedItems.some(
      (item) => item.item_type === type && item.item_id === itemId
    );
  }, [savedItems]);

  return {
    savedItems,
    loading,
    toggleSave,
    isSaved,
  };
}
