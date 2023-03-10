import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import type { Locales, Docs } from 'src/types';
import { siteConfig } from '@config';
import { isUrlOfLocale } from './i18n';

/**
 * Remove the leading country code (i.e. [zh/]something.md) from a slug
 * @param ogSlug slug generated by Astro
 */
function getSlug(ogSlug: string) {
	return ogSlug.split('/').splice(1, Number.POSITIVE_INFINITY).join('/');
}

async function getNormalizedPage(page: CollectionEntry<'docs'>): Promise<Docs> {
	const { id, slug, data } = page;
	const { title, desc, outdated = false } = data;
	const rendered = await page.render();

	return {
		id,
		slug: getSlug(slug),
		content: rendered.Content,
		headings: rendered.headings,
		title,
		desc,
		outdated,
	};
}

async function load(): Promise<Docs[]> {
	const allDocs = await getCollection('docs');
	const renderedDocs = allDocs.map(async (page) => getNormalizedPage(page));
	return Promise.all(renderedDocs);
}

let _pages: Docs[];
export async function fetchDocs(): Promise<Docs[]> {
	if (!_pages) _pages = await load();
	return _pages;
}

export async function getLocalDocs(locale: Locales): Promise<Docs[]> {
	const pages = await fetchDocs();
	return pages.filter((p) => isUrlOfLocale(p.id, locale));
}

export async function getFallbackBySlugs(slugs: string[]): Promise<Docs[]> {
	const defaultPages = await getLocalDocs(siteConfig.defaultLocale);

	// Filter by slugs
	const filteredPages = defaultPages.filter((p) => !slugs.includes(p.slug));

	return filteredPages;
}
