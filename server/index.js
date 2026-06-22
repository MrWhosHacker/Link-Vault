/**
 * Local dev API server (file-backed). On Netlify, use netlify/functions/api.mjs instead.
 */
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiHandler } from './dbApi.js';
import { createFileStorage } from './fileStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const handleApi = createApiHandler(createFileStorage());
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.all('/api/*', async (req, res) => {
  try {
    const { status, body } = await handleApi(req.method, req.originalUrl, req.body);
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'Server error' });
  }
});

const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`LinkVault API running on http://localhost:${PORT}`);
});
