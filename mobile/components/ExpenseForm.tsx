import { View, Text } from '@/components/Themed';
import {
  StyleSheet,
  FlatList,
  Pressable,
  View as RNView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import Colors, { spacing, typography, borderRadius } from '@/constants/Colors';
import { getCategories, createCategory } from '@/services/category';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Search, ChevronRight } from 'lucide-react-native';

interface FormErrors {
  title?: string;
  amount?: string;
  date?: string;
}

export interface ExpenseFormData {
  title: string;
  amount: string;
  date: string;
  note: string;
  categoryId?: string;
}

interface ExpenseFormProps {
  mode: 'add' | 'edit';
  initialData?: ExpenseFormData;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
  onOCR?: () => void;
}

export const ExpenseForm = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText,
  onOCR,
}: ExpenseFormProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const flatListRef = useRef<FlatList>(null);

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(initialData?.note || '');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(initialData?.categoryId);

  // Validation and UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearchText, setCategorySearchText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await getCategories();
        if (mounted) setCategories(list);
      } catch (e) {
        console.error('Failed to fetch categories:', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Keyboard visibility listener
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // When categories load (or initialData changes), pre-fill the category name for edit mode
  useEffect(() => {
    if (initialData?.categoryId && categories.length > 0) {
      const match = categories.find((c) => c.id === initialData.categoryId);
      if (match) {
        setCategory(match.name);
        setCategoryId(match.id);
      }
    }
  }, [categories, initialData?.categoryId]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      }
    }

    if (!date.trim()) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategorySelect = (item: { id: string; name: string }) => {
    setCategory(item.name);
    setCategoryId(item.id);
    setShowCategoryModal(false);
    setCategorySearchText('');
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
      if (errors.date) setErrors({ ...errors, date: undefined });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Ensure category exists (create it if the user typed a new name)
      let payloadCategoryId = categoryId;
      if (!payloadCategoryId && category.trim()) {
        // Try find by name locally
        const existing = categories.find(
          (c) => c.name.toLowerCase() === category.trim().toLowerCase()
        );
        if (existing) {
          payloadCategoryId = existing.id;
        } else {
          // Create new category
          const created = await createCategory(category.trim());
          payloadCategoryId = created.id;
          // Refresh categories list
          setCategories((prev) => [created, ...prev]);
        }
      }

      // Call parent submit handler
      await onSubmit({
        title: title.trim(),
        amount: parseFloat(amount).toString(),
        date,
        note: note.trim() || '',
        categoryId: payloadCategoryId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save expense';
      console.error('[ExpenseForm] Error:', err);
      Alert.alert('Error', msg);
    }
  };

  const defaultSubmitText = mode === 'add' ? 'Save Expense' : 'Save Changes';
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearchText.trim().toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={[{ key: 'form' }]} // Dummy data to use FlatList
        keyExtractor={(item) => item.key}
        scrollEnabled={isKeyboardVisible}
        contentContainerStyle={styles.flatListContent}
        renderItem={() => (
          <Card shadowSize="medium">
            <View style={styles.formContainer}>
              {/* Title Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Expense Details
                </Text>
                <View style={styles.sectionDivider} />

                {/* Title Input */}
                <TextInput
                  label="Title"
                  placeholder="e.g., Groceries, Gas, Coffee"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text);
                    if (errors.title) setErrors({ ...errors, title: undefined });
                  }}
                  error={errors.title}
                  editable={!isLoading}
                />

                {/* Amount & Date Row */}
                <View style={styles.rowContainer}>
                  <View style={styles.flex1}>
                    <TextInput
                      label="Amount"
                      placeholder="0.00"
                      value={amount}
                      onChangeText={(text) => {
                        setAmount(text);
                        if (errors.amount) setErrors({ ...errors, amount: undefined });
                      }}
                      keyboardType="decimal-pad"
                      error={errors.amount}
                      editable={!isLoading}
                    />
                  </View>
                  <View style={styles.spacer} />
                  <View style={styles.flex1}>
                    <Pressable onPress={() => setShowDatePicker(true)}>
                      <TextInput
                        label="Date"
                        placeholder={new Date().toISOString().split('T')[0]}
                        value={date}
                        editable={false}
                        hint="Tap to select a date"
                      />
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        value={new Date(date || Date.now())}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                      />
                    )}
                  </View>
                </View>
              </View>

              {/* Category Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Category</Text>
                <View style={styles.sectionDivider} />

                {/* Category Input - Click to open modal */}
                <Pressable onPress={() => setShowCategoryModal(true)}>
                  <TextInput
                    label="Category"
                    placeholder="e.g. food, transport, shopping"
                    value={category}
                    editable={false}
                    pointerEvents="none"
                  />
                </Pressable>
              </View>

              {/* Notes Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Additional Info
                </Text>
                <View style={styles.sectionDivider} />

                <RNView style={styles.noteSection}>
                  <TextInput
                    value={note}
                    onChangeText={(text) => setNote(text)}
                    placeholder="Add any additional notes..."
                    multiline
                    numberOfLines={5}
                    style={[styles.noteInputWrapper]}
                    editable={!isLoading}
                  />
                </RNView>
              </View>
            </View>
          </Card>
        )}
      />

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {mode === 'add' && onOCR && (
          <Button
            variant="secondary"
            size="md"
            onPress={onOCR}
            disabled={isLoading}
            style={{ flex: 1, marginRight: spacing.md }}
          >
            📸 OCR
          </Button>
        )}
        <Button
          variant="outline"
          size="md"
          onPress={onCancel}
          disabled={isLoading}
          style={{ flex: 1, marginRight: spacing.md }}
        >
          Cancel
        </Button>
        <Button
          size="md"
          onPress={handleSubmit}
          disabled={isLoading}
          loading={isLoading}
          style={{ flex: 1 }}
        >
          {submitButtonText || defaultSubmitText}
        </Button>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowCategoryModal(false);
          setCategorySearchText('');
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable
              onPress={() => {
                setShowCategoryModal(false);
                setCategorySearchText('');
              }}
              style={styles.modalCloseButton}
            >
              <Text style={[styles.modalCloseButtonText, { color: colors.primary }]}>✕</Text>
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
            <RNView style={styles.modalCloseButton} />
          </View>

          {/* Search Input */}
          <View style={styles.modalSearchContainer}>
            <TextInput
              placeholder="Search or type new category..."
              value={categorySearchText}
              onChangeText={setCategorySearchText}
              autoFocus
            />
          </View>

          {/* Categories List */}
          <FlatList
            data={categorySearchText.trim().length > 0 ? filteredCategories : categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleCategorySelect(item)}
                style={({ pressed }) => [
                  styles.categoryModalItem,
                  {
                    backgroundColor: pressed ? colors.backgroundTertiary : colors.background,
                  },
                ]}
              >
                <Text style={[styles.categoryModalItemText, { color: colors.text }]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}
            ListEmptyComponent={
              categorySearchText.trim().length > 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={[styles.modalEmptyText, { color: colors.textSecondary }]}>
                    No categories found
                  </Text>
                  <Pressable
                    onPress={async () => {
                      try {
                        const created = await createCategory(categorySearchText.trim());
                        handleCategorySelect(created);
                      } catch (err) {
                        Alert.alert('Error', 'Failed to create category');
                      }
                    }}
                    style={[styles.createCategoryButton, { borderColor: colors.primary }]}
                  >
                    <Text style={[styles.createCategoryButtonText, { color: colors.primary }]}>
                      Create "{categorySearchText.trim()}"
                    </Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  formContainer: {
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.labelLarge,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: 0,
  },
  noteSection: {
    marginBottom: spacing.lg,
  },
  noteInputWrapper: {
    minHeight: 100,
    paddingVertical: spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  modalTitle: {
    ...typography.labelLarge,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSearchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  categoryModalItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  categoryModalItemText: {
    ...typography.bodyMedium,
    fontSize: 16,
  },
  modalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  modalEmptyText: {
    ...typography.bodyMedium,
  },
  createCategoryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  createCategoryButtonText: {
    ...typography.labelLarge,
    textAlign: 'center',
  },
});
