import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './server/app.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  // If running in Vercel serverless functions, do not start HTTP listener
  if (process.env.VERCEL === '1') {
    return;
  }

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(path.posix.join('/', 'assets'), (await import('express')).default.static(path.resolve('dist/assets')));
    app.use((await import('express')).default.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CHILL TREADS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CHILL TREADS] Server initialization error:', err);
  process.exit(1);
});

export default app;
