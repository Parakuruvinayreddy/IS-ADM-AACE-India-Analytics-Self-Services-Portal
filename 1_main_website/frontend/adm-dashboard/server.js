import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8081;

const distPath = path.resolve(__dirname, 'dist');

// Proxy configuration for local development without Nginx
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/admin/api/') || req.path.startsWith('/admin/uploads/')) {
    try {
      const isAdmin = req.originalUrl.startsWith('/admin/');
      const targetBase = isAdmin ? 'http://localhost:3001' : 'http://localhost:3000';
      const targetPath = isAdmin ? req.originalUrl.replace(/^\/admin/, '') : req.originalUrl;
      const targetUrl = `${targetBase}${targetPath}`;

      const headers = { ...req.headers };
      delete headers.host;

      let body = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        body = req;
      }

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: body,
        duplex: body ? 'half' : undefined,
      });

      res.status(response.status);
      response.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error('[Proxy Error]:', err.message);
      res.status(500).json({ error: 'Proxy failed', details: err.message });
    }
  } else {
    next();
  }
});

// Serve static files from the dist folder
app.use(express.static(distPath));

// For any route, serve index.html (SPA support)
app.use((req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`ADM Analytics running at http://${HOST}:${PORT}`);
});
