import { webcrypto } from 'node:crypto';
globalThis.crypto = webcrypto as any;
