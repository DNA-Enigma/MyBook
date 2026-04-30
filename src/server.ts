import { createServer } from 'http';
import next from 'next';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '5000', 10);

// Tightened CSP image whitelist
const cspImgSrc = [
  "'self'",
  'data:',
  'blob:',
  'https://images.unsplash.com',
  'https://*.supabase.co',
  'https://s3.amazonaws.com',
  'https://*.s3.amazonaws.com',
].join(' ');

const securityHeaders: Record<string, string> = {
  'Content-Security-Policy':
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self'; img-src ${cspImgSrc}; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...(dev
    ? {}
    : {
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      }),
};

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    // Apply security headers to all responses
    Object.entries(securityHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    try {
      const url = new URL(req.url!, `http://${req.headers.host || `${hostname}:${port}`}`);
      const query: Record<string, string | string[]> = {};
      for (const [key, value] of url.searchParams) {
        const existing = query[key];
        if (existing === undefined) {
          query[key] = value;
        } else if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          query[key] = [existing, value];
        }
      }
      await handle(req, res, { pathname: url.pathname, query } as Parameters<typeof handle>[2]);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  server.once('error', err => {
    console.error(err);
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
  });
});
