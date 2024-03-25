import { assert, describe, it } from "vitest";
import * as jose from "jose";

import * as keystore from "./keystore.js";
import { byteArrayEquals, fromBase64, jsonParseTaggedBinary, toBase64Url } from "../util";


async function asyncAssertThrows(fn: () => Promise<any>, message: string): Promise<unknown> {
	try {
		await fn();
	} catch (e) {
		return e;
	}
	assert.fail(message);
}

function mockPrfCredential(
	{ id, prfOutput }: { id: Uint8Array, prfOutput: Uint8Array },
): PublicKeyCredential {
	return {
		id: toBase64Url(id),
		rawId: id.buffer,
		getClientExtensionResults: () => ({ prf: { results: { first: prfOutput.buffer } } }),
	} as unknown as PublicKeyCredential;
}


describe("The keystore", () => {
	it("can initialize the key store with a PRF key.", async () => {
		const prfSalt = fromBase64("kgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0=");
		const mockCredential = mockPrfCredential({
			id: fromBase64("kgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0="),
			prfOutput: fromBase64("kgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0="),
		});
		const { mainKey, keyInfo } = await keystore.initPrf(
			mockCredential,
			prfSalt,
			"localhost",
			async () => false,
		);
		const { privateData } = await keystore.init(mainKey, keyInfo, "p256-pub");
		const [unlocked, ] = await keystore.unlockPrf(privateData, mockCredential, "localhost", async () => false);
		assert.isNotNull(unlocked);
		assert.isNotNull(unlocked.privateDataCache.prfKeys[0]);
	});

	it("can initialize the key store with a password key.", async () => {
		const { mainKey, keyInfo } = await keystore.initPassword("Asdf123!");
		const { privateData } = await keystore.init(mainKey, keyInfo, "jwk_jcs-pub");
		const [unlocked, ] = await keystore.unlockPassword(privateData, "Asdf123!");
		assert.isNotNull(unlocked);
		assert.isNotNull(unlocked.privateDataCache.passwordKey);
	});

	it("can decrypt a container encrypted with a V1 PRF key.", async () => {
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"prfKeys":[{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"5RWFYXtm-909kgmB5HEXp8kuhECEbp1cyhvdGx8e9ph3FVgw49FSNQ"}},"credentialId":{"$b64u":"XV826esmhkDkJUbBJYybnILlRRxmCkzq2ImCnztV5SApOA7ktRTBw5E3PA6CiKuv"},"prfSalt":{"$b64u":"oWYLUEsginWTaIn1PiNyvETt9NZ6vJduDXmW7jDnZnU"},"hkdfSalt":{"$b64u":"GfdWyaRkrNWC76RjZ3fAPLaMcR1q59e3T1xXnEjFW_o"},"hkdfInfo":{"$b64u":"ZURpcGxvbWFzIFBSRg"}}],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJnQzJEdGN3T1A3NUhzMV9FIiwidGFnIjoiWTNIQUpaMGt5Z1FyRFZHbUt0elV3dyJ9.7S-EEKLHQkKaoYPUqt1gQ4H-jYGQs3nsV2TUsTLk-n4.OxOAw5dNuCdNt-4-.exiMxNX8rzIAg-RwbqUMpShS-BPivKawW-7gsE7cEw6QDmLWEGZirWa2Ugyz1ElyX1mICL8hMw6JsPWQBmJ6aJJez3xDeVjcTPVcKpTo3brZSdEcMjFxHKQfIyiHI-PXnLzw6Yhu8rIE9Bt7y9aGy6xlm7R4C9CfDWG7cBTMgT3uRR-o5lKCuchWZUFziw8jkVB6kwIIl0O0h2mhJIlKKN7IUvpPREBwSCawG0_y_yp8NA8V8SR9AqHqPb6XU5lr0aHL6V09OM2vHjjN1SBCQiUCElSMqR7135FM_McETOMVfEgJLIs71a-3Xwh3bNYclKVvezJipEKJs8pVNbbDO8V1bvAkM7QaCRlXH1n24AUdxk2SD336kVfweh0ycoFuGH7TjemR5M0zzBgyGWNSaO1pFGoJ3CjrY1x8X5JCvdMYZhfmAowCjk4RxF6u9KSUa6tWtwQiSKJKMsmWHKWomDAv_IEKDyAWVftnsNukiu7ePRflEqk-9BWsxcFflpv6BY35l7G2vT04J15r3igWSDlC5ntnVBcztrhQ-EsqUhhE2q9I1nyb0RVFBSxJJb6xEpLCnpRGpW9dwReBfnOlzdDtp6v6HvF5-u7xb7CiswnaIs3j0XZK27QC_8W4J9EZKNPEZvU-srrmFhCUDeH9zGuy0jPPyC2_WCWge45jDedc_e78V_vKEgcY8AUU9Uu9HWhzLc-9B1BQ5bnRx5v_8age7vEWuWlPZuKCShsyfds-8FPZlEmXeJWmDkNu35PIqVOq-PTEOVJ2hl88R4N4JO43pB8WWVVgyrvnzaZWv_lyhei14431ByDn6mR_AnomOVn1riSE4pebC91HuMAqPzEZZZ6Adl-kUzUC5uhnH4ifb3BAyl7jpHbRlsZyYlKsluNW4Cb8feK8KVCRbrOYlBdbN4y5PZ3-z8XA1OWrxZneyQYvjMhudK8a2RkuXxVFhYXN3rOmpt3hh_HhokxTfgnl--fOCjKEDm2TCUacD84EtxXFUU0ICtPPFIzSKkEOQFL7GxaBsBIhLvQcqvRf5ENkTGJ_NWgLlPYtrHhw344TD3HustmuK8GcD58vKq93UFb_vq07-ohYJ8GO0-jJAAzhqDgicGyPK3SZn1v1yJUXPK74e-y1YlIWeOj7fF-bgTaw_g_QLg_0lAHY3kGl1IOKXx_2QKQBy4Hz8uCSZ9nvBKR7gZd21HUbWBr83vJKo4GCzBnBTioDQOnFvWYoVEYvd4w0ojU8x9w7O1CjJWFLovJ04t1j0Muexrx2B0A6pMV33TdhFWT1zB6dCEVcp3KqvkP4q4mD3dJ6igaRrwSCuBu4TOWfbyvZlYDgZVVcQfTyHbkKTYnCuTcI3w82dwVqZNRoALYu6oelgXm_7I8mh-2YwH50NCypT8n18GI6dFRiQyvAE1ghylfVKLOIiDv20vl5WMj8FZt95zj6Nn81NTR91dXnLvuFIkcHGzzoW-_LGBzzzRSnZwd5pg1azlWjM5O09W6gB8keNVx7xkbyxByvYYi2CpUqHIOAWpbwc_64S00n_Bz3Fs6AEmyWF81vfJ0yRO0YJiSJ-EgAwMRvx5_g4g7_xqTwvGAjXBywTRWoOCivN5uYK5qwj_bj5HvTQKgDZaez-y3M65r3P3Xp7eY_yu-OycgI8ChCZrgy6FdyZwlqEUkjUfZhg9cCdnE-aoRPZ90sy6s2bUVMt2mVu7hxtg.gujY6di7F5ezUEJQ08GwDQ"}');

		{
			const [unlocked,] = await keystore.unlockPrf(
				privateData,
				mockPrfCredential({
					id: privateData.prfKeys[0].credentialId,
					prfOutput: fromBase64("kgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0="),
				}),
				"localhost",
				async () => false,
			);
			assert.strictEqual(unlocked.privateDataCache, privateData);
		}

		{
			await asyncAssertThrows(
				() =>
					keystore.unlockPrf(
						privateData,
						mockPrfCredential({
							id: privateData.prfKeys[0].credentialId,
							prfOutput: fromBase64("KgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0="),
						}),
						"localhost",
						async () => false,
					),
				"Expected unlock with incorrect PRF output to fail",
			);
		}
	});

	it("can decrypt a container encrypted with a V2 PRF key.", async () => {
		const privateData: keystore.AsymmetricEncryptedContainer = jsonParseTaggedBinary('{"mainKey":{"publicKey":{"importKey":{"format":"raw","keyData":{"$b64u":"BLOz9XVZgYGrlg0vLSIWqNGyR6d5H2Djy9BlIb6bBhUIvRUSw9MU_CFmEwtDP9nRGZhQTdn0_rBmhUSvczY5Xq0"},"algorithm":{"name":"ECDH","namedCurve":"P-256"}}},"unwrapKey":{"format":"raw","unwrapAlgo":"AES-KW","unwrappedKeyAlgo":{"name":"AES-GCM","length":256}}},"prfKeys":[{"credentialId":{"$b64u":"L36kS042hbgmDGkvMt_8abWT0n93IxW5HQB5YKfq0W0nPZQDehu07Qk9L0Aw5C76"},"prfSalt":{"$b64u":"_JMrkAUh64gigXqI--DWoUlgP3zqTCLS2uQASAhutxA"},"hkdfSalt":{"$b64u":"j_sssVxuQMTXzzUj5899uAxVVIEf87FFT6Vrn-ckPxw"},"hkdfInfo":{"$b64u":"ZURpcGxvbWFzIFBSRg"},"algorithm":{"name":"AES-GCM","length":256},"keypair":{"publicKey":{"importKey":{"format":"raw","keyData":{"$b64u":"BAnaAJXU1ja9ddHcWBVqDpLBQWY4wF3KB1Av92rqFdfWx6XWKSzNLsgKlrZnLJN7xo3pOwhJTXAXqxowPykzvx8"},"algorithm":{"name":"ECDH","namedCurve":"P-256"}}},"privateKey":{"unwrapKey":{"format":"jwk","wrappedKey":{"$b64u":"FWhWa7XO_Mqjpr0FhyR_HZcJmgcpoPIsOSdPllVNmsGnnALJ6rj1278lxTW-HEOAsdxUK2K7njciF2e7L4nsGu0ZJ4LqsXkD7a47YLJ75hg9nH1kesbPunyS7rGBsVtKI9WxiZYxDwhiIqIPYRDGJbUXJQG-zunxo1KERsu4me_rsBmOuwqfesDvMllrm1wTY-R0h7UhIpFa2wTCXmW7pRPx3Pbvw7GAhWBBd6hpvWsUsOtCGSN9ujw6IUi5itB8xAcMCB2KbRuCicJa0MCsnyOOtUnsG-YzJFr4W-0FNT8UGvM"},"unwrapAlgo":{"name":"AES-GCM","iv":{"$b64u":"MbbvhJZyE8YP710b"}},"unwrappedKeyAlgo":{"name":"ECDH","namedCurve":"P-256"}}}},"unwrapKey":{"wrappedKey":{"$b64u":"mX8ltiUrf9mcAVNvGsGRPNApPznShZuT6OVVwGOhlN9jCVwTdfnibQ"},"unwrappingKey":{"deriveKey":{"algorithm":{"name":"ECDH"},"derivedKeyAlgorithm":{"name":"AES-KW","length":256}}}}}],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJHaVBvaHA3N2ZjTGdjQUk2IiwidGFnIjoiandra0JsZ3poNU9hQTlVRHZ2WjZZUSJ9.Yq3lXLcWG3r8BM3cJrSRnVoeTe8ExoOfx4G4-mDE-AQ.LIW70vnZ-sLVxOJN.ZfSpTX7wmo-wRjjTBzYkHThcFY4d3upjg19y3AeBfIxmwuu9OJA60bAk-_-e_-OWkeb1ucOyJej_W5-xvEZwoh-30yHxeZEG6iGL1QS__6RZ56EX-rgaGAG65A_AjF-On_7_4IGNY5wuAnmb3HEYdiMFSx-IA1vqox-cNjra7HPLYfpMJq7HABTTO0nnQkgp_K3kNrFazLXbMU97dL39UoYk0L6fAN6DLJi0ngaTO6SYS6jMZ6dIS45Bny0OkqLC51rBpMsvXvlCnKg-skmTuzovWqNepKRiSKwlfwXpRSal5bNDDK4U8pQkDD2qs93Stk5ZJgOL0enP-Ydq8XQ_E3nz-bUdnmmrNme5yqpdxF8UF61zQrG4oMGh9bi_rtA1-xnAp4S3pA53mS0G_3Z1fLEsk7Bl1gOWvxAQBIUetc0NePIl8JMm-3ayZiewK20JUfwYFgLPKJx2cPIBWJRVRYHVIMCvIKDJzQU9jnDQrv7njA2d0t3r_kXlw2w56rpWUixZhR6jivTOOf5tPN3zpBCgyMWiki7GBYBPnFcoLUfTYMKUWxEfqL4owRIYA15MzmsM6XuTvCBar-9sa13n4B8gBEZ0KUWxopeyGh1lKkOgrQq1y742hGUkUZcptgkZWSSUTo2rIiBXbZsiNmjBUE7bfSw5Y3kUYrrSsAwJ1K-kao0dxi45yYw9-hUcyWk2nZiY3BJfmOKAXh7a8dyf13JQg7HCdsCL-B32hG63l6x4ePHjx-46vMS3I6EDvUkRo3YdtV7Ed6WExrCz6-TmKluAHDt1LuuWFZ6uPz-T4PVBw2LpUEL7ijull3RM0bblL1xWSrzU3hV5XjOm6UhVJQt36hfdCCt0MOr6_L2CJMsoGLqZKSMprfhqcm9KfgdfOWtpMPuaeg1uSuEjhE4MZ2sdogIetMboCG7pdzXsAwXtqDARkIoqYZDfuD5IPVO3fXED7G5-umg0UqgYGV1TwjoiPc9paHET8AZbvm5ZGe0bruipGZayZZVdjdXjq8zpJrMnMDQYMD9dZKmq8u4kvFBWA_1PZhvxHKKpom2ZiQILRTUMLFbwsIrfcomjtcnSPvmfl4cnlv0c4gXOF7SXRMRWDgmPfh-iwlVIFLOgVJZp0PjBeukYjUczf_VbP53a1YDhso9Hxr1TiqrDFIt3b0IDYrHsBPfH6UkYdp53pnbidh0fPSffNUxLqi9wqLi1VuN3QYx8nkktH-1T8WKWcXlXu6YyMvdu3u5CIMf3Iu9KS8IFQt0j0ciSa4U_c2zRfV_1QoX8fTeRUUY2G1f6jtSahlrQ1RF1mQ0i_dbNQV3n6WCB2WiFKrEE46MlrvsKYnyenba2Buh-NXKyEU4ZbC0x4hbcUyOkxKMMlQb5tAY5DnOvUW5Yz7RiWoaUSxexb6N3F39ZAgMnBoT6E8KfZt0AXkYVlVHb0olywp6l9VAXU_1doCHXMfX9M57OZHZ0tlwRDZPXWxXCp95GBddV5Ga2vLPbOu-D6jalWWeblZ7U8KOAVkrcySHv5Wr8FAVGinshGSDZQRnfSoe8d1Le-TSMc5xL4FSf7iJ4CbKWl5k5blYqEKC2bVK3kYBX3DofcRsXsjeuVPgxGoFuIfTbYEP7sFnbzSzTLkuXMj4SyGbWryvuTAvu_cbYKHm3XaWuX3piSQO26UB0NKWXVJtnCrqe1bscOxvS281cYceLoLatQroRwg.sxVqxz76jcSvdKUtHbxXwA"}');

		{
			const [unlocked, newPrivateData] = await keystore.unlockPrf(
				privateData,
				mockPrfCredential({
					id: privateData.prfKeys[0].credentialId,
					prfOutput: fromBase64("2WEuykvYBxHGT2RCAoVrsPnkUl+T/tOQZbliln7bNmM="),
				}),
				"localhost",
				async () => false,
			);
			assert.strictEqual(unlocked.privateDataCache, privateData);
			assert.isNull(newPrivateData, "Expected no upgrade when PRF key is already V2");
		}

		{
			await asyncAssertThrows(
				() =>
					keystore.unlockPrf(
						privateData,
						mockPrfCredential({
							id: privateData.prfKeys[0].credentialId,
							prfOutput: fromBase64("1WEuykvYBxHGT2RCAoVrsPnkUl+T/tOQZbliln7bNmM="),
						}),
						"localhost",
						async () => false,
					),
				"Expected unlock with incorrect PRF output to fail",
			);
		}
	});

	it("can decrypt a container encrypted with a V1 password key with 1000 PBKDF iterations.", async () => {
		// 1000 iterations is artificially low to keep the test fast
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"passwordKey":{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"z8mIhLceHv-SrM8iiKlHUf0PRN0bQ0uysRklssCLCMMGFdDLAcmlpg"}},"pbkdf2Params":{"name":"PBKDF2","hash":"SHA-256","iterations":1000,"salt":{"$b64u":"45mHLHfNwhsaJPOHPmYo5D-pBxeZemBiIdSoe9vUR4M"}}},"prfKeys":[],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiIzeWhCQVM5M2FFZjQyeTVtIiwidGFnIjoiTHFaMkhfNVhCdzJ3NnphNkpmOFM2dyJ9.IJo2o_ea_KRItWBt2ZTJhPMk_8kSVKA_MgqCZkfdRJo.uQYxTNVtQxfn3rFi.jNCPwOvOHSKPR_SQ4iLgosTURYTr6hOJJ4dh2ttdotIK3gai3VBdNoQCjmL7mFYaWwmrUPkT0U3tr76-OkQduPeT4OImJC68sI9iyWEqffLWlq2PEl9k9KTaZdYamAJbcBqZYxenx6fzfJOOPgql_Y7zG3Ieo13EXuXUc9aN-gH8poQAR5FbnwNX2fR41JPSWSxZq5HdXyXRFcBp47IiP4giXXuEcQEAzJdTbMPl_bssGb42vCOKciD8nf_6O1CPguvzOULr0ah4Jv4b3dbZ9xkcpt7OAICZ-rrnUlzkfLw4jIESUWr2WrXdFuI3-3fNkg9L5lfx4fgKRDUB3Ies3v1cMpU4T7QIB1GHVwNe-5dtCL_b4mvmLAWVpgZha-0HVtR6LgJFWGNq7EmxqJ5LlaJWMSALym8Q5pgpspP28nF6CHrhAQm31eXwsITOId2NTtzBjfoQxgkDmpUfvFNPO1oSneb8qMfMvCbWpDqrQyheJ2ehrlM9aFv8k2NbFsPGm-8kf_RcTy_xY5MweOHmCtSab5r1LR0YZs91w040gX3bbShIqDiq6_Jd7j9W3LnHtTXcFC24IIgMV0R35wOw43sLMJnHSDdu857RC1hACZ6U52m9zKcDsSHV2qsBqMxogQKP2lF_mmsOUsJd22XLxdEoliXm1mAgw8Rq5wW77nPmE1yQ50qtYjXsrxkpfL7Z_4jf4KWFTQ1gkf31vb6Uqg7Tb8Vow-v34DPjrgH8q5B4UPmb3K_lc4zbFQnGE7J2pA9jbVHTUIRnN4dBE_23T8SROIH08hrtS8Vt68_n34bMFBxbMLUmR1lIYXya6dKWOtEbRES2IoK4lNhHGBWUJf2uUCMCVAMEkRUL2ecmizCzsFlfqrPza81YYecvThnsi2CRD21jt_J-5Do1uEWCmhecpyy19NjEGxvbDVWwJE6iTZhiZ5CKPPkYoxRQWexEaiNroO-ufMLWaQ_LAGksfKze5LaYvmr1l6v50VeNxV7SBGzqO7uVAJYZ2RrUQ5MmidNjViSTx0_v4Ls7ri8ZxTY--SRs8T8I5Sw7vczKMcUyZ5DtX7i8qa14uAmzVYNI1N1vsddeGk8B2y-y_SuqZhwzsDtGML2VH-IsatQ93YNHqzt7_mHz7b6NGvQn0Bi5wF6EXxdCpQw5zi6Fh6mNiFJY7wCsOO9TYxj4rVdVp0OgfV6KWMgk63BmKCCmuQ4qwawCQNxjz86aajTO_tCjiyWiWtnYNLZv8eZd9Mb5krumh4NdfTRVbrjtV62yxdPKr_z6u7_EZcy6dFXbkPJn3Leuu3ROHVKcY21DG8OOtmBtS_yRcpkugC2Typgkl2M2PbYvX0JgGe3WbJarmGwv9X5DE-BmyyoO-Q6EX-RQCfI0aeiEsQhGj6LLBHS_pLZhc8THXnxXeQ7WV_xhJOdIpT3C1d1WNriH6KmM2iTxOidv4eb8QNLYFrk9yiQnnujDhVmnuOCgdgYN_QZFC0mu8n2BDS88o5TG3fnPOvHnlK1_--uN4UqAUOkqFKEkznhxkae0C1ZzzIaR-pXA4XBEc0zO34kqKCPiKlSvFR6ygnnZldSpxBr7bHUMOOHYla9tfNTPNOC2-145D6Si_J3JcijBAC7nJmd1mfsYuSZ2BCqB3UW9T6QpfZoNg5W3QJlrRSKpppzhk7oHqo3GD7tN6PXEQZ29PfeGnCRiO2T_QRc-fl35pg.P6E9einF467fdpnuMT5_6w"}');

		const [unlocked,] = await keystore.unlockPassword(privateData, "Asdf123!");
		assert.strictEqual(unlocked.privateDataCache, privateData);

		await asyncAssertThrows(
			() => keystore.unlockPassword(privateData, "asdf123!"),
			"Expected unlock with incorrect password to fail",
		);

		await asyncAssertThrows(
			() => keystore.unlockPassword(
				{
					...privateData,
					passwordKey: {
						...privateData.passwordKey,
						pbkdf2Params: {
							...privateData.passwordKey.pbkdf2Params,
							iterations: privateData.passwordKey.pbkdf2Params.iterations - 1,
						},
					},
				},
				"Asdf123!",
			),
			"Expected unlock with incorrect iterations to fail",
		);
	});

	it("can decrypt a container encrypted with a V1 password key with 2000 PBKDF iterations.", async () => {
		// 2000 iterations is artificially low to keep the test fast
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"passwordKey":{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"FzMVWEX8rIQ2vw8NNBPgIbhHZ6DoxljHPoDPQGg0mp0sHOfSIWOa2A"}},"pbkdf2Params":{"name":"PBKDF2","hash":"SHA-256","iterations":2000,"salt":{"$b64u":"VpTCuqacQQWQ4dm6Z906NonPw5nfra9e0TkgChffxKc"}}},"prfKeys":[],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiI0VEZNck9ObnNrS1hIRmY3IiwidGFnIjoiTTZHVUJRYVFDTGhjSk4xNmhWSnJSdyJ9.bkThA36BiffM4WR55sgrFoGz5dlPnDHs93G9ejTpA18.Y5GK50fxkiG7EqAp.t3qaLgEi6OYMC_3XJKQeaPkufKoaonI5MP3nEXTq63n6mQYHlXbY2TWoWOaWmlW9noWUtFuv5uSOrM21UfappRhI7PpmLAfhI9nFvedITz60qwmx7vUYSFolfQ_haKpvqUdAkxovlld9FVnAuqfKftoqGhzgpX5gtFzdAaUi-nXxjvlN24XCfnawbfRNEaWMybkFvY6p2QdyP2xnkGRUZ_FcsPPVwNfNshUIaLZZYxgKDw3vkANDMEfzkQgRRrN5e1QlUWSx-VOiA6A8dJ9b1VvY64gAQhehbluWnWaja4DqnpEXeRslJGFQKSOFK6TjOyI7FDCGBj0_3R-wYgBOQmECjmDasjmZ9eKaGcNpy-_kCMLNj-prIsBXGFN2FdCJd3IaYFJqM-PVaJL_XnA3BxmRH2iTJFHYh1RJ_NjSYjKLHp90nV504alA82LVP5SBSDeKubNA-SYafbQ-5Z7OIfLVV56cDFrtRIB4dVAJmpOyRkvU11HOwnBaddSzAIK3ObZZiFYiDXecQfwxLuOAQ94dxQ1u8a3UeypIw8pVKbB5XouH2SDEjOWl0bHj52CS-G9VfZqeOhLBkDbPWAVhmJwd1Gp79zL71rhAz9h6jktNrBa1N46TF7OWQfrcKj83Vt11WUvq3_x9uBmh9piJ1jw2XGHiYFmblQnBmPs_CVWvcJpkXGsGg6JSGzYLSc409bV2QxyKpUA4bbjyKliQPEGiSNh4k0D5R7EmR5uLSa4pdm7kWT7XFVp3b_rLJiXCVwhIHLvTgGM-Y6sTixr7WrSs_SznnC4n1rJboPw9MeE3HNA8axuzqgHSMuPBF3jI2XSjEC349xGQoVet4kQG2h-oP8Sadd9jYji4vxrzdSRxJ-_EeHhgtY7cg4QVct6OCZxC5KyBqHoS2xoVRJmcwTw5M9QbhVws8vGce-MQgfTYgcCl8Mq6vhzCUgXE1rdCmOtd5wE7Q34IoUx97CIWbmSZAuc3XnMpwWxMStnL9hoXLBf5Hu67p4JYRKAZsMyunO5ASH-t1zyFbSJ9zvwVP2Ooa1J9EQYHZCFWHcwFqZ-7UXwUKwUKido7ZZ2bE-jOSax4ezZdY9Vlqufz4fifsu6JSxbPnrSbucfTRksiTUV8gI82aHcpjrJgYSQyTqiUy251UMaXtB1LL5l3PNiOSTAOpJXRaraUalVWFOuV2Ii8dPLNVbIZC1w1o9osOl74JU8S3e8pA3T134fCaRG1xHViDMfZGLiy0bJbiyykSH5Bit1C1Qa9p5dS0-UxSOe_dzVAp8TJa9FcqeTj_KMTe1MmsP2vH8s2xY1buyB0iH-Vh6rCsQ4QUbGC7_ajjVHtyeGbOyO6-V8OWuOw7LVrs0n2lt94UhHtenPmSyraqFDiGYW74geDyld83ouxyna0AnbDsBM83ggCQys42a2QK_QyZhYKZxh-kGXp5yToaYe2lZ7NuSwLkmJRXWBgVHlg8KLucBDum8OnJGnJp1L75mIsT834M_gy3L37hfektX1-p4PtFRcg0U29994qHKA2GlXGYvrNiqrp6zG92vSLJYvykOXxA813Sdd7_CrGGQ8kVeTSxM2JJxT0DEa42m2JtLb-tAZ9FbL4gJzyUiZ29HeRZrjooILwm8133m48qReYQumJRT6TCcRC8qhuEo1NiEwFU7_UdSUr9W0jOqAgcPnKFfIb9FIkcjD0_6BZgtVX44zQ2A.Pfs_OiknjKUONlZdUkKivg"}');
		const [unlocked,] = await keystore.unlockPassword(privateData, "Asdf123!");
		assert.strictEqual(unlocked.privateDataCache, privateData);

		await asyncAssertThrows(
			() => keystore.unlockPassword(privateData, "asdf123!"),
			"Expected unlock with incorrect password to fail",
		);
	});

	it("can decrypt a container encrypted with a V2 password key with 1000 PBKDF iterations.", async () => {
		// 1000 iterations is artificially low to keep the test fast
		const privateData: keystore.AsymmetricEncryptedContainer = jsonParseTaggedBinary('{"mainKey":{"publicKey":{"importKey":{"format":"raw","keyData":{"$b64u":"BNunIeN4Js_iBvCDJEVOz8869zluTVLGhIGoXTdAq3inUGOsDGnQh5jlN_PHGqGEdAOfCbbfgFGFGGiSTMzr1-k"},"algorithm":{"name":"ECDH","namedCurve":"P-256"}}},"unwrapKey":{"format":"raw","unwrapAlgo":"AES-KW","unwrappedKeyAlgo":{"name":"AES-GCM","length":256}}},"passwordKey":{"pbkdf2Params":{"name":"PBKDF2","hash":"SHA-256","iterations":1000,"salt":{"$b64u":"u8SbZmq3whLjddp0bZguopZmoXvwyQoXcEGClemCp8I"}},"algorithm":{"name":"AES-GCM","length":256},"keypair":{"publicKey":{"importKey":{"format":"raw","keyData":{"$b64u":"BOFaP7mYez0NKiBQU2dDpN-t05AadNKfjvJ7-T0cXVlMjj21ehNNMv6j3jk2lZnu4F3W9xNXBdIVS2haA0aKnpA"},"algorithm":{"name":"ECDH","namedCurve":"P-256"}}},"privateKey":{"unwrapKey":{"format":"jwk","wrappedKey":{"$b64u":"qWDkpdWnlTleshhlM3CxAsSFua0vQYniF3e3dmT5_-eaqArvhZyItUEWU3dHgenL1R7j5wh4dPy3oudC1xNvfCBHDrOy_YoOrOx1cbHhehge2ITHDo2frgMBuhm1s62_MUp56b38QfQIOTTLrmKQBYL2sWprPFMp2I8S2a-d3MR1jXdPnvupS_vgRTJ2fXbVB62DfE7U1OxADSSFprUt0bxbbCC7GS4hEkVV9nYf5BRB_q19DDpb1HMwz7_nYfLJidqt6Nx_WUag5BZddw99-dSh6mp0bASQGtCA6zpwFIV91U8"},"unwrapAlgo":{"name":"AES-GCM","iv":{"$b64u":"F8E9s7NxPhAtzbnE"}},"unwrappedKeyAlgo":{"name":"ECDH","namedCurve":"P-256"}}}},"unwrapKey":{"wrappedKey":{"$b64u":"gEM0ic_pgCIZGlheJfHho08vWOngHWuSMDOJJPa0cv3une2aIGpuDA"},"unwrappingKey":{"deriveKey":{"algorithm":{"name":"ECDH"},"derivedKeyAlgorithm":{"name":"AES-KW","length":256}}}}},"prfKeys":[],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJuRDhmTWdZVXdSUF9nU3VGIiwidGFnIjoiaVdSRnFsb0FneTdEaElVRDBqTVBmdyJ9.-XD8oZjK6o1VMHlpe-AazEyC9Sij2UIkyUizlAc2u3w.SSwBLZhoAc1KyA_0.GJSciNkM99lF0oguOizZ1TtzrAkFBDelPSKtZVTOE0AUl1566Hmh8SHmvS0_jKtJjayFBhxoHk-44292gPIXzViEY8DCndwLMjG9BivHr19vOy1B8TxGl_4pUPjDRjKQWovyo_Z4vfUkKEWg7BEbLNw5kQ783AyvixQo1dh6GHC5dt-LIDMREMCw7ZRtE2jM6PhTMfFBKJ54QP16T6no6ULTm-DWfKVdmwPLnz9esNY9-sDC49GmZce9H-AoDLa0RFTE1KH70YBfaFrOpYkrSxMOJyjfpvbOLIuYc7IGLmjnQKLuH7jb-fKZDvGZiHh010qrOFgeINIoG7KzThbe0EHgCukmIG8KlTcILZJj29fYFM6QQPxHTOe4KqyzAAVtcMzCRMSKOZdounGPDJlRsrnedhqDviV7bqoGgSkH2YJXXcNfS2MfAxm0fGKdcuVJ7xfCo9e5c8CKOXw73suzxsTHHl6YjZhqhdNYgWQLCjDaF83wlowb-x2MxZr2pJ4Zrf-1jHgFQbp-8vI8yoGghyslZmSOTMg6dZj_ueBtgCP--dUVB7kprbspJ3oNmuEO1dsw4lsUrdwaHFDaVYDkYjLZBdfzDzdcx7SJ8sQQANKt3vtNmgveRnjEaZ0aHrIbEy6OYIllApTbaGqrRETZohXHdwrBIudO0MScjESOcEvAuXYc8xPFUynXKvn3xl6Iuhsk_bt-gZeOoV-S1SVfEvV4zK9BfjsrRqPzQGzDM8048-_eraKiCWjZppe4XU3m-RSZS5fyt1Z5XsPsw5ZQov2GM-aKNqkho27NkhaXuN4L-xMoc56WUShgCk20vcO2r36yHjZYf2OONrsDVnJZNDSl3SxmXB5uGW_l0YgyPrm6MNnFN3bvVmSUy9M3VH15t2vFfDKCwoHJzHcMdFy5TOv8ZmQNai2Xi4eNUs4723QXlIy3intYb4HEAaMDsE85nrtMjRCmjXOc28eB-2mRXs1m-3umAo2rqLVO88ZdJuTXkbwW_eU6gXEdGtmJ06RJ6N6BhHhm1GYFjHl4c1h7Jqr_ELZexor3Dd0DA8EcTV8F0dIAz1dVzraXMK0KNft6gDsRXXCZ88--syLAo2ayyqO39m8NZca_rH6h72e2J2UZ8h1qPoseHCuoSa95YpkrcP0FMWAMYVNeW0T69R2pNusByoc1FlTayo8Ms25HlS-vax3ylJHHOkU82dmHcGeqRJHT6gnk9LRc3B8E3t_GjeVPao0qzOGX-hqB6yFS_K3lHFN1yQ73PDji8GvJq3oBPdvFO7NvfH_X19HTl2rxXqgwvy-mfsd4CP0AphI9NO1erFKXNfUkgBVibO5emZqakkWmFknog2T8QyFEzCDR2awqUTlcRfvd1HkG4qBPKdIV9f-d8iw9PNcTwk2IFLjy4Lx2dVen6_eWBnJJu-5wdYp1f3UKQapr28hFVwdqGXIbpNYXsMPf7XYmLGOjkLnwtamS4pKwn7UYkPUKfmwQELDOJgLHWVUc9POuF4GUqUZNhRh0y0GxinZ_w-tbAtJjysrniqED8pHsxHSTCZ85wR5Lha41c_yvlchybgjLQ_IgM4TzIk_ZolKbdR5XUKoj2yGEU8-XkAhutDbHCJwFglbYTY7Y8ZwO7QVGFlbHFqWSTnwCB_3lw8V1PUxyxymcRgBhSSjsJxx8LIR1Lx5qKYTZZqPeWpLKGrtJVyB_nRarVFtHEg.QBUeKjmFep5cwbdOM8Ikug"}');

		const [unlocked,] = await keystore.unlockPassword(privateData, "Asdf123!");
		assert.strictEqual(unlocked.privateDataCache, privateData);

		await asyncAssertThrows(
			() => keystore.unlockPassword(privateData, "asdf123!"),
			"Expected unlock with incorrect password to fail",
		);

		await asyncAssertThrows(
			() => keystore.unlockPassword(
				{
					...privateData,
					passwordKey: {
						...privateData.passwordKey,
						pbkdf2Params: {
							...privateData.passwordKey.pbkdf2Params,
							iterations: privateData.passwordKey.pbkdf2Params.iterations - 1,
						},
					},
				},
				"Asdf123!",
			),
			"Expected unlock with incorrect iterations to fail",
		);
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

	it("can automatically upgrade a symmetric PRF key to an asymmetric key.", async () => {
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"prfKeys":[{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"5RWFYXtm-909kgmB5HEXp8kuhECEbp1cyhvdGx8e9ph3FVgw49FSNQ"}},"credentialId":{"$b64u":"XV826esmhkDkJUbBJYybnILlRRxmCkzq2ImCnztV5SApOA7ktRTBw5E3PA6CiKuv"},"prfSalt":{"$b64u":"oWYLUEsginWTaIn1PiNyvETt9NZ6vJduDXmW7jDnZnU"},"hkdfSalt":{"$b64u":"GfdWyaRkrNWC76RjZ3fAPLaMcR1q59e3T1xXnEjFW_o"},"hkdfInfo":{"$b64u":"ZURpcGxvbWFzIFBSRg"}}],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJnQzJEdGN3T1A3NUhzMV9FIiwidGFnIjoiWTNIQUpaMGt5Z1FyRFZHbUt0elV3dyJ9.7S-EEKLHQkKaoYPUqt1gQ4H-jYGQs3nsV2TUsTLk-n4.OxOAw5dNuCdNt-4-.exiMxNX8rzIAg-RwbqUMpShS-BPivKawW-7gsE7cEw6QDmLWEGZirWa2Ugyz1ElyX1mICL8hMw6JsPWQBmJ6aJJez3xDeVjcTPVcKpTo3brZSdEcMjFxHKQfIyiHI-PXnLzw6Yhu8rIE9Bt7y9aGy6xlm7R4C9CfDWG7cBTMgT3uRR-o5lKCuchWZUFziw8jkVB6kwIIl0O0h2mhJIlKKN7IUvpPREBwSCawG0_y_yp8NA8V8SR9AqHqPb6XU5lr0aHL6V09OM2vHjjN1SBCQiUCElSMqR7135FM_McETOMVfEgJLIs71a-3Xwh3bNYclKVvezJipEKJs8pVNbbDO8V1bvAkM7QaCRlXH1n24AUdxk2SD336kVfweh0ycoFuGH7TjemR5M0zzBgyGWNSaO1pFGoJ3CjrY1x8X5JCvdMYZhfmAowCjk4RxF6u9KSUa6tWtwQiSKJKMsmWHKWomDAv_IEKDyAWVftnsNukiu7ePRflEqk-9BWsxcFflpv6BY35l7G2vT04J15r3igWSDlC5ntnVBcztrhQ-EsqUhhE2q9I1nyb0RVFBSxJJb6xEpLCnpRGpW9dwReBfnOlzdDtp6v6HvF5-u7xb7CiswnaIs3j0XZK27QC_8W4J9EZKNPEZvU-srrmFhCUDeH9zGuy0jPPyC2_WCWge45jDedc_e78V_vKEgcY8AUU9Uu9HWhzLc-9B1BQ5bnRx5v_8age7vEWuWlPZuKCShsyfds-8FPZlEmXeJWmDkNu35PIqVOq-PTEOVJ2hl88R4N4JO43pB8WWVVgyrvnzaZWv_lyhei14431ByDn6mR_AnomOVn1riSE4pebC91HuMAqPzEZZZ6Adl-kUzUC5uhnH4ifb3BAyl7jpHbRlsZyYlKsluNW4Cb8feK8KVCRbrOYlBdbN4y5PZ3-z8XA1OWrxZneyQYvjMhudK8a2RkuXxVFhYXN3rOmpt3hh_HhokxTfgnl--fOCjKEDm2TCUacD84EtxXFUU0ICtPPFIzSKkEOQFL7GxaBsBIhLvQcqvRf5ENkTGJ_NWgLlPYtrHhw344TD3HustmuK8GcD58vKq93UFb_vq07-ohYJ8GO0-jJAAzhqDgicGyPK3SZn1v1yJUXPK74e-y1YlIWeOj7fF-bgTaw_g_QLg_0lAHY3kGl1IOKXx_2QKQBy4Hz8uCSZ9nvBKR7gZd21HUbWBr83vJKo4GCzBnBTioDQOnFvWYoVEYvd4w0ojU8x9w7O1CjJWFLovJ04t1j0Muexrx2B0A6pMV33TdhFWT1zB6dCEVcp3KqvkP4q4mD3dJ6igaRrwSCuBu4TOWfbyvZlYDgZVVcQfTyHbkKTYnCuTcI3w82dwVqZNRoALYu6oelgXm_7I8mh-2YwH50NCypT8n18GI6dFRiQyvAE1ghylfVKLOIiDv20vl5WMj8FZt95zj6Nn81NTR91dXnLvuFIkcHGzzoW-_LGBzzzRSnZwd5pg1azlWjM5O09W6gB8keNVx7xkbyxByvYYi2CpUqHIOAWpbwc_64S00n_Bz3Fs6AEmyWF81vfJ0yRO0YJiSJ-EgAwMRvx5_g4g7_xqTwvGAjXBywTRWoOCivN5uYK5qwj_bj5HvTQKgDZaez-y3M65r3P3Xp7eY_yu-OycgI8ChCZrgy6FdyZwlqEUkjUfZhg9cCdnE-aoRPZ90sy6s2bUVMt2mVu7hxtg.gujY6di7F5ezUEJQ08GwDQ"}');

		const credentialId = privateData.prfKeys[0].credentialId;
		const mockCredential = mockPrfCredential({
			id: credentialId,
			prfOutput: fromBase64("kgUVc/5jaq9GQbheeqvzX73xue7rAEtJh+UpW9VOVZ0="),
		});
		const [unlocked, newPrivateData] = await keystore.unlockPrf(privateData, mockCredential, "localhost", async () => false);
		assert.strictEqual(unlocked.privateDataCache, privateData);
		assert.isNotNull(newPrivateData);
		assert.isTrue(
			keystore.isPrfKeyV2(newPrivateData.prfKeys.find(
				keyInfo => byteArrayEquals(keyInfo.credentialId, credentialId))),
			"Expected PRF key to be upgraded to V2 in new private data",
		);

		const [unlocked2, newPrivateData2] = await keystore.unlockPrf(newPrivateData, mockCredential, "localhost", async () => false);
		assert.strictEqual(unlocked2.privateDataCache, newPrivateData);
		assert.isNull(newPrivateData2, "Expected no upgrade when PRF key is already V2");
	});

	it("can automatically upgrade a symmetric password key to an asymmetric key.", async () => {
		// 1000 iterations is artificially low to keep the test fast
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"passwordKey":{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"z8mIhLceHv-SrM8iiKlHUf0PRN0bQ0uysRklssCLCMMGFdDLAcmlpg"}},"pbkdf2Params":{"name":"PBKDF2","hash":"SHA-256","iterations":1000,"salt":{"$b64u":"45mHLHfNwhsaJPOHPmYo5D-pBxeZemBiIdSoe9vUR4M"}}},"prfKeys":[],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiIzeWhCQVM5M2FFZjQyeTVtIiwidGFnIjoiTHFaMkhfNVhCdzJ3NnphNkpmOFM2dyJ9.IJo2o_ea_KRItWBt2ZTJhPMk_8kSVKA_MgqCZkfdRJo.uQYxTNVtQxfn3rFi.jNCPwOvOHSKPR_SQ4iLgosTURYTr6hOJJ4dh2ttdotIK3gai3VBdNoQCjmL7mFYaWwmrUPkT0U3tr76-OkQduPeT4OImJC68sI9iyWEqffLWlq2PEl9k9KTaZdYamAJbcBqZYxenx6fzfJOOPgql_Y7zG3Ieo13EXuXUc9aN-gH8poQAR5FbnwNX2fR41JPSWSxZq5HdXyXRFcBp47IiP4giXXuEcQEAzJdTbMPl_bssGb42vCOKciD8nf_6O1CPguvzOULr0ah4Jv4b3dbZ9xkcpt7OAICZ-rrnUlzkfLw4jIESUWr2WrXdFuI3-3fNkg9L5lfx4fgKRDUB3Ies3v1cMpU4T7QIB1GHVwNe-5dtCL_b4mvmLAWVpgZha-0HVtR6LgJFWGNq7EmxqJ5LlaJWMSALym8Q5pgpspP28nF6CHrhAQm31eXwsITOId2NTtzBjfoQxgkDmpUfvFNPO1oSneb8qMfMvCbWpDqrQyheJ2ehrlM9aFv8k2NbFsPGm-8kf_RcTy_xY5MweOHmCtSab5r1LR0YZs91w040gX3bbShIqDiq6_Jd7j9W3LnHtTXcFC24IIgMV0R35wOw43sLMJnHSDdu857RC1hACZ6U52m9zKcDsSHV2qsBqMxogQKP2lF_mmsOUsJd22XLxdEoliXm1mAgw8Rq5wW77nPmE1yQ50qtYjXsrxkpfL7Z_4jf4KWFTQ1gkf31vb6Uqg7Tb8Vow-v34DPjrgH8q5B4UPmb3K_lc4zbFQnGE7J2pA9jbVHTUIRnN4dBE_23T8SROIH08hrtS8Vt68_n34bMFBxbMLUmR1lIYXya6dKWOtEbRES2IoK4lNhHGBWUJf2uUCMCVAMEkRUL2ecmizCzsFlfqrPza81YYecvThnsi2CRD21jt_J-5Do1uEWCmhecpyy19NjEGxvbDVWwJE6iTZhiZ5CKPPkYoxRQWexEaiNroO-ufMLWaQ_LAGksfKze5LaYvmr1l6v50VeNxV7SBGzqO7uVAJYZ2RrUQ5MmidNjViSTx0_v4Ls7ri8ZxTY--SRs8T8I5Sw7vczKMcUyZ5DtX7i8qa14uAmzVYNI1N1vsddeGk8B2y-y_SuqZhwzsDtGML2VH-IsatQ93YNHqzt7_mHz7b6NGvQn0Bi5wF6EXxdCpQw5zi6Fh6mNiFJY7wCsOO9TYxj4rVdVp0OgfV6KWMgk63BmKCCmuQ4qwawCQNxjz86aajTO_tCjiyWiWtnYNLZv8eZd9Mb5krumh4NdfTRVbrjtV62yxdPKr_z6u7_EZcy6dFXbkPJn3Leuu3ROHVKcY21DG8OOtmBtS_yRcpkugC2Typgkl2M2PbYvX0JgGe3WbJarmGwv9X5DE-BmyyoO-Q6EX-RQCfI0aeiEsQhGj6LLBHS_pLZhc8THXnxXeQ7WV_xhJOdIpT3C1d1WNriH6KmM2iTxOidv4eb8QNLYFrk9yiQnnujDhVmnuOCgdgYN_QZFC0mu8n2BDS88o5TG3fnPOvHnlK1_--uN4UqAUOkqFKEkznhxkae0C1ZzzIaR-pXA4XBEc0zO34kqKCPiKlSvFR6ygnnZldSpxBr7bHUMOOHYla9tfNTPNOC2-145D6Si_J3JcijBAC7nJmd1mfsYuSZ2BCqB3UW9T6QpfZoNg5W3QJlrRSKpppzhk7oHqo3GD7tN6PXEQZ29PfeGnCRiO2T_QRc-fl35pg.P6E9einF467fdpnuMT5_6w"}');

		const [unlocked, newPrivateData] = await keystore.unlockPassword(privateData, "Asdf123!");
		assert.strictEqual(unlocked.privateDataCache, privateData);
		assert.isNotNull(newPrivateData);
		assert.isTrue(
			keystore.isAsymmetricPasswordKeyInfo(newPrivateData.passwordKey),
			"Expected password key to be upgraded to V2 in new private data",
		);

		await asyncAssertThrows(
			() => keystore.unlockPassword(privateData, "asdf123!"),
			"Expected unlock with incorrect password to fail",
		);

		const [unlocked2, newPrivateData2] = await keystore.unlockPassword(newPrivateData, "Asdf123!");
		assert.strictEqual(unlocked2.privateDataCache, newPrivateData);
		assert.isNull(newPrivateData2, "Expected no upgrade when password key is already V2");
	});
});
