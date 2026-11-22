'use strict';

require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
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

const OFFLINE_ACCESS_DAYS = Math.max(1, Number(process.env.OFFLINE_ACCESS_DAYS || 7));
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
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, RateLimit-Remaining, Retry-After');
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
    req.accessToken = match[1];
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


// ---------------------------------------------------------------------------
// Offline + secure file delivery.
// Authorisation here is delegated to Supabase RLS by querying with the CALLER'S
// own access token (never the service-role key), so a user can only obtain
// offline access to / sync data for what RLS already lets them read or write.
// ---------------------------------------------------------------------------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function userRest(token, path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  return { ok: response.ok, status: response.status, body };
}

async function readableMaterial(token, materialId) {
  if (typeof materialId !== 'string' || !UUID_RE.test(materialId)) return null;
  const q = new URLSearchParams({ select: 'id,organisation_id,file_url,file_type,file_size,status', id: `eq.${materialId}`, limit: '1' });
  const result = await userRest(token, `materials?${q.toString()}`);
  return result.ok && Array.isArray(result.body) && result.body[0] ? result.body[0] : null;
}

function offlineExpiry() {
  return new Date(Date.now() + OFFLINE_ACCESS_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// Best-effort audit record. Clients cannot self-approve (RLS only lets them insert 'pending'),
// so the authoritative 'available' state is written server-side after authorisation.
async function recordOfflineGrant(userId, materialId, expiresAt) {
  try {
    const q = new URLSearchParams({ select: 'id', user_id: `eq.${userId}`, material_id: `eq.${materialId}`, limit: '1' });
    const existing = await supabaseRest(`offline_downloads?${q.toString()}`);
    const now = new Date().toISOString();
    if (existing && existing[0]) {
      await supabaseRest(`offline_downloads?id=eq.${existing[0].id}`, { method: 'PATCH', body: JSON.stringify({ download_status: 'available', downloaded_at: now, last_synced_at: now, expires_at: expiresAt }) });
    } else {
      await supabaseRest('offline_downloads', { method: 'POST', body: JSON.stringify({ user_id: userId, material_id: materialId, download_status: 'available', downloaded_at: now, last_synced_at: now, expires_at: expiresAt }) });
    }
  } catch (error) {
    console.error('Could not record offline grant:', error.message);
  }
}

// Group D contract: validate that the caller may save a material offline.
app.post(
  '/api/materials/offline-permission',
  rateLimit({ limit: 60, keyPrefix: 'offline-perm' }),
  requiredServerConfig,
  authenticate,
  async (req, res) => {
    try {
      const { materialId, organisationId } = req.body || {};
      const material = await readableMaterial(req.accessToken, materialId);
      if (!material || material.status !== 'published') {
        return res.status(403).json({ allowed: false, reason: 'You do not have access to this material.' });
      }
      if (organisationId != null && String(organisationId) !== String(material.organisation_id ?? '')) {
        return res.status(403).json({ allowed: false, reason: 'The material does not belong to the stated organisation.' });
      }
      const expiresAt = offlineExpiry();
      await recordOfflineGrant(req.authUser.id, material.id, expiresAt);
      res.json({ allowed: true, offlineAllowedUntil: expiresAt, validatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Offline permission check failed:', error.message);
      res.status(503).json({ error: 'Could not validate offline permission.' });
    }
  },
);

// Authenticated file delivery. Works with private R2 buckets; public bucket URLs bypass this.
app.get(
  '/api/materials/:id/file',
  rateLimit({ limit: 60, keyPrefix: 'file' }),
  requiredServerConfig,
  authenticate,
  async (req, res) => {
    try {
      const material = await readableMaterial(req.accessToken, req.params.id);
      if (!material || material.status !== 'published') return res.status(404).json({ error: 'Material not found.' });
      const object = resolveStoredObject(material.file_url);
      if (!object) return res.status(404).json({ error: 'The stored file could not be located.' });
      const result = await r2.send(new GetObjectCommand({ Bucket: object.bucket, Key: object.key }));
      res.setHeader('Content-Type', result.ContentType || material.file_type || 'application/octet-stream');
      if (result.ContentLength != null) res.setHeader('Content-Length', String(result.ContentLength));
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      result.Body.on('error', () => res.destroy());
      result.Body.pipe(res);
    } catch (error) {
      console.error('File delivery failed:', error.message);
      if (!res.headersSent) res.status(502).json({ error: 'Could not retrieve the file.' });
    }
  },
);

// Group C contract: issue an offline download grant.
app.post(
  '/api/offline/materials/:id/download',
  rateLimit({ limit: 30, keyPrefix: 'offline-dl' }),
  requiredServerConfig,
  authenticate,
  async (req, res) => {
    try {
      const material = await readableMaterial(req.accessToken, req.params.id);
      if (!material || material.status !== 'published') return res.status(403).json({ error: 'You do not have access to this material.' });
      const expiresAt = offlineExpiry();
      await recordOfflineGrant(req.authUser.id, material.id, expiresAt);
      const origin = `${req.protocol}://${req.get('host')}`;
      res.json({ url: `${origin}/api/materials/${material.id}/file`, sizeBytes: Number(material.file_size) || 0, expiresAt });
    } catch (error) {
      console.error('Offline grant failed:', error.message);
      res.status(503).json({ error: 'Could not issue the offline download.' });
    }
  },
);

// Group C contract: renew the offline licence, but only if every listed material is still accessible.
app.post(
  '/api/offline/renew',
  rateLimit({ limit: 20, keyPrefix: 'offline-renew' }),
  requiredServerConfig,
  authenticate,
  async (req, res) => {
    try {
      const ids = Array.isArray(req.body && req.body.materialIds) ? req.body.materialIds.slice(0, 200) : [];
      const denied = [];
      for (const id of ids) {
        const material = await readableMaterial(req.accessToken, id);
        if (!material || material.status !== 'published') denied.push(id);
      }
      if (denied.length) return res.status(403).json({ error: 'Access to one or more downloaded materials has been revoked.', revoked: denied });
      const expiresAt = offlineExpiry();
      for (const id of ids) await recordOfflineGrant(req.authUser.id, id, expiresAt);
      res.json({ expiresAt });
    } catch (error) {
      console.error('Offline renew failed:', error.message);
      res.status(503).json({ error: 'Could not renew offline access.' });
    }
  },
);

const SYNC_TABLES = { bookmark: 'user_bookmarks', note: 'user_notes', highlight: 'user_highlights', 'reading-progress': 'reading_progress' };
const syncResults = new Map(); // `${userId}:${operationId}` -> result (idempotent replay), bounded.

function deterministicUuid(seed) {
  const h = crypto.createHash('sha1').update(seed).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const posInt = (v) => (Number.isInteger(Number(v)) && Number(v) >= 1 ? Number(v) : undefined);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : undefined);

function buildRow(entity, p) {
  const page = posInt(p.page_number ?? p.page);
  if (entity === 'bookmark') return { bookmark_name: str(p.bookmark_name ?? p.name, 200), page_number: page, location_data: obj(p.location_data) };
  if (entity === 'note') {
    const content = str(p.note_content ?? p.content, 10000);
    if (!content) return null;
    return { note_title: str(p.note_title ?? p.title, 200), note_content: content, page_number: page, location_data: obj(p.location_data) };
  }
  if (entity === 'highlight') {
    const text = str(p.highlighted_text ?? p.text, 5000);
    if (!text) return null;
    return { highlighted_text: text, highlight_color: str(p.highlight_color ?? p.color, 30) || 'yellow', page_number: page, location_data: obj(p.location_data) };
  }
  const current = posInt(p.current_page ?? p.page);
  if (!current) return null;
  const pct = Number(p.progress_percentage);
  return {
    current_page: current,
    total_pages: posInt(p.total_pages),
    progress_percentage: Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : undefined,
    completed: typeof p.completed === 'boolean' ? p.completed : undefined,
    last_read_at: new Date().toISOString(),
  };
}
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

async function applySyncOperation(token, userId, op) {
  const table = SYNC_TABLES[op.entity];
  if (!table || !['upsert', 'delete'].includes(op.action)) return { status: 'failed', message: 'Unsupported entity or action.' };
  if (typeof op.operationId !== 'string' || !op.operationId || op.operationId.length > 100) return { status: 'failed', message: 'operationId is required.' };
  if (typeof op.materialId !== 'string' || !UUID_RE.test(op.materialId)) return { status: 'failed', message: 'A valid materialId is required.' };
  const payload = obj(op.payload) || {};
  const clientTime = Date.parse(op.clientUpdatedAt);
  const rowId = typeof payload.id === 'string' && UUID_RE.test(payload.id) ? payload.id : deterministicUuid(`${userId}:${op.operationId}`);

  if (op.action === 'delete') {
    const q = new URLSearchParams({ id: `eq.${rowId}`, user_id: `eq.${userId}`, material_id: `eq.${op.materialId}` });
    const r = await userRest(token, `${table}?${q.toString()}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    if (r.ok) return { status: 'synced' };
    return { status: r.status === 401 || r.status === 403 ? 'forbidden' : 'failed', message: 'Delete was rejected.' };
  }

  const fields = buildRow(op.entity, payload);
  if (!fields) return { status: 'failed', message: 'The payload is missing required fields.' };

  if (op.entity === 'reading-progress') {
    const q = new URLSearchParams({ select: 'id,updated_at', user_id: `eq.${userId}`, material_id: `eq.${op.materialId}`, limit: '1' });
    const existing = await userRest(token, `${table}?${q.toString()}`);
    if (!existing.ok) return { status: existing.status === 401 || existing.status === 403 ? 'forbidden' : 'failed', message: 'Could not read existing progress.' };
    const row = existing.body && existing.body[0];
    if (row) {
      if (Number.isFinite(clientTime) && Date.parse(row.updated_at) > clientTime) return { status: 'conflict', message: 'Newer progress already exists on the server.' };
      const r = await userRest(token, `${table}?id=eq.${row.id}&user_id=eq.${userId}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(clean({ ...fields, updated_at: new Date().toISOString() })) });
      return r.ok ? { status: 'synced' } : { status: r.status === 403 ? 'forbidden' : 'failed', message: 'Progress update was rejected.' };
    }
  }

  if (op.entity === 'note') {
    const q = new URLSearchParams({ select: 'updated_at', id: `eq.${rowId}`, user_id: `eq.${userId}`, limit: '1' });
    const existing = await userRest(token, `${table}?${q.toString()}`);
    const row = existing.ok && existing.body && existing.body[0];
    if (row && Number.isFinite(clientTime) && Date.parse(row.updated_at) > clientTime) return { status: 'conflict', message: 'The note was changed more recently on the server.' };
    if (row) fields.updated_at = new Date().toISOString();
  }

  const body = clean({ id: rowId, user_id: userId, material_id: op.materialId, ...fields });
  const r = await userRest(token, `${table}?on_conflict=id`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(body) });
  if (r.ok) return { status: 'synced' };
  return { status: r.status === 401 || r.status === 403 ? 'forbidden' : 'failed', message: 'The change was rejected.' };
}

// Group D / Group C contract: apply queued offline changes. Idempotent per operationId.
app.post(
  '/api/offline/sync',
  rateLimit({ limit: 30, keyPrefix: 'sync' }),
  requiredServerConfig,
  authenticate,
  async (req, res) => {
    const operations = req.body && req.body.operations;
    if (!Array.isArray(operations) || operations.length < 1 || operations.length > 50) {
      return res.status(400).json({ error: 'Between 1 and 50 operations are required.' });
    }
    const results = [];
    for (const op of operations) {
      const operationId = op && typeof op.operationId === 'string' ? op.operationId : '';
      const cacheKey = `${req.authUser.id}:${operationId}`;
      if (operationId && syncResults.has(cacheKey)) { results.push({ operationId, ...syncResults.get(cacheKey) }); continue; }
      let result;
      try { result = await applySyncOperation(req.accessToken, req.authUser.id, op || {}); }
      catch (error) { console.error('Sync operation failed:', error.message); result = { status: 'failed', message: 'Unexpected server error.' }; }
      if (operationId && result.status !== 'failed') {
        if (syncResults.size > 5000) syncResults.delete(syncResults.keys().next().value);
        syncResults.set(cacheKey, result);
      }
      results.push({ operationId, ...result });
    }
    res.json({ results });
  },
);

// Platform Manager decision email. Called by the platform dashboard right after a request is approved/rejected.
// Sends through Resend's HTTP API when RESEND_API_KEY is set; otherwise reports that no email was sent.
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || '';
const APP_URL = (process.env.APP_URL || [...allowedOrigins][0] || '').replace(/\/$/, '');
const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

app.post(
  '/api/notifications/organisation-decision',
  rateLimit({ limit: 20, keyPrefix: 'org-decision' }),
  requiredServerConfig,
  authenticate,
  async (req, res) => {
    try {
      const profile = await getProfile(req.authUser.id);
      if (!profile || profile.platform_role !== 'platform_manager') {
        return res.status(403).json({ error: 'Only platform managers can send decision emails.' });
      }
      const requestId = req.body && req.body.requestId;
      if (typeof requestId !== 'string' || !/^[0-9a-f-]{36}$/i.test(requestId)) {
        return res.status(400).json({ error: 'A valid requestId is required.' });
      }
      const rows = await supabaseRest(`organisation_requests?${new URLSearchParams({ select: 'id,organisation_name,email,status', id: `eq.${requestId}`, limit: '1' })}`);
      const request = rows && rows[0];
      if (!request) return res.status(404).json({ error: 'Organisation request not found.' });
      if (request.status !== 'approved' && request.status !== 'rejected') {
        return res.status(409).json({ error: 'This request has not been decided yet.' });
      }
      if (!RESEND_API_KEY || !EMAIL_FROM) {
        return res.status(202).json({ sent: false, reason: 'Email is not configured on the server (RESEND_API_KEY and EMAIL_FROM).' });
      }

      const name = escapeHtml(request.organisation_name);
      const approved = request.status === 'approved';
      const loginUrl = APP_URL ? `${APP_URL}/organisation/login` : '';
      const subject = approved ? `Your LORIS organisation "${request.organisation_name}" has been approved` : `Update on your LORIS organisation registration`;
      const html = approved
        ? `<p>Good news: your organisation registration for <strong>${name}</strong> has been approved.</p><p>You can now log in and access LORIS as an organisation administrator.</p>${loginUrl ? `<p><a href="${loginUrl}">Log in to LORIS</a></p>` : ''}`
        : `<p>Thank you for registering <strong>${name}</strong> with LORIS. After review, we were unable to approve this registration.</p><p>If you think this is a mistake, please contact LORIS support.</p>`;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: [request.email], subject, html }),
      });
      if (!response.ok) {
        console.error('Decision email failed with status', response.status);
        return res.status(502).json({ sent: false, reason: 'The email provider rejected the message.' });
      }
      res.json({ sent: true });
    } catch (error) {
      console.error('Decision email error:', error.message);
      res.status(500).json({ sent: false, reason: 'Unexpected server error.' });
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
