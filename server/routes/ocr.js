const express = require('express');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '..', 'uploads') });

// POST /ocr - accepts multipart/form-data with field 'image'
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'image file is required in field `image`' });

  const filepath = req.file.path;
  const lang = process.env.OCR_LANG || 'eng';
  const worker = createWorker();

  try {
    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    const { data } = await worker.recognize(filepath);
    await worker.terminate();

    // remove uploaded file
    try {
      fs.unlinkSync(filepath);
    } catch (e) {
      /* ignore */
    }

    return res.json({ text: data.text, confidence: data.confidence });
  } catch (err) {
    try {
      fs.unlinkSync(filepath);
    } catch (e) {
      /* ignore */
    }
    return res.status(500).json({ error: 'OCR failed', details: err.message });
  }
});

module.exports = router;
