import type { MetadataRoute } from 'next'
import { getSiteUrl, getSitemapPaths } from '../lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const lastModified = new Date()

  return getSitemapPaths().map((path) => ({
    url: new URL(path, siteUrl).href,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.8,
  }))
}
