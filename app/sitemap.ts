import type { MetadataRoute } from 'next';
import { projects } from '@/data/projects';
import { site } from '@/data/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: 'monthly', priority: 1 },
    ...projects.map((project) => ({
      url: `${site.url}/work/${project.slug}`,
      changeFrequency: 'monthly' as const,
      priority: project.featured ? 0.8 : 0.6,
    })),
  ];
}
