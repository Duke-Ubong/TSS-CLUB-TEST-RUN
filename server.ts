import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupApiRoutes } from './server/apiHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    const handled = setupApiRoutes(req, res);
    if (!handled) next();
  } else {
    next();
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MapMind Server running on http://0.0.0.0:${PORT}`);
});
