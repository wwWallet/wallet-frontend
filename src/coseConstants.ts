// ARKG-pub https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-cose-key-types-registration
export const COSE_KTY_ARKG_PUB = -65537;
export type COSE_KTY_ARKG_PUB = typeof COSE_KTY_ARKG_PUB; // eslint-disable-line @typescript-eslint/no-redeclare

// ARKG-derived https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-cose-key-types-registration
export const COSE_KTY_ARKG_DERIVED = -65538;
export type COSE_KTY_ARKG_DERIVED = typeof COSE_KTY_ARKG_DERIVED; // eslint-disable-line @typescript-eslint/no-redeclare

// ESP256-ARKG (no spec yet)
export const COSE_ALG_ESP256_ARKG = -65539;
export type COSE_ALG_ESP256_ARKG = typeof COSE_ALG_ESP256_ARKG; // eslint-disable-line @typescript-eslint/no-redeclare

// ARKG-P256 https://www.ietf.org/archive/id/draft-bradleylundberg-cfrg-arkg-08.html#name-cose-key-type-arkg-public-s
export const COSE_ALG_ARKG_P256 = -65700;
export type COSE_ALG_ARKG_P256 = typeof COSE_ALG_ARKG_P256; // eslint-disable-line @typescript-eslint/no-redeclare

// Modified Split-BBS with SHA-256 (no spec yet)
export const COSE_ALG_SPLIT_BBS = -65602;
export type COSE_ALG_SPLIT_BBS = typeof COSE_ALG_SPLIT_BBS; // eslint-disable-line @typescript-eslint/no-redeclare

// The curve BLS12-381 (duplicate of requested standardization 13: https://www.ietf.org/archive/id/draft-ietf-cose-bls-key-representations-07.html#name-curve-parameter-registratio)
// Defined in: https://yubicolabs.github.io/cose-two-party-signing-algs-rfc/split-bbs/draft-lundberg-cose-two-party-signing-algs.html#name-split-bbs
export const COSE_CRV_BLS12_381 = -65601;
export type COSE_CRV_BLS12_381 = typeof COSE_CRV_BLS12_381; // eslint-disable-line @typescript-eslint/no-redeclare
