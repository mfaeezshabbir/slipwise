import { View, Text } from '@/components/Themed';
import {
  StyleSheet,
  FlatList,
  Pressable,
  View as RNView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import React, { useEffect, useState } from 'react';
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
}

export const ExpenseForm = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText,
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
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
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
    setShowCategorySuggestions(false);
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
    c.name.toLowerCase().includes(category.trim().toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={[{ key: 'form' }]} // Dummy data to use FlatList
        keyExtractor={(item) => item.key}
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

                {/* Category Input with Autocomplete */}
                <View style={styles.categoryInputWrapper}>
                  <TextInput
                    label="Category"
                    placeholder="e.g. food, transport, shopping"
                    value={category}
                    onChangeText={(text) => {
                      setCategory(text);
                      setCategoryId(undefined);
                      setShowCategorySuggestions(text.length > 0);
                    }}
                    editable={!isLoading}
                  />

                  {/* Dropdown Suggestions */}
                  {showCategorySuggestions && category.trim().length > 0 && (
                    <FlatList
                      data={filteredCategories}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={true}
                      ItemSeparatorComponent={() => (
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      )}
                      renderItem={({ item }) => (
                        <Pressable
                          onPress={() => handleCategorySelect(item)}
                          style={({ pressed }) => [
                            styles.suggestionItemRow,
                            {
                              backgroundColor: pressed
                                ? colors.backgroundTertiary
                                : colors.inputBackground,
                            },
                          ]}
                        >
                          <View style={styles.suggestionLeft}>
                            <Search size={16} color={colors.primary} />
                          </View>

                          <Text style={[styles.suggestionText, { color: colors.text }]}>
                            {item.name}
                          </Text>

                          <Pressable
                            onPress={() => {
                              setCategory('');
                              setShowCategorySuggestions(false);
                            }}
                            style={styles.suggestionRight}
                          >
                            <ChevronRight size={18} color={colors.primary} />
                          </Pressable>
                        </Pressable>
                      )}
                    />
                  )}
                </View>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  categoryInputWrapper: {
    position: 'relative',
  },
  suggestionsDropdown: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  suggestionText: {
    ...typography.bodyMedium,
  },
  suggestionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  suggestionLeft: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  suggestionRight: {
    marginLeft: 'auto',
    paddingLeft: spacing.sm,
  },
  divider: {
    height: 1,
    marginVertical: 0,
  },
  noResults: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  noteSection: {
    marginBottom: spacing.lg,
  },
  noteLabel: {
    ...typography.labelLarge,
    marginBottom: spacing.sm,
  },
  noteInputWrapper: {
    minHeight: 100,
    paddingVertical: spacing.md,
  },
  noteInputText: {
    ...typography.bodyMedium,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
});
