import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.API_URL;

export type OCRResult = {
  text: string;
  confidence: number;
};
export type OCRServerResponse = OCRResult & { parsed?: ParsedExpenseData };

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

    // Quick preflight check: ensure the server is reachable before attempting upload.
    // This gives a clearer error when the device/emulator cannot reach the dev server.
    const checkServerReachable = async (url: string, timeout = 5000) => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const res = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(id);
        return res.ok;
      } catch (e) {
        return false;
      }
    };

    const healthUrl = `${BASE_URL}/`;
    const reachable = await checkServerReachable(healthUrl, 5000);
    if (!reachable) {
      const hint =
        `Server unreachable at ${BASE_URL}. Common causes: dev server not running, server bound to localhost only, device/emulator not on same network, or a firewall blocking port 4000.\n` +
        `If you're running on an Android emulator, try using 10.0.2.2:4000 instead of localhost or your machine IP.\n` +
        `Ensure the server logs show incoming requests (server/index.js) and that CORS/firewall allow connections.`;
      console.log('❌ Preflight: server not reachable', hint);
      throw new Error(`OCR server not reachable at ${BASE_URL}. ${hint}`);
    }

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
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((line) => line.length > 0);

  let amount: number | undefined;

  const keywords = /(amount|total|fare|paid|amt|balance|amount due|grand total|price)/i;
  const currencySigns = /[\$€£₹Rs\u20B9]/i;

  // Helper: parse numeric token to number
  const parseNumeric = (s: string) => {
    const cleaned = s
      .replace(/,/g, '')
      .replace(/[^\d.]/g, '')
      .trim();
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : undefined;
  };

  // Helper: detect if a line looks like an ID (e.g., '31202-5145179-3' or contains PNR/CNIC)
  const looksLikeId = (line: string) => {
    if (/pnr|cnic|id|passport|ref(erence)?/i.test(line)) return true;
    // multiple digit groups separated by hyphens (common in CNIC/passport)
    if (/\d+[-]\d+[-]\d+/.test(line)) return true;
    // very long continuous digits (>7) probably not an amount
    const longDigits = line.replace(/[^0-9]/g, '');
    if (longDigits.length >= 8) return true;
    return false;
  };

  // 1) Prefer lines that contain explicit keywords or currency signs
  for (const line of lines) {
    if (keywords.test(line) || currencySigns.test(line)) {
      // extract first numeric token in the line
      const token = line.match(/[\d,]+(?:[.,]\d{2})?/);
      if (token) {
        // skip if the whole line looks like an ID
        if (looksLikeId(line)) {
          console.log('⛔ Skipping ID-like line for amount:', line);
          continue;
        }
        const n = parseNumeric(token[0]);
        if (n && n > 0 && n < 10000000) {
          amount = n;
          console.log('✅ Found amount via keyword/currency line:', amount, 'line:', line);
          break;
        }
      }
    }
  }

  // 2) Fallback: look for decimal numbers anywhere (prefer decimals)
  if (!amount) {
    const decimalToken = text.match(/[\d,]+[.,]\d{2}/);
    if (decimalToken) {
      const n = parseNumeric(decimalToken[0]);
      if (n && n > 0 && n < 10000000) {
        amount = n;
        console.log('✅ Found amount via decimal pattern:', amount);
      }
    }
  }

  // 3) Final fallback: collect numeric candidates from safe lines (exclude ID-like lines)
  if (!amount) {
    const candidates: number[] = [];
    for (const line of lines) {
      if (looksLikeId(line)) {
        console.log('⛔ Skipping ID-like line when gathering candidates:', line);
        continue;
      }
      const tokens = line.match(/[\d,]+(?:[.,]\d{2})?/g);
      if (!tokens) continue;
      for (const t of tokens) {
        const n = parseNumeric(t);
        if (n && n > 0 && n < 10000000) candidates.push(n);
      }
    }
    if (candidates.length > 0) {
      // choose the largest reasonable candidate but prefer values less likely to be IDs
      amount = Math.max(...candidates);
      console.log(
        '✅ Found amount via filtered candidates (largest):',
        amount,
        'candidates:',
        candidates
      );
    }
  }

  // Try to get a title from the first line or business name
  let title: string | undefined;

  // First, attempt to find a line that looks like a merchant/business name
  const firstNonEmpty = lines.find((l) => l.length > 2);
  if (firstNonEmpty) {
    // avoid lines that contain words like PNR, CNIC, Booking, Passenger
    if (!/pnr|cnic|booking|passenger|ticket|departure/i.test(firstNonEmpty)) {
      title = firstNonEmpty;
    }
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
