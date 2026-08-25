import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Plugin } from 'vite';

// Vite's dev static middleware does not serve dotfiles, so anything under
// `public/.well-known/` falls through to the SPA fallback and is answered with
// index.html
export function ServeWellKnownPlugin(): Plugin {
	return {
		name: 'serve-well-known',
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				const url = req.url?.split('?')[0];
				if (!url?.startsWith('/.well-known/')) {
					return next();
				}

				// Resolve inside public/ and confirm containment, so a traversal
				// sequence in the URL cannot escape the directory.
				const root = resolve('public', '.well-known');
				const file = resolve('public', `.${url}`);
				if (!file.startsWith(root) || !existsSync(file)) {
					return next();
				}

				res.setHeader('Content-Type', url.endsWith('.json')
					? 'application/json'
					: 'text/plain');
				res.end(readFileSync(file));
			});
		},
	};
}
