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

    await worker.terminate();
    console.log('✅ Worker terminated');

    // remove uploaded file
    try {
      fs.unlinkSync(filepath);
      console.log('🗑️ Uploaded file deleted');
    } catch (e) {
      console.log('⚠️ Could not delete file:', e.message);
    }

    console.log('📤 Sending response:', { text: data.text, confidence: data.confidence });
    return res.json({ text: data.text, confidence: data.confidence });
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
