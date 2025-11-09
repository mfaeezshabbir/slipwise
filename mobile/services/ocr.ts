import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.API_URL;

export type OCRResult = {
  text: string;
  confidence: number;
};

export type ParsedExpenseData = {
  title?: string;
  amount?: number;
  note?: string;
};

/**
 * Upload an image to the OCR endpoint and get the extracted text
 */
export async function recognizeReceiptImage(imageUri: string): Promise<OCRResult> {
  try {
    console.log('🎬 OCR Request Started');
    console.log('📸 Image URI:', imageUri);

    // Read the image file as base64 if it's a file URI
    let imageData: any;

    if (imageUri.startsWith('file://')) {
      // Local file
      imageData = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      };
      console.log('✅ Local file detected');
    } else {
      // Asset or data URI
      imageData = {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      };
      console.log('✅ Asset/Data URI detected');
    }

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('image', imageData as any);
    console.log('📦 FormData created with image');

    console.log('🌐 Uploading to:', `${BASE_URL}/ocr`);
    const response = await fetch(`${BASE_URL}/ocr`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header - fetch will set it with boundary
      },
    });

    console.log('📥 Response Status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ OCR Request Failed:', error);
      throw new Error(`OCR failed: ${error}`);
    }

    const result = await response.json();
    console.log('✅ OCR Response Received');
    console.log('📊 Result:', result);
    return result as OCRResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log('❌ OCR Error:', message);
    throw new Error(`Failed to recognize receipt: ${message}`);
  }
}

/**
 * Parse OCR text to extract expense information
 * This is a simple parser that looks for common patterns
 */
export function parseOCRText(text: string): ParsedExpenseData {
  const lines = text.split('\n').filter((line) => line.trim());

  let amount: number | undefined;

  // 1. First, try to find "AMOUNT" keyword followed by a number
  const amountKeywordMatch = text.match(/AMOUNT\s+[\$€£]?\s*([\d,]+(?:[.,]\d{2})?)/i);
  if (amountKeywordMatch) {
    const amountStr = amountKeywordMatch[1].replace(/,/g, '');
    amount = parseFloat(amountStr);
    console.log('✅ Found amount via AMOUNT keyword:', amount);
  }

  // 2. If no amount found via keyword, try common currency patterns: $XX.XX, XX.XX
  if (!amount) {
    const amountMatch = text.match(/[\$€£]?\s*([\d,]+[.,]\d{2})/);
    if (amountMatch) {
      const amountStr = amountMatch[1].replace(/,/g, '');
      amount = parseFloat(amountStr);
      console.log('✅ Found amount via currency pattern:', amount);
    }
  }

  // 3. If still no amount, look for any large number (could be amount without decimals)
  if (!amount) {
    const allNumbers = text.match(/[\d,]+/g);
    if (allNumbers) {
      // Filter and convert to actual numbers
      const numericValues = allNumbers
        .map((n) => parseFloat(n.replace(/,/g, '')))
        .filter((n) => n > 0 && n < 1000000); // Reasonable expense range

      if (numericValues.length > 0) {
        // Take the largest number (likely the total)
        amount = Math.max(...numericValues);
        console.log('✅ Found amount via largest number:', amount);
      }
    }
  }

  // Try to get a title from the first line or business name
  let title: string | undefined;

  // First, look for common bank/business names
  const businessMatch = text.match(/^(\w+(?:\s+\w+)?)\s*$/m);
  if (businessMatch) {
    title = businessMatch[1];
  }

  // Fallback to first line
  if (!title) {
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length < 50 && firstLine.length > 2) {
      title = firstLine;
    }
  }

  // Set default title if none found
  if (!title) {
    title = 'Bank Transfer';
  }

  console.log('📝 Parsed Data:', { title, amount, textLength: text.length });

  return {
    title,
    amount,
    note: text.substring(0, 300), // Store raw text as note for reference
  };
}

/**
 * Pick an image from device storage
 * @param allowEditing - Whether to allow image editing/cropping (default: false)
 */
export async function pickImage(allowEditing: boolean = false): Promise<string | null> {
  try {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      throw new Error('Media library permission denied');
    }

    const config: any = {
      mediaTypes: ['images'],
      allowsEditing: allowEditing,
      quality: 0.8,
    };

    const result = await ImagePicker.launchImageLibraryAsync(config);

    if (!result.canceled && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to pick image: ${message}`);
  }
}

/**
 * Take a photo with the camera
 * @param allowEditing - Whether to allow image editing/cropping (default: false)
 */
export async function takePhoto(allowEditing: boolean = false): Promise<string | null> {
  try {
    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      throw new Error('Camera permission denied');
    }

    const config: any = {
      allowsEditing: allowEditing,
      quality: 0.8,
    };

    const result = await ImagePicker.launchCameraAsync(config);

    if (!result.canceled && result.assets.length > 0) {
      return result.assets[0].uri;
    }

    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to take photo: ${message}`);
  }
}
