const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    "https://loris-five.vercel.app", 
    "http://localhost:5173",         
    /\.vercel\.app$/                 
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  // ADD x-organisation-id HERE:
  allowedHeaders: ["Content-Type", "Authorization", "x-organisation-id"] 
}));

const upload = multer({ storage: multer.memoryStorage() });

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Helper to figure out which bucket to use based on file type
const getBucketConfig = (mimetype, filename) => {
  if (mimetype.includes('pdf')) return { bucket: process.env.BUCKET_PDF, url: process.env.URL_PDF };
  if (mimetype.includes('epub') || filename.endsWith('.epub')) return { bucket: process.env.BUCKET_EPUB, url: process.env.URL_EPUB };
  if (mimetype.includes('audio') || mimetype.includes('mp3')) return { bucket: process.env.BUCKET_AUDIO, url: process.env.URL_AUDIO };
  if (mimetype.includes('video') || mimetype.includes('mp4')) return { bucket: process.env.BUCKET_VIDEO, url: process.env.URL_VIDEO };
  if (mimetype.includes('image')) return { bucket: process.env.BUCKET_IMAGE, url: process.env.URL_IMAGE };
  return { bucket: process.env.BUCKET_PDF, url: process.env.URL_PDF };
};

// ── UPLOAD ROUTE ──────────────────────────────────
app.post('/api/upload', upload.fields([
  { name: 'pdfFile', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const mainFile = req.files['pdfFile'] ? req.files['pdfFile'][0] : null;
    const cover = req.files['coverImage'] ? req.files['coverImage'][0] : null;

    if (!mainFile) return res.status(400).json({ error: 'No main file uploaded' });

    // Upload Main File
    const mainConfig = getBucketConfig(mainFile.mimetype, mainFile.originalname);
    const mainKey = `${crypto.randomBytes(8).toString('hex')}-${mainFile.originalname}`;
    
    await r2.send(new PutObjectCommand({
      Bucket: mainConfig.bucket,
      Key: mainKey,
      Body: mainFile.buffer,
      ContentType: mainFile.mimetype,
    }));
    const mainUrl = `${mainConfig.url}/${mainKey}`;

    // Upload Cover
    let coverUrl = null;
    if (cover) {
      const coverKey = `${crypto.randomBytes(8).toString('hex')}-${cover.originalname}`;
      await r2.send(new PutObjectCommand({
        Bucket: process.env.BUCKET_IMAGE,
        Key: coverKey,
        Body: cover.buffer,
        ContentType: cover.mimetype,
      }));
      coverUrl = `${process.env.URL_IMAGE}/${coverKey}`;
    }

    res.status(200).json({ url: mainUrl, coverUrl: coverUrl });
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
      
      // Figure out which bucket this file belongs to
      let bucketName = process.env.BUCKET_PDF;
      if (url.includes(process.env.URL_AUDIO)) bucketName = process.env.BUCKET_AUDIO;
      else if (url.includes(process.env.URL_VIDEO)) bucketName = process.env.BUCKET_VIDEO;
      else if (url.includes(process.env.URL_IMAGE)) bucketName = process.env.BUCKET_IMAGE;
      else if (url.includes(process.env.URL_EPUB)) bucketName = process.env.BUCKET_EPUB;

      await r2.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      }));
    }

    res.status(200).json({ message: 'Files deleted from R2' });
  } catch (error) {
    console.error("R2 Delete error:", error);
    res.status(500).json({ error: 'Failed to delete files' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});