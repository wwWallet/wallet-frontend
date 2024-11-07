// ARKG-pub https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-cose-key-types-registration
export const COSE_KTY_ARKG_PUB = -65537;
export type COSE_KTY_ARKG_PUB = typeof COSE_KTY_ARKG_PUB; // eslint-disable-line @typescript-eslint/no-redeclare

// ARKG-derived https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-cose-key-types-registration
export const COSE_KTY_ARKG_DERIVED = -65538;
export type COSE_KTY_ARKG_DERIVED = typeof COSE_KTY_ARKG_DERIVED; // eslint-disable-line @typescript-eslint/no-redeclare

// ARKG-P256ADD-ECDH (no spec yet)
export const COSE_ALG_ARKG_P256ADD_ECDH = -60600;
export type COSE_ALG_ARKG_P256ADD_ECDH = typeof COSE_ALG_ARKG_P256ADD_ECDH; // eslint-disable-line @typescript-eslint/no-redeclare

// ESP256-ARKG (no spec yet)
export const COSE_ALG_ESP256_ARKG = -65539;
export type COSE_ALG_ESP256_ARKG = typeof COSE_ALG_ESP256_ARKG; // eslint-disable-line @typescript-eslint/no-redeclare
