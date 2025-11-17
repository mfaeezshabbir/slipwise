import { View, Text } from '@/components/Themed';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View as RNView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import Colors, { spacing, typography, borderRadius } from '@/constants/Colors';
import { getCategories, createCategory } from '@/services/category';
import { Button } from '@/components/Button';
import { useColorScheme } from '@/components/useColorScheme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ChevronLeft, Paperclip } from 'lucide-react-native';

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

  // When initialData changes (e.g., from OCR), populate the form fields
  useEffect(() => {
    if (!initialData) return;

    setTitle(initialData.title || '');
    setAmount(initialData.amount || '');
    setDate(initialData.date || new Date().toISOString().split('T')[0]);
    setNote(initialData.note || '');
    setCategoryId(initialData.categoryId);
  }, [initialData]);

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
      let payloadCategoryId = categoryId;
      if (!payloadCategoryId && category.trim()) {
        const existing = categories.find(
          (c) => c.name.toLowerCase() === category.trim().toLowerCase()
        );
        if (existing) {
          payloadCategoryId = existing.id;
        } else {
          const created = await createCategory(category.trim());
          payloadCategoryId = created.id;
          setCategories((prev) => [created, ...prev]);
        }
      }

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

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categorySearchText.trim().toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>How much?</Text>
            <Text style={[styles.amountValue, { color: colors.text }]}>${amount || '0'}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContent}>
            {/* Category */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
              <Pressable
                onPress={() => setShowCategoryModal(true)}
                style={[
                  styles.selectField,
                  { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.selectFieldText,
                    {
                      color: category ? colors.text : colors.textSecondary,
                    },
                  ]}
                >
                  {category || 'Select category'}
                </Text>
              </Pressable>
            </View>

            {/* Title/Description */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Title</Text>
              <RNTextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter title"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={(text: string) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                editable={!isLoading}
              />
              {errors.title && (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.title}</Text>
              )}
            </View>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Amount</Text>
              <RNTextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text: string) => {
                  setAmount(text);
                  if (errors.amount) setErrors({ ...errors, amount: undefined });
                }}
                editable={!isLoading}
              />
              {errors.amount && (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.amount}</Text>
              )}
            </View>

            {/* Date */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[
                  styles.selectField,
                  { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.selectFieldText, { color: colors.text }]}>{date}</Text>
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

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
              <RNTextInput
                style={[
                  styles.textInput,
                  styles.noteInput,
                  {
                    backgroundColor: colors.backgroundTertiary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Add any notes..."
                placeholderTextColor={colors.textSecondary}
                value={note}
                onChangeText={(text: string) => setNote(text)}
                multiline
                numberOfLines={4}
                editable={!isLoading}
              />
            </View>

            {/* Add Attachment */}
            {mode === 'add' && onOCR && (
              <Pressable
                onPress={onOCR}
                style={[
                  styles.attachmentButton,
                  { backgroundColor: colors.backgroundTertiary, borderColor: colors.border },
                ]}
              >
                <Paperclip size={18} color={colors.textSecondary} />
                <Text style={[styles.attachmentButtonText, { color: colors.textSecondary }]}>
                  Add attachment
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* Save/Update Button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            size="lg"
            onPress={handleSubmit}
            disabled={isLoading}
            loading={isLoading}
            style={styles.continueButton}
          >
            {submitButtonText || (mode === 'add' ? 'Save' : 'Update')}
          </Button>
        </View>
      </KeyboardAvoidingView>

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
            <RNTextInput
              placeholder="Search or type new category..."
              value={categorySearchText}
              onChangeText={(text: string) => setCategorySearchText(text)}
              autoFocus
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.backgroundTertiary,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Categories List */}
          <ScrollView>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((item, index) => (
                <RNView key={item.id}>
                  <Pressable
                    onPress={() => handleCategorySelect(item)}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <Text style={[styles.categoryItemText, { color: colors.text }]}>
                      {item.name}
                    </Text>
                  </Pressable>
                  {index < filteredCategories.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </RNView>
              ))
            ) : categorySearchText.trim().length > 0 ? (
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
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    // paddingVertical: spacing.lg,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  formContent: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  selectField: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    justifyContent: 'center',
  },
  selectFieldText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  attachmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
  },
  continueButton: {
    // marginBottom: spacing.sm,
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
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  modalSearchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  categoryItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  categoryItemText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
  },
  modalEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
    minHeight: 200,
  },
  modalEmptyText: {
    fontSize: 16,
  },
  createCategoryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  createCategoryButtonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});
