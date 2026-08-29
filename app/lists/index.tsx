import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Container, Card } from '@/components/ui';
import { colors, typography, spacing, borderRadius } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';
import { API_URL as API } from '@/lib/config';
import { useTheme } from '@/context/ThemeContext';
import axios from 'axios';
import { useRouter } from 'expo-router';

export default function ShoppingListsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  
  const [lists, setLists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const fetchLists = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${API}/lists`);
      setLists(data || []);
    } catch (err) {
      console.error('Error fetching lists:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const { data } = await axios.post(`${API}/lists`, { name: newListName });
      setLists([data, ...lists]);
      setNewListName('');
      setShowNewListModal(false);
      router.push(`/lists/${data.id}` as any);
    } catch (err) {
      console.error('Error creating list:', err);
      Alert.alert('Error', 'Could not create list');
    }
  };

  const handleDeleteList = async (id: string, name: string) => {
    Alert.alert(
      "Purchase Completed?",
      `Are you sure you want to mark '${name}' as purchased and delete it?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API}/lists/${id}`);
              setLists(lists.filter(l => l.id !== id));
            } catch (err) {
              console.error('Error deleting list:', err);
            }
          }
        }
      ]
    );
  };

  const calculateTotal = (items: any[]) => {
    if (!items) return 0;
    return items.reduce((acc, item) => acc + Number(item.expected_price || 0), 0);
  };

  const calculateProgress = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    const purchased = items.filter(i => i.is_purchased).length;
    return purchased / items.length;
  };

  return (
    <Container safeArea edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#F1F5F9' : colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: '#F1F5F9' }]}>Shopping Lists</Text>
        <TouchableOpacity onPress={() => setShowNewListModal(true)} style={styles.headerAddBtn}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {lists.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No Shopping Lists</Text>
              <Text style={styles.emptySubtitle}>
                Create a list for your planned purchases and calculate expected costs.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => setShowNewListModal(true)}
              >
                <Text style={styles.createBtnText}>Create New List</Text>
              </TouchableOpacity>
            </View>
          ) : (
            lists.map((list) => {
              const total = calculateTotal(list.items);
              const progress = calculateProgress(list.items);
              const dateLabel = new Date(list.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              return (
                <TouchableOpacity
                  key={list.id}
                  activeOpacity={0.8}
                  onPress={() => router.push(`/lists/${list.id}` as any)}
                >
                  <Card style={[styles.listCard, isDark && { backgroundColor: '#1E293B' }]}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.listName, isDark && { color: '#F1F5F9' }]}>
                          {list.name}
                        </Text>
                        <Text style={[styles.listDate, isDark && { color: '#94A3B8' }]}>
                          Created {dateLabel}  ·  {list.items?.length || 0} items
                        </Text>
                      </View>
                      
                      {/* Checkbox to Mark List as Purchased / Delete */}
                      <TouchableOpacity
                        style={styles.deleteCheck}
                        onPress={() => handleDeleteList(list.id, list.name)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
                      </View>
                      <Text style={[styles.totalAmount, isDark && { color: '#F1F5F9' }]}>
                        ₹{total.toFixed(2)} expected
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── New List Modal ── */}
      <Modal visible={showNewListModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && { backgroundColor: '#1E293B' }]}>
            <Text style={[styles.modalTitle, isDark && { color: '#F1F5F9' }]}>Create List</Text>
            
            <TextInput
              style={[styles.input, isDark && { color: '#F1F5F9', backgroundColor: '#0F172A', borderColor: '#334155' }]}
              placeholder="E.g., Monthly Groceries"
              placeholderTextColor={colors.textTertiary}
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowNewListModal(false);
                  setNewListName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, !newListName.trim() && { opacity: 0.5 }]}
                onPress={handleCreateList}
                disabled={!newListName.trim()}
              >
                <Text style={styles.modalSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAddBtn: {
    padding: spacing.sm,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  createBtnText: {
    ...typography.bodyBold,
    color: colors.white,
  },
  // List Cards
  listCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  listName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 4,
  },
  listDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deleteCheck: {
    padding: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  progressContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  totalAmount: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  modalCancelText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  modalSaveText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
