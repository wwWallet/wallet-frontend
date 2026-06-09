export declare function generateHS512Key(): Promise<{
    secret: CryptoKey;
    exportedKey: string;
}>;
export declare function importHS512Key(key: string): Promise<CryptoKey>;
//# sourceMappingURL=HS512.d.ts.map