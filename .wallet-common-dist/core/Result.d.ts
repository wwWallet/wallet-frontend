export type Result<T, E = Error> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: E;
    error_description?: string;
};
export declare function ok<T>(value: T): Result<T, never>;
export declare function err<E>(error: E, error_description?: string): Result<never, E>;
//# sourceMappingURL=Result.d.ts.map