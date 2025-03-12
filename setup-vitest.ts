import { webcrypto } from 'node:crypto';
import '@testing-library/jest-dom';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, writable: false });
