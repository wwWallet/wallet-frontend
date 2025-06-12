import { bls12_381 } from '@noble/curves/bls12-381';
import * as cbor from 'cbor-web';

import { concat, I2OSP, OS2IP, toU8 } from '../util';

const { curves: { G1, G2 } } = bls12_381;


function toSec1Uncompressed(p: PointG1): ArrayBuffer {
	const pa = p.toAffine();
	return concat(
		new Uint8Array([0x04]),
		I2OSP(pa.x, G1.Fp.BYTES),
		I2OSP(pa.y, G1.Fp.BYTES),
	);
}

type PointG1 = typeof G1.BASE;
type PointG2 = typeof bls12_381.curves.G2.BASE;

type HasKey = {
	/** Claim name of this attribute */
	key: string,
}

function toGenerator(attr: HasKey, ctx: string | Uint8Array): PointG1 {
	return bls12_381.G1.hashToCurve(new TextEncoder().encode(attr.key), { DST: ctx }) as PointG1;
}

function toPoint(attr: BbsAttribute | BbsBlindAttribute | BbsAttributeDisclosure, ctx: string | Uint8Array): PointG1 {
	if ("value" in attr) {
		return toGenerator(attr, ctx).multiply(attr.value);
	} else if ("disclosed" in attr) {
		return toGenerator(attr, ctx).multiply(attr.disclosed);
	} else {
		return attr.blindValue;
	}
}

type BbsAttribute = HasKey & { value: bigint }
type BbsBlindAttribute = HasKey & { blindValue: PointG1 }
type BbsAttributeDisclosure = HasKey & { disclosed: bigint }
type BbsAttributeDisclosureOrNonce = BbsAttributeDisclosure | (HasKey & { undisclosed: bigint, rai: bigint })
type BbsAttributeDisclosureOrSignature = BbsAttributeDisclosure | (HasKey & { sai: bigint })

type BbsSignature = {
	A: PointG1,
	e: bigint,
}

type SplitBbsSignature = {
	signature: BbsSignature,
	dpk: BbsBlindAttribute,
	attrs: BbsAttribute[],
}

type SplitBbsProof = {
	Abar: PointG1,
	Bbar: PointG1,
	D: PointG1,
	c: bigint,
	sr1: bigint,
	sr2: bigint,
	se: bigint,
	attrs: BbsAttributeDisclosureOrSignature[],
	n: ArrayBuffer,
}

type BbsAttributeBegin = BbsAttribute & {
	disclose: boolean,
}

type SplitBbsProofDeviceContribution = {
	sa0: bigint,
	c: BufferSource,
	n: ArrayBuffer,
}

	type SplitBbsProofHostContribution = {
		c_host: ArrayBuffer,
		rr1: bigint,
		r1: bigint,
		rr2: bigint,
		r2: bigint,
		re: bigint,
		e: bigint,
		dpk: BbsBlindAttribute,
		attrs: BbsAttributeDisclosureOrNonce[],
		Abar: PointG1,
		Bbar: PointG1,
		D: PointG1,
		t2prime: PointG1,
	}

export async function bbsSign(
	issuerPrivateKey: bigint,
	attributes: (BbsAttribute | BbsBlindAttribute)[],
	ctx: Uint8Array,
): Promise<BbsSignature> {
	const e = G1.Fn.create(G1.Fn.fromBytes(bls12_381.utils.randomPrivateKey()));
	const A = (G1.BASE.add(
		attributes.reduce(
			(sum, attr) => sum.add(toPoint(attr, ctx)),
			G1.ZERO,
		)
	)).multiply(G1.Fn.inv(G1.Fn.add(e, issuerPrivateKey)));
	if (A.is0()) {
		throw new Error("Failed to generate signature: A is zero");
	} else {
		return { A, e };
	}
}

export async function beginSplitBbsProof(
	{
		signature: { A, e },
		dpk,
	}: SplitBbsSignature,
	attributes: BbsAttributeBegin[],
	issuerPublicKey: PointG2,
	ctx: Uint8Array,
): Promise<SplitBbsProofHostContribution> {
  // First part of "Split BBS.ZKProve" based on proposal by Cordian Daniluk and Anja Lehmann

  const r1 = OS2IP(bls12_381.utils.randomPrivateKey());
  const r2 = OS2IP(bls12_381.utils.randomPrivateKey());
  const r2inv = G1.Fn.inv(r2);
  const Abar = A.multiply(r1 * r2inv);
	const D = (G1.BASE
		.add(dpk.blindValue)
		.add(
			attributes.reduce(
				(sum, attr) => sum.add(toPoint(attr, ctx)),
				G1.ZERO
			)
		)).multiply(r2inv);
	const Bbar = D.multiply(r1).add(Abar.multiply(-e));
	const rr1 = OS2IP(bls12_381.utils.randomPrivateKey());
	const rr2 = OS2IP(bls12_381.utils.randomPrivateKey());
	const re = OS2IP(bls12_381.utils.randomPrivateKey());

	const attrs: BbsAttributeDisclosureOrNonce[] = attributes.map(({ key, value, disclose }) => ({
		key,
		...(
			disclose
				? { disclosed: value }
				: {
					undisclosed: value,
					rai: OS2IP(bls12_381.utils.randomPrivateKey()),
				}
		),
	}));

	const t1 = D.multiply(rr1).add(Abar.multiply(re));
	const t2prime = D.multiply(rr2).add(
		attrs.reduce(
			(sum, attr) => (
				"disclosed" in attr
					? sum.add(toPoint(attr, ctx))
					: sum
			),
			G1.ZERO
		)
	);

	const c_host = await crypto.subtle.digest("SHA-256", cbor.encode([
		toSec1Uncompressed(Abar),
		toSec1Uncompressed(Bbar),
		toSec1Uncompressed(D),
		toSec1Uncompressed(G1.BASE),
		[
			toSec1Uncompressed(toGenerator(dpk, ctx)),
			...attrs.map(attr => toSec1Uncompressed(toGenerator(attr, ctx))),
		],
		attrs.length + 1,
		toSec1Uncompressed(t1),
		attrs.filter(attr => "disclosed" in attr).map(({ disclosed }) => I2OSP(disclosed, G1.Fn.BYTES)),
		attrs.flatMap((attr, i) => "disclosed" in attr ? [i+1] : []),
		issuerPublicKey.toBytes(),
		ctx,
  ]));

  return { c_host, rr1, r1, rr2, r2, re, e, attrs, Abar, Bbar, D, t2prime, dpk };
}

export async function finishSplitBbsProof(
	{ c_host, rr1, r1, rr2, r2, re, e, attrs, Abar, Bbar, D, t2prime, dpk }: SplitBbsProofHostContribution,
	{ sa0, c, n }: SplitBbsProofDeviceContribution,
	ctx: Uint8Array,
): Promise<SplitBbsProof> {
	// Second part of "Split BBS.ZKProve" based on proposal by Cordian Daniluk and Anja Lehmann

	const cInt = G1.Fn.create(G1.Fn.fromBytes(toU8(c)));
	const t_dsk = toGenerator(dpk, ctx).multiply(sa0).add(dpk.blindValue.multiply(cInt));
	const t2 = t_dsk.add(t2prime);
	const t2_bin = toSec1Uncompressed(t2);
	const c2 = toU8(await crypto.subtle.digest("SHA-256", concat(n, t2_bin, c_host)));
	const c2Int = G1.Fn.create(G1.Fn.fromBytes(c2));
	if (c2Int !== cInt) {
		throw new Error("Failed to generate proof: hashes do not match", { cause: { c2Int, cInt } });
	}

	const sr1 = G1.Fn.add(rr1, G1.Fn.mul(cInt, r1));
	const sr2 = G1.Fn.add(rr2, G1.Fn.mul(cInt, r2));
	const se = G1.Fn.sub(re, G1.Fn.mul(cInt, e));
	const proofAttrs: BbsAttributeDisclosureOrSignature[] = [
		{ key: dpk.key, sai: sa0 },
		...attrs.map((attr) => ({
			key: attr.key,
			...(
				"disclosed" in attr
					? { value: attr.disclosed }
					: { sai: G1.Fn.sub(attr.rai, G1.Fn.mul(cInt, attr.undisclosed)) }
			),
		}))
	];

	return { Abar, Bbar, D, c: cInt, sr1, sr2, se, attrs: proofAttrs, n }
}

export async function verifySplitBbsProof(
	{ Abar, Bbar, D, c, sr1, sr2, se, attrs, n }: SplitBbsProof,
	issuerPublicKey: PointG2,
	ctx: Uint8Array,
): Promise<true> {
	// "BBS.ZKVerify'" as proposed by Cordian Daniluk and Anja Lehmann

	const t1 = D.multiply(sr1).add(Abar.multiply(se)).add(Bbar.multiply(-c));
	const t2 = (
		D.multiply(sr2).add(
			attrs
				.filter(attr => "sai" in attr)
				.reduce(
					(sum, attr) => sum.add(toGenerator(attr, ctx).multiply(attr.sai)),
					G1.ZERO,
				)
		).add(
			(
				G1.BASE.add(
					attrs
						.filter(attr => "disclosed" in attr)
						.reduce(
							(sum, attr) => sum.add(toPoint(attr, ctx)),
							G1.ZERO,
						)
				)
			).multiply(-c)
		)
	);

	console.log("Abar", Abar);
	const AbarIsNonzero = (!Abar.is0());
	const pairingLeft = bls12_381.pairing(Abar, issuerPublicKey);
	console.log("pairingLeft", pairingLeft);
	const pairingRight = bls12_381.pairing(Bbar, bls12_381.curves.G2.BASE);
	console.log("pairingRight", pairingRight);
	const pairingsEqual = bls12_381.fields.Fp12.eql(pairingLeft, pairingRight);
	const innerHashArgs = cbor.encode([
		toSec1Uncompressed(Abar),
		toSec1Uncompressed(Bbar),
		toSec1Uncompressed(D),
		toSec1Uncompressed(G1.BASE),
		attrs.map(attr => toSec1Uncompressed(toGenerator(attr, ctx))),
		attrs.length,
		toSec1Uncompressed(t1),
		attrs.filter(attr => "disclosed" in attr).map(({ disclosed }) => I2OSP(disclosed, G1.Fn.BYTES)),
		attrs.flatMap((attr, i) => "disclosed" in attr ? [i] : []),
		issuerPublicKey.toBytes(),
		ctx,
	]);
	console.log("innerHashArgs", innerHashArgs);
	const innerHash = await crypto.subtle.digest("SHA-256", innerHashArgs);
	const outerHashArgs = concat(n, toSec1Uncompressed(t2), innerHash);
	console.log("outerHashArgs", outerHashArgs);
	const outerHash = await crypto.subtle.digest("SHA-256", outerHashArgs);
	const c2 = G1.Fn.create(G1.Fn.fromBytes(toU8(outerHash)));
	const hashesEqual = c === c2;

	const valid = (
		AbarIsNonzero
		&& pairingsEqual
		&& hashesEqual
	);

	if (valid) {
		return true;
	} else {
		throw new Error("Signature verification failed", { cause: { AbarIsNonzero, pairingsEqual, hashesEqual } });
	}
}
