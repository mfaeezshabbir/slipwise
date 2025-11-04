import { View, Text } from '@/components/Themed';
import React, { useState } from 'react';
import { StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { addExpense } from '@/services/expense';
import { useRouter } from 'expo-router';

export default function AddExpenseScreen() {
  const router = useRouter();
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');

  const submit = async () => {
    if (!vendor || !amount || !date) {
      Alert.alert('Validation', 'vendor, amount and date are required');
      return;
    }
    const created = await addExpense({ vendor, amount: Number(amount), date, notes: note });
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Vendor</Text>
      <TextInput
        style={styles.input}
        value={vendor}
        onChangeText={setVendor}
        placeholder="e.g., Coffee Shop"
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="12.50"
      />

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.label}>Note</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="optional" />

      <Pressable style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontWeight: '600', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 6, marginTop: 6 },
  button: {
    backgroundColor: '#2A3A69',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
