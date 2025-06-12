import { bls12_381 } from '@noble/curves/bls12-381.js';


type BbsKeybindingAttribute = {
	generator: bls12_381.G1.Point,
	dpk: bls12_381.G1.Point,
}

type BbsAttribute = {
	generator: bls12_381.G1.Point,
	value: BigInt[],
	disclose: bool,
}

type SplitBbsProofBegin = {
	c_host: ArrayBuffer,
	rr1: BigInt,
	r1: BigInt,
	rr2: BigInt,
	r2: BigInt,
	re: BigInt,
	e: BigInt,
	rai: BigInt[],
	attrs: BbsAttribute[],
	Abar: bls12_381.G1.Point,
	Bbar: bls12_381.G1.Point,
	D: bls12_381.G1.Point,
	t2prime: bls12_381.G1.Point,
	dpk: BbsKeybindingAttribute,
}

function beginSplitBbsProof(
	A: bls12_381.G1.Point,
	e: BigInt,
	dpk: BbsKeybindingAttribute,
	attributes: BbsAttribute[],
	pk: bls12_381.G1.Point,
	ctx: BufferSource,
): SplitBbsProofBegin {
  // First part of "Split BBS.ZKProve" based on proposal by Cordian Daniluk and Anja Lehmann
    const crv = CRV_BLS
    const g1 = crv.generator
    const idx = list(range(len(attrs)))
    const undisclosed_idx = set(idx) - disclose_idx
    const undisclosed_idx_nonzero = undisclosed_idx - set([0])

    r1 = crv.insecure_random_scalar()
    r2 = crv.insecure_random_scalar()
    r2inv = modinv(r2, crv.n)
    Abar = A * (r1 * r2inv)
    D = (g1 + dpk + sum((hi * ai for hi, ai in zip(attr_generators[1:], attrs[1:])), crv.zero())) * r2inv
    Bbar = (D * r1) + (Abar * (-e))
    rr1 = crv.insecure_random_scalar()
    rr2 = crv.insecure_random_scalar()
    re = crv.insecure_random_scalar()
    rai = [crv.insecure_random_scalar() if i in undisclosed_idx_nonzero else None for i in idx]
    t1 = (D * rr1) + (Abar * re)
    t2prime = D * rr2 + sum((attr_generators[i] * rai[i] for i in undisclosed_idx_nonzero), crv.zero())
    c_host = sha256(cbor.encode([
        Abar.to_sec1_uncompressed(),
        Bbar.to_sec1_uncompressed(),
        D.to_sec1_uncompressed(),
        g1.to_sec1_uncompressed(),
        g1.to_sec1_uncompressed(),
        [gen.to_sec1_uncompressed() for gen in attr_generators],
        len(attr_generators) + 1,
        t1.to_sec1_uncompressed(),
        [crv.scalar_to_big_endian(attrs[i]) for i in sorted(disclose_idx)],
        sorted(disclose_idx),
        pk.to_sec1_uncompressed(),
    ]))

    return c_host, rr1, r1, rr2, r2, re, e, rai, attrs, disclose_idx, Abar, Bbar, D, t2prime, dpk


def finish_split_bbs_proof(
        c_host: bytes,
        rr1: int, r1: int, rr2: int, r2: int, re: int, e: int, rai: list[int],
        attrs: list[int],
        disclose_idx: set[int],
        Abar: PointProjective,
        Bbar: PointProjective,
        D: PointProjective,
        sa0: int,
        c: bytes,
        n: bytes,
        t2prime: PointProjective,
        dpk: PointProjective,
):
    '''Second part of "Split BBS.ZKProve" based on proposal by Cordian Daniluk and Anja Lehmann'''
    assert len(attrs) == len(rai)
    assert 0 not in disclose_idx

    crv = CRV_BLS
    g1 = crv.generator
    idx = list(range(len(attrs)))
    undisclosed_idx = set(range(len(attrs))) - disclose_idx
    undisclosed_idx_nonzero = undisclosed_idx - set([0])

    c = int.from_bytes(c, 'big') % crv.n
    t_dsk = g1 * sa0 + dpk * c
    t2 = t_dsk + t2prime
    t2_bin = t2.to_sec1_uncompressed()
    c2 = sha256(n + t2_bin + c_host)
    c2_int = int.from_bytes(c2, 'big') % crv.n
    assert c2_int == c

    sr1 = (rr1 + c * r1) % crv.n
    sr2 = (rr2 + c * r2) % crv.n
    se = (re - c * e) % crv.n
    sai = [
        sa0,
        *[rai[i] - c * attrs[i] if i in undisclosed_idx_nonzero else None for i in idx[1:]]
    ]

    return Abar, Bbar, D, c, sr1, sr2, se, sai, n
