export interface GenericStore<TKey, TValue> {
    get(key: TKey): Promise<TValue | undefined>;
    set(key: TKey, value: TValue): Promise<void>;
    getAll(): Promise<TValue[]>;
    delete(key: TKey): Promise<void>;
}
//# sourceMappingURL=Store.d.ts.map