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
  allowedHeaders: ["Content-Type", "Authorization", "x-organisation-id"] 
}));

// IMPORTANT: Add this to parse JSON bodies for the DELETE request
app.use(express.json()); 

const upload = multer({ storage: multer.memoryStorage() });

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const getBucketConfig = (mimetype, filename) => {
  if (mimetype.includes('pdf')) return { bucket: process.env.BUCKET_PDF, url: process.env.URL_PDF };
  if (mimetype.includes('epub') || filename.endsWith('.epub')) return { bucket: process.env.BUCKET_EPUB, url: process.env.URL_EPUB };
  if (mimetype.includes('audio') || mimetype.includes('mp3')) return { bucket: process.env.BUCKET_AUDIO, url: process.env.URL_AUDIO };
  if (mimetype.includes('video') || mimetype.includes('mp4')) return { bucket: process.env.BUCKET_VIDEO, url: process.env.URL_VIDEO };
  if (mimetype.includes('image')) return { bucket: process.env.BUCKET_IMAGE, url: process.env.URL_IMAGE };
  
  // ADD THESE TWO LINES FOR WORD AND POWERPOINT
  if (filename.endsWith('.docx') || filename.endsWith('.doc')) return { bucket: process.env.BUCKET_PDF, url: process.env.URL_PDF };
  if (filename.endsWith('.pptx') || filename.endsWith('.ppt')) return { bucket: process.env.BUCKET_PDF, url: process.env.URL_PDF };
  
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
      CacheControl: "public, max-age=2592000, immutable", // <--- ADD THIS LINE
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
        CacheControl: "public, max-age=2592000, immutable", // <--- ADD THIS LINE
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
      
      // 1. Get the exact file name (Key) from the URL
      const fileName = decodeURIComponent(url.split('/').pop());
      
      // 2. Figure out which bucket this file belongs to
      let bucketName = process.env.BUCKET_PDF; // Default
      
      if (url.includes(process.env.URL_AUDIO)) {
        bucketName = process.env.BUCKET_AUDIO;
      } else if (url.includes(process.env.URL_VIDEO)) {
        bucketName = process.env.BUCKET_VIDEO;
      } else if (url.includes(process.env.URL_IMAGE)) {
        bucketName = process.env.BUCKET_IMAGE;
      } else if (url.includes(process.env.URL_EPUB)) {
        bucketName = process.env.BUCKET_EPUB;
      } else if (url.includes(process.env.URL_PDF)) {
        bucketName = process.env.BUCKET_PDF;
      } else {
        console.warn(`⚠️ Could not identify bucket for URL: ${url}`);
        continue; // Skip if we don't know the bucket
      }

      console.log(`Deleting ${fileName} from bucket ${bucketName}...`);

      // 3. Delete from R2
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
app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});