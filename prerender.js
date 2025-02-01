import fs from 'node:fs/promises';
import { render } from './dist/server/entry-server.js';

async function prerender() {
  try {
    const template = await fs.readFile('./dist/client/index.html', 'utf-8');
    const { html: appHtml } = render();
    
    // Add meta tags for SEO
    const seoTags = `
      <meta name="description" content="Spelling Bee Solver - Find all possible words in the New York Times Spelling Bee puzzle" />
      <meta name="keywords" content="spelling bee, word game, puzzle solver, word finder" />
      <title>Spelling Bee Solver - Word Game Helper</title>
    `;
    
    // Insert SEO tags
    const htmlWithMeta = template.replace(
      '<title>Vite + React + TS</title>',
      seoTags
    );
    
    // Replace the root div with the pre-rendered HTML
    const finalHtml = htmlWithMeta.replace(
      `<div id="root"></div>`,
      `<div id="root">${appHtml}</div>`
    );

    await fs.writeFile('./dist/client/index.html', finalHtml);
    console.log('Pre-rendering complete');
  } catch (error) {
    console.error('Pre-rendering failed:', error);
    process.exit(1);
  }
}

prerender();