export function pathWithBase(basePath: string | undefined, path: string): string {
	if (!basePath) return path;
	if (!path) return basePath;

	return `${basePath.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
