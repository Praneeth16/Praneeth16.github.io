import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const entries = (await getCollection('writing', ({ data }) => !data.draft))
    .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  return rss({
    title: 'Praneeth Paikray',
    description: 'Field notes on building, measuring, and operating AI systems.',
    site: context.site,
    items: entries.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedAt,
      link: entry.data.externalUrl ?? `/writing/${entry.id}/`,
      categories: [entry.data.kind, ...entry.data.tags],
    })),
  });
}
