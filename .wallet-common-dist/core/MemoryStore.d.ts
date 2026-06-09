import { GenericStore } from "./Store";
export declare class MemoryStore<TKey, TValue> implements GenericStore<TKey, TValue> {
    private maxEntries;
    private map;
    constructor(maxEntries?: number);
    get(key: TKey): Promise<TValue | undefined>;
    delete(key: TKey): Promise<void>;
    set(key: TKey, value: TValue): Promise<void>;
    getAll(): Promise<TValue[]>;
}
//# sourceMappingURL=MemoryStore.d.ts.map