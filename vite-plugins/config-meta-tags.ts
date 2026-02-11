import { type HtmlTagDescriptor, type Plugin } from 'vite';
import { generateHtmlMetaTags } from '../startup/config';

export function ConfigMetaTagsPlugin(env: Record<string, string>): Plugin {
	return {
		name: 'config-meta-tags',
		transformIndexHtml: {
			order: 'post',
			handler(html, ctx) {
				const tags: HtmlTagDescriptor[] = generateHtmlMetaTags(env).map(({ name, content }) => ({
					tag: 'meta',
					injectTo: 'head',
					attrs: {
						name,
						content,
					}
				}));

				return {
					html,
					tags,
				}
			}
		}
	};
}
