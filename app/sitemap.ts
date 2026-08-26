import type { MetadataRoute } from 'next';

const siteUrl = 'https://govind-turkar-portfolio.turkargovind3.chatgpt.site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
