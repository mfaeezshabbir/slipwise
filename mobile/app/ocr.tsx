import React, { useState } from 'react';
import {
  StyleSheet,
  Alert,
  ActivityIndicator,
  View as RNView,
  Image,
  ScrollView,
  Switch,
  Pressable,
} from 'react-native';
import { View, Text } from '@/components/Themed';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import Colors, { spacing } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { recognizeReceiptImage, parseOCRText, pickImage, takePhoto } from '@/services/ocr';
import { useRouter } from 'expo-router';
import { Camera, Image as ImageIcon } from 'lucide-react-native';

export interface OCRScreenProps {
  onExpenseDataExtracted?: (data: { title?: string; amount?: number; note?: string }) => void;
}

export default function OCRScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const isDark = colorScheme === 'dark';

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allowEditing, setAllowEditing] = useState(true);
  const [parsedData, setParsedData] = useState<{
    title?: string;
    amount?: number;
    note?: string;
  } | null>(null);

  const handlePickImage = async () => {
    try {
      setIsLoading(true);
      const imageUri = await pickImage(allowEditing);

      if (imageUri) {
        setSelectedImage(imageUri);
        await processImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to pick image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      const imageUri = await takePhoto(allowEditing);

      if (imageUri) {
        setSelectedImage(imageUri);
        await processImage(imageUri);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to take photo');
    } finally {
      setIsLoading(false);
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      setIsLoading(true);

      // Send to OCR service
      const result = await recognizeReceiptImage(imageUri);

      setOcrText(result.text);
      setConfidence(result.confidence);

      // Parse the OCR text
      const parsed = parseOCRText(result.text);
      setParsedData(parsed);
    } catch (error) {
      Alert.alert('OCR Error', error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseData = () => {
    if (!parsedData) {
      Alert.alert('No data', 'Please process an image first');
      return;
    }

    // Navigate to add expense with pre-filled data
    router.push({
      pathname: '/add',
      params: {
        title: parsedData.title || '',
        amount: parsedData.amount?.toString() || '',
        note: parsedData.note || '',
      },
    });
  };

  const handleReset = () => {
    setSelectedImage(null);
    setOcrText(null);
    setConfidence(null);
    setParsedData(null);
  };

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title="OCR Scanner"
        subtitle="Scan receipts to auto-fill expenses"
        showBackButton
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <>
            {/* Image Editing Option */}
            <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <Pressable style={styles.toggleRow} onPress={() => setAllowEditing(!allowEditing)}>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>
                  Allow Editing & Cropping
                </Text>
                <Switch
                  value={allowEditing}
                  onValueChange={setAllowEditing}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={allowEditing ? colors.primary : colors.textTertiary}
                />
              </Pressable>
              <Text style={[styles.toggleHelp, { color: colors.textSecondary }]}>
                {allowEditing
                  ? 'You can crop the image freely before processing'
                  : 'Capture image directly without editing'}
              </Text>
            </Card>

            {/* Image Selection Buttons */}
            <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Image Source</Text>

              <Button onPress={handleTakePhoto} disabled={isLoading} style={styles.button}>
                <Camera size={20} color="white" style={{ marginRight: spacing.sm }} />
                <Text style={styles.buttonText}>Take Photo</Text>
              </Button>

              <Button
                onPress={handlePickImage}
                disabled={isLoading}
                variant="secondary"
                style={styles.button}
              >
                <ImageIcon size={20} color={colors.primary} style={{ marginRight: spacing.sm }} />
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  Choose from Gallery
                </Text>
              </Button>
            </Card>
          </>
        ) : (
          <>
            {/* Selected Image Preview */}
            <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Receipt Preview</Text>

              <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            </Card>

            {/* Loading State */}
            {isLoading && (
              <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                <RNView style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text }]}>
                    Processing image...
                  </Text>
                </RNView>
              </Card>
            )}

            {/* OCR Results */}
            {ocrText && !isLoading && (
              <>
                {/* Confidence Score */}
                {confidence !== null && (
                  <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Recognition Confidence
                    </Text>
                    <Text style={[styles.confidenceText, { color: colors.text }]}>
                      {(confidence * 100).toFixed(1)}%
                    </Text>
                  </Card>
                )}

                {/* Parsed Data */}
                {parsedData && (
                  <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                      Extracted Information
                    </Text>

                    {parsedData.title && (
                      <RNView style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.text }]}>Title:</Text>
                        <Text
                          style={[styles.dataValue, { color: colors.primary }]}
                          numberOfLines={2}
                        >
                          {parsedData.title}
                        </Text>
                      </RNView>
                    )}

                    {parsedData.amount && (
                      <RNView style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.text }]}>Amount:</Text>
                        <Text style={[styles.dataValue, { color: colors.primary }]}>
                          ${parsedData.amount.toFixed(2)}
                        </Text>
                      </RNView>
                    )}
                  </Card>
                )}

                {/* OCR Text Preview */}
                <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Raw Text</Text>
                  <Text style={[styles.ocrText, { color: colors.text }]} numberOfLines={6}>
                    {ocrText}
                  </Text>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            {parsedData && !isLoading && (
              <RNView style={styles.actionButtons}>
                <Button onPress={handleUseData} style={[styles.button, { flex: 1 }]}>
                  <Text style={styles.buttonText}>Use This Data</Text>
                </Button>

                <Button
                  onPress={handleReset}
                  variant="secondary"
                  style={[styles.button, { flex: 1, marginLeft: spacing.md }]}
                >
                  <Text style={[styles.buttonText, { color: colors.primary }]}>Try Again</Text>
                </Button>
              </RNView>
            )}
          </>
        )}
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  toggleHelp: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  button: {
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  confidenceText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  dataRow: {
    marginBottom: spacing.md,
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  dataValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  ocrText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Courier New',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
});
