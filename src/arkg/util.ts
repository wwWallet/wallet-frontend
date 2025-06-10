export function bigIntFromBinary(binary: Uint8Array): bigint {
	return binary.reduce(
		(result: bigint, b: number) => (result << 8n) + BigInt(b),
		0n,
	);
}

export function bigIntToBinary(a: bigint, length: number): Uint8Array {
	return new Uint8Array(length).map(
		(_, i: number): number =>
			Number(BigInt.asUintN(8, a >> (BigInt(length - 1 - i) * 8n)))
	);
}
