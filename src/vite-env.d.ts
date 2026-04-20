/// <reference types="vite/client" />

import { ViteEnvConfig } from "../config";

export interface ImportMeta {
	readonly env: ViteEnvConfig;
}
