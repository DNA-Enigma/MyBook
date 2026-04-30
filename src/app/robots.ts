import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'http://localhost:5000';

  return {
    rules: {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/login', '/register', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
