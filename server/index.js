const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // <-- This fixes the req.body error we had earlier

const upload = multer({ storage: multer.memoryStorage() });

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// ── UPLOAD ROUTE ──────────────────────────────────
app.post('/api/upload', upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const pdf = req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
    const cover = req.files['coverImage'] ? req.files['coverImage'][0] : null;

    if (!pdf) return res.status(400).json({ error: 'No PDF uploaded' });

    // Upload PDF
    const pdfKey = `${crypto.randomBytes(8).toString('hex')}-${pdf.originalname}`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: pdfKey,
      Body: pdf.buffer,
      ContentType: pdf.mimetype,
    }));
    const pdfUrl = `${process.env.R2_PUBLIC_URL}/${pdfKey}`;

    // Upload Cover (if provided)
    let coverUrl = null;
    if (cover) {
      const coverKey = `${crypto.randomBytes(8).toString('hex')}-${cover.originalname}`;
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: coverKey,
        Body: cover.buffer,
        ContentType: cover.mimetype,
      }));
      coverUrl = `${process.env.R2_PUBLIC_URL}/${coverKey}`;
    }

    res.status(200).json({ url: pdfUrl, coverUrl: coverUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── DELETE ROUTE ──────────────────────────────────
app.delete('/api/delete', async (req, res) => {
  try {
    const { fileUrls } = req.body;
    if (!fileUrls || !Array.isArray(fileUrls)) {
      return res.status(400).json({ error: 'No file URLs provided' });
    }

    for (const url of fileUrls) {
      if (!url) continue;
      const fileName = url.split('/').pop();
      
      await r2.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
      }));
    }

    res.status(200).json({ message: 'Files deleted from R2' });
  } catch (error) {
    console.error("R2 Delete error:", error);
    res.status(500).json({ error: 'Failed to delete files from R2' });
  }
});

// ── START SERVER ──────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});