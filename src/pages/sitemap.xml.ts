import type { APIRoute } from 'astro';
import { projects } from '../data/projects';

// Every page on the site: the two fixed ones, and one per project.
export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/about', ...projects.map((project) => `/work/${project.slug}`)];
  const urls = paths.map((path) => `  <url><loc>${new URL(path, site)}</loc></url>`).join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'content-type': 'application/xml' } },
  );
};
