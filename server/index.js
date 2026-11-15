'use strict';

require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

const app = express();
const PORT = Number(process.env.PORT || 3001);
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 2;
const WINDOW_MS = 60 * 1000;
const rateBuckets = new Map();

const r2Config = {
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
};
const r2Ready = Object.values(r2Config).every(Boolean);
const r2 = r2Ready
  ? new S3Client({
      region: 'auto',
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    })
  : null;

const bucketDefinitions = [
  { bucket: process.env.BUCKET_PDF, publicUrl: process.env.URL_PDF, extensions: ['.pdf'] },
  { bucket: process.env.BUCKET_EPUB, publicUrl: process.env.URL_EPUB, extensions: ['.epub'] },
  { bucket: process.env.BUCKET_AUDIO, publicUrl: process.env.URL_AUDIO, extensions: ['.mp3'] },
  { bucket: process.env.BUCKET_VIDEO, publicUrl: process.env.URL_VIDEO, extensions: ['.mp4'] },
  { bucket: process.env.BUCKET_IMAGE, publicUrl: process.env.URL_IMAGE, extensions: ['.jpg', '.jpeg', '.png'] },
];

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

// Security headers are set explicitly so the server does not require another runtime package.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Fail closed: no wildcard CORS and no implicit localhost origin in production.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'Origin is not allowed.' });
  }
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Organisation-Id');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '32kb' }));

function rateLimit({ limit, windowMs = WINDOW_MS, keyPrefix, keyGenerator }) {
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const identity = typeof keyGenerator === 'function' ? keyGenerator(req) : ip;
    const key = `${keyPrefix}:${identity || ip}`;
    const now = Date.now();
    let entry = rateBuckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      rateBuckets.set(key, entry);
    }
    entry.count += 1;
    res.setHeader('RateLimit-Limit', String(limit));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    if (entry.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  };
}

// Periodically remove expired counters to keep the in-memory limiter bounded.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateBuckets) {
    if (entry.resetAt <= now) rateBuckets.delete(key);
  }
}, 5 * 60 * 1000);
cleanupTimer.unref();

function requiredServerConfig(req, res, next) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Supabase server configuration is incomplete.' });
  }
  if (!r2Ready || !r2) {
    return res.status(503).json({ error: 'Cloudflare R2 server configuration is incomplete.' });
  }
  next();
}

async function supabaseRest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}).`);
  }
  return text ? JSON.parse(text) : null;
}

// Verify the bearer token with Supabase Auth itself. No client-supplied user ID is trusted.
async function authenticate(req, res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) return res.status(401).json({ error: 'A valid access token is required.' });

    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${match[1]}`,
      },
    });
    if (!response.ok) return res.status(401).json({ error: 'The access token is invalid or expired.' });

    const user = await response.json();
    if (!user || !user.id) return res.status(401).json({ error: 'Unable to identify the authenticated user.' });
    req.authUser = user;
    next();
  } catch (error) {
    console.error('Authentication verification failed:', error.message);
    res.status(503).json({ error: 'Authentication verification is temporarily unavailable.' });
  }
}

async function getProfile(authUserId) {
  const query = new URLSearchParams({
    select: 'id,auth_user_id,platform_role',
    auth_user_id: `eq.${authUserId}`,
    limit: '1',
  });
  const rows = await supabaseRest(`Profiles?${query.toString()}`);
  return rows && rows[0] ? rows[0] : null;
}

async function isAuthorisedForOrganisation(authUserId, organisationId) {
  if (!/^\d+$/.test(String(organisationId || ''))) return { allowed: false, profile: null };
  const organisationQuery = new URLSearchParams({ select: 'id', id: `eq.${organisationId}`, limit: '1' });
  const organisations = await supabaseRest(`Organisation?${organisationQuery.toString()}`);
  if (!organisations || !organisations.length) return { allowed: false, profile: null };

  const profile = await getProfile(authUserId);
  if (!profile) return { allowed: false, profile: null };
  if (profile.platform_role === 'platform_manager') return { allowed: true, profile };

  const query = new URLSearchParams({
    select: 'id',
    user_id: `eq.${profile.id}`,
    organisation_id: `eq.${organisationId}`,
    role: 'eq.admin',
    status: 'eq.active',
    limit: '1',
  });
  const memberships = await supabaseRest(`Memberships?${query.toString()}`);
  return { allowed: Boolean(memberships && memberships.length), profile };
}

async function requireUploadRole(req, res, next) {
  try {
    const organisationId = req.headers['x-organisation-id'];
    if (!organisationId) return res.status(400).json({ error: 'X-Organisation-Id header is required.' });
    const result = await isAuthorisedForOrganisation(req.authUser.id, organisationId);
    if (!result.allowed) return res.status(403).json({ error: 'An active organisation-admin membership is required.' });
    req.organisationId = String(organisationId);
    req.profile = result.profile;
    next();
  } catch (error) {
    console.error('Organisation permission check failed:', error.message);
    res.status(503).json({ error: 'Could not verify organisation permissions.' });
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
    fields: 4,
    parts: 6,
  },
  fileFilter: (_req, file, callback) => {
    const allowedExtensions = ['.pdf', '.epub', '.mp3', '.mp4', '.jpg', '.jpeg', '.png'];
    const extension = require('node:path').extname(file.originalname || '').toLowerCase();
    if (!allowedExtensions.includes(extension)) return callback(new Error('Unsupported file extension.'));
    callback(null, true);
  },
});

function safeExtension(filename) {
  return require('node:path').extname(filename || '').toLowerCase();
}

function detectFileType(buffer, extension) {
  if (extension === '.pdf' && buffer.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (extension === '.epub' && buffer[0] === 0x50 && buffer[1] === 0x4b) return 'application/epub+zip';
  if (extension === '.mp3' && (buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0))) return 'audio/mpeg';
  if (extension === '.mp4' && buffer.subarray(4, 8).toString() === 'ftyp') return 'video/mp4';
  if (extension === '.png' && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (['.jpg', '.jpeg'].includes(extension) && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}

function getBucketDefinition(extension) {
  return bucketDefinitions.find((definition) => definition.extensions.includes(extension));
}

function getObjectKey(organisationId, extension) {
  return `org-${organisationId}/${crypto.randomUUID()}${extension}`;
}

async function putFile(file, organisationId) {
  const extension = safeExtension(file.originalname);
  const detectedType = detectFileType(file.buffer, extension);
  if (!detectedType) throw new Error(`The ${extension || 'uploaded'} file content does not match an allowed file type.`);
  const bucket = getBucketDefinition(extension);
  if (!bucket || !bucket.bucket || !bucket.publicUrl) throw new Error(`Storage bucket configuration is missing for ${extension}.`);

  const key = getObjectKey(organisationId, extension);
  await r2.send(new PutObjectCommand({
    Bucket: bucket.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: detectedType,
    Metadata: { organisationid: String(organisationId) },
  }));
  return { url: `${bucket.publicUrl.replace(/\/$/, '')}/${key}`, key, contentType: detectedType };
}

function resolveStoredObject(publicUrl) {
  if (typeof publicUrl !== 'string') return null;
  for (const definition of bucketDefinitions) {
    if (!definition.bucket || !definition.publicUrl) continue;
    const base = definition.publicUrl.replace(/\/$/, '');
    if (publicUrl.startsWith(`${base}/`)) {
      const key = publicUrl.slice(base.length + 1);
      if (!key || key.includes('..') || key.startsWith('/')) return null;
      return { bucket: definition.bucket, key };
    }
  }
  return null;
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'loris-r2-upload', configured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY && r2Ready) });
});

app.post(
  '/api/upload',
  rateLimit({ limit: 12, keyPrefix: 'upload' }),
  requiredServerConfig,
  authenticate,
  rateLimit({ limit: 8, keyPrefix: 'upload-user', keyGenerator: (req) => req.authUser.id }),
  (req, res, next) => upload.fields([
    { name: 'pdfFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ])(req, res, next),
  requireUploadRole,
  async (req, res) => {
    const uploadedObjects = [];
    try {
      const mainFile = req.files && req.files.pdfFile && req.files.pdfFile[0];
      const coverFile = req.files && req.files.coverImage && req.files.coverImage[0];
      if (!mainFile && !coverFile) return res.status(400).json({ error: 'At least one file is required.' });

      let mainUpload = null;
      let coverUpload = null;
      if (mainFile) {
        mainUpload = await putFile(mainFile, req.organisationId);
        uploadedObjects.push(mainUpload);
      }
      if (coverFile) {
        if (!['.jpg', '.jpeg', '.png'].includes(safeExtension(coverFile.originalname))) {
          throw new Error('Cover image must be JPG or PNG.');
        }
        coverUpload = await putFile(coverFile, req.organisationId);
        uploadedObjects.push(coverUpload);
      }

      res.status(201).json({
        url: mainUpload ? mainUpload.url : null,
        coverUrl: coverUpload ? coverUpload.url : null,
        fileType: mainUpload ? mainUpload.contentType : null,
        organisationId: req.organisationId,
        objectKeys: uploadedObjects.map((object) => object.key),
      });
    } catch (error) {
      // Roll back partially uploaded objects if the second upload fails.
      await Promise.allSettled(uploadedObjects.map((object) => {
        const definition = getBucketDefinition(require('node:path').extname(object.key).toLowerCase());
        if (!definition || !definition.bucket) return Promise.resolve();
        return r2.send(new DeleteObjectCommand({ Bucket: definition.bucket, Key: object.key }));
      }));
      console.error('Upload failed:', error.message);
      res.status(400).json({ error: error.message || 'Upload failed.' });
    }
  },
);

// Compensating cleanup for an upload whose metadata insert failed in Supabase.
// An administrator can only clean objects within an organisation they administer.
app.delete(
  '/api/uploaded-objects',
  rateLimit({ limit: 20, keyPrefix: 'upload-cleanup' }),
  requiredServerConfig,
  authenticate,
  rateLimit({ limit: 12, keyPrefix: 'cleanup-user', keyGenerator: (req) => req.authUser.id }),
  requireUploadRole,
  async (req, res) => {
    try {
      const objectKeys = req.body && req.body.objectKeys;
      if (!Array.isArray(objectKeys) || objectKeys.length < 1 || objectKeys.length > 2) {
        return res.status(400).json({ error: 'One or two uploaded object keys are required.' });
      }
      const objects = objectKeys.map((key) => {
        if (typeof key !== 'string' || !key.startsWith(`org-${req.organisationId}/`) || key.includes('..')) return null;
        const definition = getBucketDefinition(require('node:path').extname(key).toLowerCase());
        if (!definition || !definition.bucket) return null;
        return { bucket: definition.bucket, key };
      });
      if (objects.some((object) => !object)) return res.status(400).json({ error: 'An object key is not valid for this organisation.' });
      await Promise.all(objects.map((object) => r2.send(new DeleteObjectCommand({ Bucket: object.bucket, Key: object.key }))));
      res.json({ message: 'Uncommitted upload objects removed.' });
    } catch (error) {
      console.error('Upload cleanup failed:', error.message);
      res.status(500).json({ error: 'Could not clean up the uploaded objects.' });
    }
  },
);

app.delete(
  '/api/delete',
  rateLimit({ limit: 20, keyPrefix: 'delete' }),
  requiredServerConfig,
  authenticate,
  rateLimit({ limit: 10, keyPrefix: 'delete-user', keyGenerator: (req) => req.authUser.id }),
  async (req, res) => {
    try {
      const { materialId, fileUrls } = req.body || {};
      if (typeof materialId !== 'string' || !/^[0-9a-f-]{36}$/i.test(materialId)) {
        return res.status(400).json({ error: 'A valid materialId is required.' });
      }
      if (!Array.isArray(fileUrls) || fileUrls.length < 1 || fileUrls.length > 2 || !fileUrls.every((url) => typeof url === 'string')) {
        return res.status(400).json({ error: 'One or two stored file URLs are required.' });
      }

      const materialQuery = new URLSearchParams({
        select: 'id,organisation_id,file_url,image_url',
        id: `eq.${materialId}`,
        limit: '1',
      });
      const rows = await supabaseRest(`materials?${materialQuery.toString()}`);
      const material = rows && rows[0];
      if (!material) return res.status(404).json({ error: 'Material not found.' });
      if (material.organisation_id == null) return res.status(403).json({ error: 'This material has no organisation owner assigned.' });

      const permission = await isAuthorisedForOrganisation(req.authUser.id, material.organisation_id);
      if (!permission.allowed) return res.status(403).json({ error: 'You are not authorised to delete this material.' });

      const storedUrls = [material.file_url, material.image_url].filter(Boolean);
      if (fileUrls.some((url) => !storedUrls.includes(url))) {
        return res.status(400).json({ error: 'A supplied URL does not belong to this material.' });
      }

      const objects = fileUrls.map(resolveStoredObject);
      if (objects.some((object) => !object || !object.key.startsWith(`org-${material.organisation_id}/`))) {
        return res.status(400).json({ error: 'A file URL is not a recognised LORIS storage object.' });
      }

      await Promise.all(objects.map((object) => r2.send(new DeleteObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
      }))));
      res.json({ message: 'Authorised material files deleted from storage.' });
    } catch (error) {
      console.error('Delete failed:', error.message);
      res.status(500).json({ error: 'Could not delete the stored files.' });
    }
  },
);

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 25 MB limit.' : 'Invalid upload request.' });
  }
  console.error('Unhandled request error:', error.message);
  res.status(400).json({ error: error.message || 'Invalid request.' });
});

app.listen(PORT, () => {
  console.log(`LORIS upload API listening on port ${PORT}`);
  if (!allowedOrigins.size) console.warn('FRONTEND_ORIGIN is empty; browser cross-origin requests will be denied.');
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) console.warn('Supabase server credentials are not configured; protected routes will return 503.');
  if (!r2Ready) console.warn('R2 credentials are not configured; upload/delete routes will return 503.');
});
