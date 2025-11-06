import { View, Text } from '@/components/Themed';
import { StyleSheet, ScrollView, Alert, FlatList, Pressable, View as RNView } from 'react-native';
import React, { useEffect, useState } from 'react';
import Colors, { spacing, typography, borderRadius } from '@/constants/Colors';
import { getCategories, createCategory } from '@/services/category';
import { TextInput } from '@/components/TextInput';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useColorScheme } from '@/components/useColorScheme';

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
  const formTitle = mode === 'add' ? 'Add Expense' : 'Edit Expense';
  const formSubtitle = mode === 'add' ? 'Create a new expense record' : 'Update expense details';

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(category.trim().toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card shadowSize="small">
          <View style={styles.formContainer}>
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

            {/* Amount Input */}
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

            {/* Date Input */}
            <TextInput
              label="Date"
              placeholder={new Date().toISOString().split('T')[0]}
              value={date}
              onChangeText={(text) => {
                setDate(text);
                if (errors.date) setErrors({ ...errors, date: undefined });
              }}
              hint="Format: YYYY-MM-DD"
              editable={!isLoading}
            />

            {/* Category Input with Autocomplete */}
            <TextInput
              label="Category"
              placeholder="e.g. food, transport, shopping"
              value={category}
              onChangeText={(text) => {
                setCategory(text);
                setCategoryId(undefined);
                setShowCategorySuggestions(true);
              }}
              editable={!isLoading}
            />

            {showCategorySuggestions &&
              category.trim().length > 0 &&
              filteredCategories.length > 0 && (
                <Card>
                  <FlatList
                    data={filteredCategories}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => handleCategorySelect(item)}
                        style={({ pressed }) => [
                          styles.categorySuggestion,
                          {
                            backgroundColor: pressed ? colors.backgroundTertiary : 'transparent',
                          },
                        ]}
                      >
                        <Text style={{ color: colors.text }}>{item.name}</Text>
                      </Pressable>
                    )}
                  />
                </Card>
              )}

            {/* Note Input */}
            <RNView style={styles.noteSection}>
              <Text style={[styles.noteLabel, { color: colors.text }]}>Note (Optional)</Text>
              <RNView
                style={[
                  styles.noteInputWrapper,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.noteInputText,
                    { color: note ? colors.text : colors.textTertiary },
                  ]}
                >
                  {note || 'Add any additional notes...'}
                </Text>
              </RNView>
            </RNView>

            {/* Tip Card - only show on add mode */}
            {mode === 'add' && title && (
              <Card variant="outlined">
                <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                  💡 Tip: Include category keywords like "food", "transport", "shopping",
                  "entertainment", "health", or "utilities" in your title or note for better
                  organization.
                </Text>
              </Card>
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.buttonContainer, { backgroundColor: colors.background }]}>
        <Button
          variant="outline"
          size="md"
          onPress={onCancel}
          disabled={isLoading}
          fullWidth
          style={{ marginRight: spacing.md }}
        >
          Cancel
        </Button>
        <Button size="md" onPress={handleSubmit} disabled={isLoading} loading={isLoading} fullWidth>
          {submitButtonText || defaultSubmitText}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  formContainer: {
    gap: spacing.md,
  },
  categorySuggestion: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  noteSection: {
    marginBottom: spacing.lg,
  },
  noteLabel: {
    ...typography.labelLarge,
    marginBottom: spacing.sm,
  },
  noteInputWrapper: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  noteInputText: {
    ...typography.bodyMedium,
  },
  suggestionText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
