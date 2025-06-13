import { assert, describe, it } from "vitest";

import { hashToCurve, SuiteId } from "./hash_to_curve";


function repeatStr(s: string, times: number): string {
	return new Array(times).fill(s).join('');
}

function ellipsisize(s: string, maxLen: number): string {
	if (s.length <= maxLen) {
		return s;
	} else {
		return s.substring(0, maxLen) + '…';
	}
}

type TestVectorSuite = {
	DST: string,
	tests: { msg: string, expectU0: string, expectU1: string }[],
};

const hashToCoordinateFieldSuites: { [suiteId in SuiteId]: TestVectorSuite } = {
	'P256_XMD:SHA-256_SSWU_RO_': {
		// https://www.rfc-editor.org/rfc/rfc9380#name-p256_xmdsha-256_sswu_ro_
		DST: 'QUUX-V01-CS02-with-P256_XMD:SHA-256_SSWU_RO_',
		tests: [
			{
				msg: '',
				expectU0: 'ad5342c66a6dd0ff080df1da0ea1c04b96e0330dd89406465eeba11582515009',
				expectU1: '8c0f1d43204bd6f6ea70ae8013070a1518b43873bcd850aafa0a9e220e2eea5a',
			},
			{
				msg: 'abc',
				expectU0: 'afe47f2ea2b10465cc26ac403194dfb68b7f5ee865cda61e9f3e07a537220af1',
				expectU1: '379a27833b0bfe6f7bdca08e1e83c760bf9a338ab335542704edcd69ce9e46e0',
			},
			{
				msg: 'abcdef0123456789',
				expectU0: '0fad9d125a9477d55cf9357105b0eb3a5c4259809bf87180aa01d651f53d312c',
				expectU1: 'b68597377392cd3419d8fcc7d7660948c8403b19ea78bbca4b133c9d2196c0fb',
			},
			{
				msg: 'q128_' + repeatStr('q', 128),
				expectU0: '3bbc30446f39a7befad080f4d5f32ed116b9534626993d2cc5033f6f8d805919',
				expectU1: '76bb02db019ca9d3c1e02f0c17f8baf617bbdae5c393a81d9ce11e3be1bf1d33',
			},
			{
				msg: 'a512_' + repeatStr('a', 512),
				expectU0: '4ebc95a6e839b1ae3c63b847798e85cb3c12d3817ec6ebc10af6ee51adb29fec',
				expectU1: '4e21af88e22ea80156aff790750121035b3eefaa96b425a8716e0d20b4e269ee',
			},
		]
	},

	'P521_XMD:SHA-512_SSWU_RO_': {
		// https://www.rfc-editor.org/rfc/rfc9380#name-p521_xmdsha-512_sswu_ro_
		DST: 'QUUX-V01-CS02-with-P521_XMD:SHA-512_SSWU_RO_',
		tests: [
			{
				msg: '',
				expectU0: '01e5f09974e5724f25286763f00ce76238c7a6e03dc396600350ee2c4135fb17dc555be99a4a4bae0fd303d4f66d984ed7b6a3ba386093752a855d26d559d69e7e9e',
				expectU1: '00ae593b42ca2ef93ac488e9e09a5fe5a2f6fb330d18913734ff602f2a761fcaaf5f596e790bcc572c9140ec03f6cccc38f767f1c1975a0b4d70b392d95a0c7278aa',
			},
			{
				msg: 'abc',
				expectU0: '003d00c37e95f19f358adeeaa47288ec39998039c3256e13c2a4c00a7cb61a34c8969472960150a27276f2390eb5e53e47ab193351c2d2d9f164a85c6a5696d94fe8',
				expectU1: '01f3cbd3df3893a45a2f1fecdac4d525eb16f345b03e2820d69bc580f5cbe9cb89196fdf720ef933c4c0361fcfe29940fd0db0a5da6bafb0bee8876b589c41365f15',
			},
			{
				msg: 'abcdef0123456789',
				expectU0: '00183ee1a9bbdc37181b09ec336bcaa34095f91ef14b66b1485c166720523dfb81d5c470d44afcb52a87b704dbc5c9bc9d0ef524dec29884a4795f55c1359945baf3',
				expectU1: '00504064fd137f06c81a7cf0f84aa7e92b6b3d56c2368f0a08f44776aa8930480da1582d01d7f52df31dca35ee0a7876500ece3d8fe0293cd285f790c9881c998d5e',
			},
			{
				msg: 'q128_' + repeatStr('q', 128),
				expectU0: '0159871e222689aad7694dc4c3480a49807b1eedd9c8cb4ae1b219d5ba51655ea5b38e2e4f56b36bf3e3da44a7b139849d28f598c816fe1bc7ed15893b22f63363c3',
				expectU1: '004ef0cffd475152f3858c0a8ccbdf7902d8261da92744e98df9b7fadb0a5502f29c5086e76e2cf498f47321434a40b1504911552ce44ad7356a04e08729ad9411f5',
			},
			{
				msg: 'a512_' + repeatStr('a', 512),
				expectU0: '0033d06d17bc3b9a3efc081a05d65805a14a3050a0dd4dfb4884618eb5c73980a59c5a246b18f58ad022dd3630faa22889fbb8ba1593466515e6ab4aeb7381c26334',
				expectU1: '0092290ab99c3fea1a5b8fb2ca49f859994a04faee3301cefab312d34227f6a2d0c3322cf76861c6a3683bdaa2dd2a6daa5d6906c663e065338b2344d20e313f1114',
			},
		]
	},

	'BLS12381G1_XMD:SHA-256_SSWU_RO_': {
		// https://www.rfc-editor.org/rfc/rfc9380#name-bls12381g1_xmdsha-256_sswu_
		DST: 'QUUX-V01-CS02-with-BLS12381G1_XMD:SHA-256_SSWU_RO_',
		tests: [
			{
				msg: '',
				expectU0: '0ba14bd907ad64a016293ee7c2d276b8eae71f25a4b941eece7b0d89f17f75cb3ae5438a614fb61d6835ad59f29c564f',
				expectU1: '019b9bd7979f12657976de2884c7cce192b82c177c80e0ec604436a7f538d231552f0d96d9f7babe5fa3b19b3ff25ac9',
			},
			{
				msg: 'abc',
				expectU0: '0d921c33f2bad966478a03ca35d05719bdf92d347557ea166e5bba579eea9b83e9afa5c088573c2281410369fbd32951',
				expectU1: '003574a00b109ada2f26a37a91f9d1e740dffd8d69ec0c35e1e9f4652c7dba61123e9dd2e76c655d956e2b3462611139',
			},
			{
				msg: 'abcdef0123456789',
				expectU0: '062d1865eb80ebfa73dcfc45db1ad4266b9f3a93219976a3790ab8d52d3e5f1e62f3b01795e36834b17b70e7b76246d4',
				expectU1: '0cdc3e2f271f29c4ff75020857ce6c5d36008c9b48385ea2f2bf6f96f428a3deb798aa033cd482d1cdc8b30178b08e3a',
			},
			{
				msg: 'q128_' + repeatStr('q', 128),
				expectU0: '010476f6a060453c0b1ad0b628f3e57c23039ee16eea5e71bb87c3b5419b1255dc0e5883322e563b84a29543823c0e86',
				expectU1: '0b1a912064fb0554b180e07af7e787f1f883a0470759c03c1b6509eb8ce980d1670305ae7b928226bb58fdc0a419f46e',
			},
			{
				msg: 'a512_' + repeatStr('a', 512),
				expectU0: '0a8ffa7447f6be1c5a2ea4b959c9454b431e29ccc0802bc052413a9c5b4f9aac67a93431bd480d15be1e057c8a08e8c6',
				expectU1: '05d487032f602c90fa7625dbafe0f4a49ef4a6b0b33d7bb349ff4cf5410d297fd6241876e3e77b651cfc8191e40a68b7',
			},
		]
	},
};

describe("hashToCurve", () => {
	for (const [suiteId, { DST, tests }] of Object.entries(hashToCoordinateFieldSuites)) {
		describe(`suite ${suiteId}`, async () => {
			it("rejects an empty DST.", async () => {
				assert.throws(
					() => hashToCurve(suiteId as SuiteId, new Uint8Array([])),
					'Invalid DST: Tag MUST have nonzero length.',
				);
			});

			const functionSuite = hashToCurve(suiteId as SuiteId, new TextEncoder().encode(DST));
			const { hashToCoordinateField } = functionSuite;

			describe(`on the test vector`, async () => {
				for (const { msg, expectU0, expectU1 } of tests) {
					const msgBytes = new TextEncoder().encode(msg);
					const u_coordinate = await hashToCoordinateField(msgBytes, 2);

					describe(`msg=${ellipsisize(msg, 24)}`, async () => {
						it("passes hashToCoordinateField u[0]", async () => {
							assert.equal(u_coordinate.length, 2);
							assert.equal(u_coordinate[0].length, 1);
							assert.equal(u_coordinate[0][0], BigInt('0x' + expectU0));
						});

						it("passes hashToCoordinateField u[1]", async () => {
							assert.equal(u_coordinate.length, 2);
							assert.equal(u_coordinate[1].length, 1);
							assert.equal(u_coordinate[1][0], BigInt('0x' + expectU1));
						});

						{
							// RFC 9380 doesn't include test vectors for hashing to the scalar
							// field, so we just have to test that hashToScalarField gives
							// different results from hashToCoordinateField to make sure that
							// they don't accidentally use the same parameters.
							const { hashToScalarField } = functionSuite;
							const u_scalar = await hashToScalarField(msgBytes, 2);

							it("gives different u[0] results from hashToCoordinateField and hashToScalarField", async () => {
								assert.equal(u_scalar.length, 2);
								assert.equal(u_scalar[0].length, 1);
								assert.notEqual(u_scalar[0][0], u_coordinate[0][0]);
								assert.notEqual(u_scalar[0][0], 0n);
							});

							it("gives different u[1] results from hashToCoordinateField and hashToScalarField", async () => {
								assert.equal(u_scalar.length, 2);
								assert.equal(u_scalar[1].length, 1);
								assert.notEqual(u_scalar[1][0], u_coordinate[1][0]);
								assert.notEqual(u_scalar[1][0], 0n);
							});
						}
					});
				}
			});
		});
	}
});
