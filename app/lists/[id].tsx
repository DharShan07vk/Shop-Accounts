import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { API_URL as API } from '@/lib/config';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function SingleListScreen() {
  const { id } = useLocalSearchParams();
  const { isDark } = useTheme();
  const router = useRouter();

  const [list, setList] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newExpectedPrice, setNewExpectedPrice] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [dbItems, setDbItems] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const [{ data: listsData }, { data: itemsData }] = await Promise.all([
        axios.get(`${API}/lists`),
        axios.get(`${API}/items/all`)
      ]);
      const targetList = listsData.find((l: any) => l.id === id);
      if (targetList) {
        setList(targetList);
        setItems(targetList.items || []);
      } else {
        Alert.alert('Error', 'List not found');
        router.back();
      }
      setDbItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching list data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    setIsAdding(true);
    try {
      const { data } = await axios.post(`${API}/lists/${id}/items`, {
        item_name: newItemName.trim(),
        expected_price: parseFloat(newExpectedPrice) || 0,
      });
      setItems([...items, data]);
      setNewItemName('');
      setNewExpectedPrice('');
    } catch (err) {
      console.error('Error adding item:', err);
      Alert.alert('Error', 'Could not add item');
    } finally {
      setIsAdding(false);
    }
  };

  const handleTogglePurchased = async (itemId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setItems(items.map(i => i.id === itemId ? { ...i, is_purchased: !currentStatus } : i));
    try {
      await axios.put(`${API}/lists/items/${itemId}`, { is_purchased: !currentStatus });
    } catch (err) {
      console.error('Error toggling item:', err);
      // Revert if error
      setItems(items.map(i => i.id === itemId ? { ...i, is_purchased: currentStatus } : i));
    }
  };

  const filteredDbItems = useMemo(() => {
    if (!newItemName.trim()) return [];
    return dbItems
      .filter((i) => i.name.toLowerCase().includes(newItemName.toLowerCase()))
      .slice(0, 20); // allow up to 20 suggestions, scrollable
  }, [newItemName, dbItems]);

  const handleSelectSuggestion = (item: any) => {
    setNewItemName(item.name);
    setNewExpectedPrice(item.last_price ? String(item.last_price) : '');
    setShowSuggestions(false);
  };

  if (isLoading) {
    return (
      <Container safeArea edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F1F5F9' : colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && { color: '#F1F5F9' }]}>Loading...</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Container>
    );
  }

  const totalExpected = items.reduce((acc, item) => acc + Number(item.expected_price || 0), 0);
  const totalPurchased = items.filter(i => i.is_purchased).reduce((acc, item) => acc + Number(item.expected_price || 0), 0);

  return (
    <Container safeArea edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#F1F5F9' : colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: '#F1F5F9' }]}>{list?.name || "Shopping List"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Budget Summary */}
        <View style={[styles.summaryCard, isDark && { backgroundColor: '#1E293B' }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Expected</Text>
            <Text style={[styles.summaryValue, isDark && { color: '#F1F5F9' }]}>₹{totalExpected.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Purchased Value</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>₹{totalPurchased.toFixed(2)}</Text>
          </View>
        </View>

        {/* Add Item Form */}
        <Card style={[styles.addCard, isDark && { backgroundColor: '#0F172A', borderColor: '#334155' }, { overflow: 'visible' }]}>
          <View style={[styles.addRow, { zIndex: 10, position: 'relative' }]}>
            <TextInput
              style={[styles.inputName, isDark && { color: '#F1F5F9', backgroundColor: '#1E293B', borderColor: '#334155' }]}
              placeholder="Item name (e.g. Milk)"
              placeholderTextColor={colors.textTertiary}
              value={newItemName}
              onChangeText={(text) => {
                setNewItemName(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            <TextInput
              style={[styles.inputPrice, isDark && { color: '#F1F5F9', backgroundColor: '#1E293B', borderColor: '#334155' }]}
              placeholder="₹ Price"
              placeholderTextColor={colors.textTertiary}
              value={newExpectedPrice}
              onChangeText={setNewExpectedPrice}
              keyboardType="numeric"
            />
          </View>
          {showSuggestions && filteredDbItems.length > 0 && (
            <View style={[styles.suggestionsBox, isDark && { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
              <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 150 }} keyboardShouldPersistTaps="handled">
                {filteredDbItems.map((sItem) => (
                  <TouchableOpacity
                    key={sItem.id}
                    style={[styles.suggestionItem, isDark && { borderBottomColor: '#334155' }]}
                    onPress={() => handleSelectSuggestion(sItem)}
                  >
                    <Text style={[styles.suggestionText, isDark && { color: '#F1F5F9' }]}>{sItem.name}</Text>
                    {sItem.last_price ? <Text style={styles.suggestionPrice}>₹{sItem.last_price}</Text> : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          <TouchableOpacity
            style={[styles.addBtn, (!newItemName.trim() || isAdding) && { opacity: 0.5 }]}
            onPress={handleAddItem}
            disabled={!newItemName.trim() || isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.addBtnText}>Add Item</Text>
            )}
          </TouchableOpacity>
        </Card>

        {/* List of Items */}
        <View style={styles.itemsList}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, isDark && { borderBottomColor: '#334155' }]}
              activeOpacity={0.7}
              onPress={() => handleTogglePurchased(item.id, item.is_purchased)}
            >
              <Ionicons
                name={item.is_purchased ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={item.is_purchased ? colors.success : colors.border}
              />
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.is_purchased && styles.itemPurchased, isDark && !item.is_purchased && { color: '#F1F5F9' }]}>
                  {item.item_name}
                </Text>
                {Number(item.expected_price) > 0 && (
                  <Text style={styles.itemPrice}>
                    Expected: ₹{Number(item.expected_price).toFixed(2)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBackBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.h3,
    color: colors.text,
  },
  addCard: {
    padding: spacing.md,
    marginBottom: spacing.xl,
    zIndex: 10, // allows absolute positioning to break out
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inputName: {
    flex: 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  inputPrice: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addBtnText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  itemsList: {
    marginTop: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  itemPurchased: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  itemPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  suggestionsBox: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionText: {
    ...typography.body,
    color: colors.text,
  },
  suggestionPrice: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
