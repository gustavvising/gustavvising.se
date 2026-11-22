import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export async function getPosts(): Promise<Post[]> {
  const all = await getCollection('posts');
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

const pad = (n: number) => String(n).padStart(2, '0');

export function postParts(p: Post) {
  const d = p.data.date;
  return { year: String(d.getUTCFullYear()), month: pad(d.getUTCMonth() + 1), day: pad(d.getUTCDate()), slug: p.data.slug };
}
export function postUrl(p: Post) {
  const { year, month, day, slug } = postParts(p);
  return `/${year}/${month}/${day}/${slug}`;
}
export function formatDate(d: Date, lang = 'sv') {
  return d.toLocaleDateString(lang === 'sv' ? 'sv-SE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}