import { assert, describe, it } from "vitest";
import * as jose from "jose";

import * as keystore from "./keystore.js";
import { fromBase64, jsonParseTaggedBinary, toBase64Url } from "../util";


async function asyncAssertThrows(fn: () => Promise<any>, message: string): Promise<unknown> {
	try {
		await fn();
	} catch (e) {
		return e;
	}
	assert.fail(message);
}


describe("The keystore", () => {
	it("can decrypt a container encrypted with a PRF key.", async () => {
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary("{\"prfKeys\":[{\"mainKey\":{\"unwrappedKeyAlgo\":{\"name\":\"AES-GCM\",\"length\":256},\"unwrapAlgo\":\"AES-KW\",\"wrappedKey\":{\"$b64u\":\"5RWFYXtm-909kgmB5HEXp8kuhECEbp1cyhvdGx8e9ph3FVgw49FSNQ\"}},\"credentialId\":{\"$b64u\":\"XV826esmhkDkJUbBJYybnILlRRxmCkzq2ImCnztV5SApOA7ktRTBw5E3PA6CiKuv\"},\"prfSalt\":{\"$b64u\":\"oWYLUEsginWTaIn1PiNyvETt9NZ6vJduDXmW7jDnZnU\"},\"hkdfSalt\":{\"$b64u\":\"GfdWyaRkrNWC76RjZ3fAPLaMcR1q59e3T1xXnEjFW_o\"},\"hkdfInfo\":{\"$b64u\":\"ZURpcGxvbWFzIFBSRg\"}}],\"jwe\":\"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJnQzJEdGN3T1A3NUhzMV9FIiwidGFnIjoiWTNIQUpaMGt5Z1FyRFZHbUt0elV3dyJ9.7S-EEKLHQkKaoYPUqt1gQ4H-jYGQs3nsV2TUsTLk-n4.OxOAw5dNuCdNt-4-.exiMxNX8rzIAg-RwbqUMpShS-BPivKawW-7gsE7cEw6QDmLWEGZirWa2Ugyz1ElyX1mICL8hMw6JsPWQBmJ6aJJez3xDeVjcTPVcKpTo3brZSdEcMjFxHKQfIyiHI-PXnLzw6Yhu8rIE9Bt7y9aGy6xlm7R4C9CfDWG7cBTMgT3uRR-o5lKCuchWZUFziw8jkVB6kwIIl0O0h2mhJIlKKN7IUvpPREBwSCawG0_y_yp8NA8V8SR9AqHqPb6XU5lr0aHL6V09OM2vHjjN1SBCQiUCElSMqR7135FM_McETOMVfEgJLIs71a-3Xwh3bNYclKVvezJipEKJs8pVNbbDO8V1bvAkM7QaCRlXH1n24AUdxk2SD336kVfweh0ycoFuGH7TjemR5M0zzBgyGWNSaO1pFGoJ3CjrY1x8X5JCvdMYZhfmAowCjk4RxF6u9KSUa6tWtwQiSKJKMsmWHKWomDAv_IEKDyAWVftnsNukiu7ePRflEqk-9BWsxcFflpv6BY35l7G2vT04J15r3igWSDlC5ntnVBcztrhQ-EsqUhhE2q9I1nyb0RVFBSxJJb6xEpLCnpRGpW9dwReBfnOlzdDtp6v6HvF5-u7xb7CiswnaIs3j0XZK27QC_8W4J9EZKNPEZvU-srrmFhCUDeH9zGuy0jPPyC2_WCWge45jDedc_e78V_vKEgcY8AUU9Uu9HWhzLc-9B1BQ5bnRx5v_8age7vEWuWlPZuKCShsyfds-8FPZlEmXeJWmDkNu35PIqVOq-PTEOVJ2hl88R4N4JO43pB8WWVVgyrvnzaZWv_lyhei14431ByDn6mR_AnomOVn1riSE4pebC91HuMAqPzEZZZ6Adl-kUzUC5uhnH4ifb3BAyl7jpHbRlsZyYlKsluNW4Cb8feK8KVCRbrOYlBdbN4y5PZ3-z8XA1OWrxZneyQYvjMhudK8a2RkuXxVFhYXN3rOmpt3hh_HhokxTfgnl--fOCjKEDm2TCUacD84EtxXFUU0ICtPPFIzSKkEOQFL7GxaBsBIhLvQcqvRf5ENkTGJ_NWgLlPYtrHhw344TD3HustmuK8GcD58vKq93UFb_vq07-ohYJ8GO0-jJAAzhqDgicGyPK3SZn1v1yJUXPK74e-y1YlIWeOj7fF-bgTaw_g_QLg_0lAHY3kGl1IOKXx_2QKQBy4Hz8uCSZ9nvBKR7gZd21HUbWBr83vJKo4GCzBnBTioDQOnFvWYoVEYvd4w0ojU8x9w7O1CjJWFLovJ04t1j0Muexrx2B0A6pMV33TdhFWT1zB6dCEVcp3KqvkP4q4mD3dJ6igaRrwSCuBu4TOWfbyvZlYDgZVVcQfTyHbkKTYnCuTcI3w82dwVqZNRoALYu6oelgXm_7I8mh-2YwH50NCypT8n18GI6dFRiQyvAE1ghylfVKLOIiDv20vl5WMj8FZt95zj6Nn81NTR91dXnLvuFIkcHGzzoW-_LGBzzzRSnZwd5pg1azlWjM5O09W6gB8keNVx7xkbyxByvYYi2CpUqHIOAWpbwc_64S00n_Bz3Fs6AEmyWF81vfJ0yRO0YJiSJ-EgAwMRvx5_g4g7_xqTwvGAjXBywTRWoOCivN5uYK5qwj_bj5HvTQKgDZaez-y3M65r3P3Xp7eY_yu-OycgI8ChCZrgy6FdyZwlqEUkjUfZhg9cCdnE-aoRPZ90sy6s2bUVMt2mVu7hxtg.gujY6di7F5ezUEJQ08GwDQ\"}");

		{
			const prfOutput: Uint8Array = fromBase64("kgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0=");
			const mockCredential = {
				id: toBase64Url(privateData.prfKeys[0].credentialId),
				getClientExtensionResults: () => ({ prf: { results: { first: prfOutput.buffer } } }),
			};
			const unlocked = await keystore.unlockPrf(
				privateData,
				mockCredential as unknown as PublicKeyCredential,
				"localhost",
				async () => false,
			);
			assert.strictEqual(unlocked.privateDataCache, privateData);
		}

		{
			const prfOutput: Uint8Array = fromBase64("KgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0=");
			const mockCredential = {
				id: toBase64Url(privateData.prfKeys[0].credentialId),
				getClientExtensionResults: () => ({ prf: { results: { first: prfOutput.buffer } } }),
			};
			await asyncAssertThrows(
				() =>
					keystore.unlockPrf(
						privateData,
						mockCredential as unknown as PublicKeyCredential,
						"localhost",
						async () => false,
					),
				"Expected unlock with incorrect PRF output to fail",
			);
		}
	});

	it("can decrypt a container encrypted with a session key.", async () => {
		const exportedSessionKey: Uint8Array = fromBase64("USc6dqwBz5mDhbuOxfcjJqn/MdVrm6Rjp5NEGmvLGs8=");
		const privateDataJwe = "eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJaV01wRXlWY1dQTlVaNF8tIiwidGFnIjoiakRta0xVclloOHlSeHYwLUpLM1k3USJ9.RuAudt3-ikCdDeYW5bQY6d9nANu_ga8LT2ErWoga3Qc.gcWZK1xaZlHDouo1.lo0dx41EPxotCespQO3xCdv6SmDDt97y8IbFtfrCGowEBOkN8tOQsWaUxjB5cOWPI_axv3jKixB9dTBKAGoTPjEUfHFq-SR9gYo42CoEp91bzxwEn809BLLSW3_Kii7Z3FCs7zgpZwfcDXOp-o_Wb_FkvgrsdZqRCCzYY0V9MUFOZZrLjH95nemWpAcdKlcyn4L9GsGPWnO0sk5gJi9sxkb5l4ptQqcKepUMIl7j9MZ8RtewvfU9S7YcJQPKIOrRNLgDFC26NoGjsIyTq_xnDpn2pkOn7w4IjDIxe8DJJy9_jyRkXzhSb8ZnbkO74KfHmy0Z2XAK8fl76qNumPZIYBquPNTS24FhgJOXHFuCDmktl-kDeO113LZTo0aEo2OflWWPtUtzSwRTPE6Xp1fAucG-2XTTsL7BfzCuKYO0us_Mm1LucfH_vD1aHh0LESO2YIXmrB2afA8zB9oNuP9pIasqKCKl6bzeaDvZdDdiV01Pz0d6FIOryXDR0PDE6O5TcFxmdfsxpqRzjBO0ZC3W4lTRILqUlION8PZCEKyo6M2AkmyZmFttW3czX7EN_vXXRPUwFn7UNMCWF9BtT42CDBhOZpa91h_T974qWd3rlHiagJScI10rrqZTOe3zzDGlFsIpQAFG55lX0RNT0da0nWLGjQlgZrZgvVdk8b6m4p-O5zdSKyJKUgJWJplLsi5ie56pwcExYcgexS18g-lHuIk2Mcq1-lza_kN2PZDuwPRJ_XKKF-AkVSbL-_XmU92CBoHg0jKmsE_U-85SWhSXjW8ICYi1jDWbY5N4O4hdL7oLyT5KoiOX6htIDsMYyr8U9-vTbz29j-HjXUiRzzAXTc3SsHw2rJcPq4uVEVKIftzihQEdftLY9O0hNWh46hNz9K-0FoEgICOtz_bZKGiDBkPmeqBfwN91kgn0Z_xkRcaxq-oIHsVFTKI729MhjxtQiempvp852wmFW4l9vhPKNijDAj4LrtaPhYd7EsxQS-Lb5EqxHqUAmWgkaKLFeNE5EV9HLvN-XRrUMlXD8KzUzwC8j1Sab-nkmMJb_0Iim1tdh91vm_b2EfnCC3CCIwuSylrkcVUBTFi-DUP-ppDAFAk4SLJEAFdzAu43P7W6XLwoyOwQ970EjUXiueLmNVbHkbOApo07VpuFvl-DBkaZG1a8VRcuYXnxlWjYrjOOCVh0HgYluatQzwA1PXFQwXzJJeeqFHFOOGdfwtq6ZIR4OIT6aAfwXYCdhHnLm1BQf-yaRopaMBkjdnCzpdmPDr0UjfJa2p4c62IrKwZPrZ2mGDhbUtzVhfyx7gWhyxBpblwDWc9Pm7mBpoq5ya3i6QYrQ8Ky6Y-jubc_NWy_leNxqSI92fwhcQ1Bq8kd60PYOm_v3137qDzfQRGzLkJGjPgVBFwa8Olf6RYTgh0DWLsy2PZoFFYqUF0_E0U_JPBFPkKmI4daifNhb9dO6N9uA0JL49slJpxypvj0MEANxKrjiMwm8C3d2fSHArKaoTpeQy2KCCSvM4cX-xgpgB3tEQUEKvIZNCQGh_sggMn_DcqkDvXVpaPme0HUzsXDSpRSwvUXmvt1cJeOWyUnRhwNW6j9V11p2B3eQkHiB8k1nZk8tBq1PE33314wJ0GFy33bvh0vzwIYTb6HXaMzp-uQxoiHO4PXqUdvJmhNC_ezteVNThAHpkJFArWKha5MnNz2pGbcFKmGFQ.pqtV6YBXWtVXUUSMUKTwBA";

		const [{ publicKey}, sessionKey] = await keystore.openPrivateData(exportedSessionKey, privateDataJwe);
		assert.isDefined(publicKey);
		assert.isNotNull(publicKey);
		assert.isDefined(sessionKey);
		assert.isNotNull(sessionKey);

		await asyncAssertThrows(
			() => keystore.openPrivateData(new Uint8Array([exportedSessionKey[0] ^ 0x01, ...exportedSessionKey.slice(1)]), privateDataJwe),
			"Expected unlock with incorrect session key to fail",
		);
	});

	it("can create an ID token signed with the user's private key.", async () => {
		const exportedSessionKey: Uint8Array = fromBase64("USc6dqwBz5mDhbuOxfcjJqn/MdVrm6Rjp5NEGmvLGs8=");
		const privateDataJwe = "eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJaV01wRXlWY1dQTlVaNF8tIiwidGFnIjoiakRta0xVclloOHlSeHYwLUpLM1k3USJ9.RuAudt3-ikCdDeYW5bQY6d9nANu_ga8LT2ErWoga3Qc.gcWZK1xaZlHDouo1.lo0dx41EPxotCespQO3xCdv6SmDDt97y8IbFtfrCGowEBOkN8tOQsWaUxjB5cOWPI_axv3jKixB9dTBKAGoTPjEUfHFq-SR9gYo42CoEp91bzxwEn809BLLSW3_Kii7Z3FCs7zgpZwfcDXOp-o_Wb_FkvgrsdZqRCCzYY0V9MUFOZZrLjH95nemWpAcdKlcyn4L9GsGPWnO0sk5gJi9sxkb5l4ptQqcKepUMIl7j9MZ8RtewvfU9S7YcJQPKIOrRNLgDFC26NoGjsIyTq_xnDpn2pkOn7w4IjDIxe8DJJy9_jyRkXzhSb8ZnbkO74KfHmy0Z2XAK8fl76qNumPZIYBquPNTS24FhgJOXHFuCDmktl-kDeO113LZTo0aEo2OflWWPtUtzSwRTPE6Xp1fAucG-2XTTsL7BfzCuKYO0us_Mm1LucfH_vD1aHh0LESO2YIXmrB2afA8zB9oNuP9pIasqKCKl6bzeaDvZdDdiV01Pz0d6FIOryXDR0PDE6O5TcFxmdfsxpqRzjBO0ZC3W4lTRILqUlION8PZCEKyo6M2AkmyZmFttW3czX7EN_vXXRPUwFn7UNMCWF9BtT42CDBhOZpa91h_T974qWd3rlHiagJScI10rrqZTOe3zzDGlFsIpQAFG55lX0RNT0da0nWLGjQlgZrZgvVdk8b6m4p-O5zdSKyJKUgJWJplLsi5ie56pwcExYcgexS18g-lHuIk2Mcq1-lza_kN2PZDuwPRJ_XKKF-AkVSbL-_XmU92CBoHg0jKmsE_U-85SWhSXjW8ICYi1jDWbY5N4O4hdL7oLyT5KoiOX6htIDsMYyr8U9-vTbz29j-HjXUiRzzAXTc3SsHw2rJcPq4uVEVKIftzihQEdftLY9O0hNWh46hNz9K-0FoEgICOtz_bZKGiDBkPmeqBfwN91kgn0Z_xkRcaxq-oIHsVFTKI729MhjxtQiempvp852wmFW4l9vhPKNijDAj4LrtaPhYd7EsxQS-Lb5EqxHqUAmWgkaKLFeNE5EV9HLvN-XRrUMlXD8KzUzwC8j1Sab-nkmMJb_0Iim1tdh91vm_b2EfnCC3CCIwuSylrkcVUBTFi-DUP-ppDAFAk4SLJEAFdzAu43P7W6XLwoyOwQ970EjUXiueLmNVbHkbOApo07VpuFvl-DBkaZG1a8VRcuYXnxlWjYrjOOCVh0HgYluatQzwA1PXFQwXzJJeeqFHFOOGdfwtq6ZIR4OIT6aAfwXYCdhHnLm1BQf-yaRopaMBkjdnCzpdmPDr0UjfJa2p4c62IrKwZPrZ2mGDhbUtzVhfyx7gWhyxBpblwDWc9Pm7mBpoq5ya3i6QYrQ8Ky6Y-jubc_NWy_leNxqSI92fwhcQ1Bq8kd60PYOm_v3137qDzfQRGzLkJGjPgVBFwa8Olf6RYTgh0DWLsy2PZoFFYqUF0_E0U_JPBFPkKmI4daifNhb9dO6N9uA0JL49slJpxypvj0MEANxKrjiMwm8C3d2fSHArKaoTpeQy2KCCSvM4cX-xgpgB3tEQUEKvIZNCQGh_sggMn_DcqkDvXVpaPme0HUzsXDSpRSwvUXmvt1cJeOWyUnRhwNW6j9V11p2B3eQkHiB8k1nZk8tBq1PE33314wJ0GFy33bvh0vzwIYTb6HXaMzp-uQxoiHO4PXqUdvJmhNC_ezteVNThAHpkJFArWKha5MnNz2pGbcFKmGFQ.pqtV6YBXWtVXUUSMUKTwBA";

		const opened = await keystore.openPrivateData(exportedSessionKey, privateDataJwe);
		const [{ did, publicKey: publicKeyJwk }, ] = opened;
		const publicKey = await jose.importJWK(publicKeyJwk)
		const { id_token } = await keystore.createIdToken(
			opened,
			"test-nonce",
			"test-audience",
		);
		const { payload } = await jose.jwtVerify(id_token, publicKey, { audience: "test-audience"});
		assert.equal(payload.sub, did);
	});
});
