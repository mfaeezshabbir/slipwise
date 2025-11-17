const express = require('express');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

// POST /ocr - accepts multipart/form-data with field 'image'
router.post('/', upload.single('image'), async (req, res) => {
  console.log('=== OCR Request Received ===');
  console.log('File:', req.file);
  console.log('Body:', req.body);

  if (!req.file) {
    console.log('❌ Error: No image file provided');
    return res.status(400).json({ error: 'image file is required in field `image`' });
  }

  const filepath = req.file.path;
  const lang = process.env.OCR_LANG || 'eng';

  console.log('✅ File received:', filepath);
  console.log('📝 Language:', lang);

  const worker = await createWorker(lang);

  try {
    console.log('🔄 Starting OCR recognition...');
    const { data } = await worker.recognize(filepath);
    console.log('✅ OCR Recognition Complete');
    console.log('📊 Raw OCR Data:', data);
    console.log('📄 Text:', data.text);
    console.log('🎯 Confidence:', data.confidence);

    // Simple server-side parsing to extract structured fields
    const parseText = (raw) => {
      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const result = { title: null, amount: null, date: null, note: null };

      const keywords = /(amount|total|fare|paid|amt|balance|amount due|grand total|price)/i;
      const currencySigns = /[\$€£₹Rs\u20B9]/i;

      const parseNumeric = (s) => {
        if (!s) return null;
        const cleaned = s
          .replace(/,/g, '')
          .replace(/[^0-9.]/g, '')
          .trim();
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : null;
      };

      const looksLikeId = (line) => {
        if (/pnr|cnic|id|passport|ref(erence)?/i.test(line)) return true;
        if (/\d+[-]\d+[-]\d+/.test(line)) return true;
        const longDigits = line.replace(/[^0-9]/g, '');
        if (longDigits.length >= 8) return true;
        return false;
      };

      // 1. look for explicit keyword/currency lines
      for (const line of lines) {
        if (keywords.test(line) || currencySigns.test(line)) {
          const token = line.match(/[0-9,]+(?:[.,][0-9]{2})?/);
          if (token && !looksLikeId(line)) {
            const n = parseNumeric(token[0]);
            if (n && n > 0 && n < 10000000) {
              result.amount = n;
              break;
            }
          }
        }
      }

      // 2. decimal fallback
      if (!result.amount) {
        const decimalToken = raw.match(/[0-9,]+[.,][0-9]{2}/);
        if (decimalToken) {
          const n = parseNumeric(decimalToken[0]);
          if (n && n > 0 && n < 10000000) result.amount = n;
        }
      }

      // 3. gather candidates from safe lines
      if (!result.amount) {
        const candidates = [];
        for (const line of lines) {
          if (looksLikeId(line)) continue;
          const tokens = line.match(/[0-9,]+(?:[.,][0-9]{2})?/g);
          if (!tokens) continue;
          for (const t of tokens) {
            const n = parseNumeric(t);
            if (n && n > 0 && n < 10000000) candidates.push(n);
          }
        }
        if (candidates.length) result.amount = Math.max(...candidates);
      }

      // Try to pick a title (first non-ID, non-booking/PNR line)
      for (const line of lines) {
        if (/pnr|cnic|booking|passenger|ticket|departure/i.test(line)) continue;
        if (looksLikeId(line)) continue;
        if (line.length > 2 && line.length < 60) {
          result.title = line;
          break;
        }
      }

      // fallback title
      if (!result.title) result.title = lines[0] || null;

      result.note = raw.substring(0, 1000);
      return result;
    };

    const parsed = parseText(data.text);

    await worker.terminate();
    console.log('✅ Worker terminated');

    // remove uploaded file
    try {
      fs.unlinkSync(filepath);
      console.log('🗑️ Uploaded file deleted');
    } catch (e) {
      console.log('⚠️ Could not delete file:', e.message);
    }

    console.log('📤 Sending response:', { text: data.text, confidence: data.confidence, parsed });
    return res.json({ text: data.text, confidence: data.confidence, parsed });
  } catch (err) {
    console.log('❌ OCR Error:', err);
    console.log('Error Message:', err.message);
    console.log('Error Stack:', err.stack);

    try {
      fs.unlinkSync(filepath);
    } catch (e) {
      console.log('⚠️ Could not delete file on error:', e.message);
    }
    return res.status(500).json({ error: 'OCR failed', details: err.message });
  }
});

module.exports = router;
