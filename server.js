import fs from 'node:fs/promises';
import express from 'express';
import compression from 'compression';
import sirv from 'sirv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;

async function createServer() {
  const app = express();
  app.use(compression());

  let vite;
  if (!isProduction) {
    const { createServer } = await import('vite');
    vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  } else {
    app.use(sirv('dist/client', { gzip: true }));
  }

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      let template;
      let render;
      let styleSheet = '';

      if (!isProduction) {
        template = await fs.readFile('./index.html', 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).render;
      } else {
        template = await fs.readFile('./dist/client/index.html', 'utf-8');
        render = (await import('./dist/server/entry-server.js')).render;
        
        try {
          const cssFiles = await fs.readdir('./dist/client/assets');
          for (const file of cssFiles) {
            if (file.endsWith('.css')) {
              styleSheet += await fs.readFile(`./dist/client/assets/${file}`, 'utf-8');
            }
          }
        } catch (e) {
          console.error('Error reading CSS files:', e);
        }
      }

      const { html: appHtml } = render();
      
      const seoTags = `
        <meta name="description" content="Spelling Bee Solver - Find all possible words in the New York Times Spelling Bee puzzle" />
        <meta name="keywords" content="spelling bee, word game, puzzle solver, word finder" />
        <title>Spelling Bee Solver - Word Game Helper</title>
      `;
      
      const htmlWithMeta = template.replace(
        '<title>Vite + React + TS</title>',
        seoTags
      );
      
      const htmlWithStyles = htmlWithMeta.replace(
        '</head>',
        `<style>${styleSheet}</style></head>`
      );
      
      const finalHtml = htmlWithStyles.replace(
        `<div id="root"></div>`,
        `<div id="root">${appHtml}</div>`
      );

      res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
    } catch (e) {
      if (!isProduction) {
        vite.ssrFixStacktrace(e);
      }
      console.error('Error:', e.stack);
      res.status(500).end(e.stack);
    }
  });

  if (!isProduction) {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  }

  return app;
}

const app = await createServer();

export default app;