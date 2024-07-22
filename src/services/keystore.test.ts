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
	it("can decrypt a container encrypted with a PRF key.", async () => {
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"prfKeys":[{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"5RWFYXtm-909kgmB5HEXp8kuhECEbp1cyhvdGx8e9ph3FVgw49FSNQ"}},"credentialId":{"$b64u":"XV826esmhkDkJUbBJYybnILlRRxmCkzq2ImCnztV5SApOA7ktRTBw5E3PA6CiKuv"},"prfSalt":{"$b64u":"oWYLUEsginWTaIn1PiNyvETt9NZ6vJduDXmW7jDnZnU"},"hkdfSalt":{"$b64u":"GfdWyaRkrNWC76RjZ3fAPLaMcR1q59e3T1xXnEjFW_o"},"hkdfInfo":{"$b64u":"ZURpcGxvbWFzIFBSRg"}}],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiJnQzJEdGN3T1A3NUhzMV9FIiwidGFnIjoiWTNIQUpaMGt5Z1FyRFZHbUt0elV3dyJ9.7S-EEKLHQkKaoYPUqt1gQ4H-jYGQs3nsV2TUsTLk-n4.OxOAw5dNuCdNt-4-.exiMxNX8rzIAg-RwbqUMpShS-BPivKawW-7gsE7cEw6QDmLWEGZirWa2Ugyz1ElyX1mICL8hMw6JsPWQBmJ6aJJez3xDeVjcTPVcKpTo3brZSdEcMjFxHKQfIyiHI-PXnLzw6Yhu8rIE9Bt7y9aGy6xlm7R4C9CfDWG7cBTMgT3uRR-o5lKCuchWZUFziw8jkVB6kwIIl0O0h2mhJIlKKN7IUvpPREBwSCawG0_y_yp8NA8V8SR9AqHqPb6XU5lr0aHL6V09OM2vHjjN1SBCQiUCElSMqR7135FM_McETOMVfEgJLIs71a-3Xwh3bNYclKVvezJipEKJs8pVNbbDO8V1bvAkM7QaCRlXH1n24AUdxk2SD336kVfweh0ycoFuGH7TjemR5M0zzBgyGWNSaO1pFGoJ3CjrY1x8X5JCvdMYZhfmAowCjk4RxF6u9KSUa6tWtwQiSKJKMsmWHKWomDAv_IEKDyAWVftnsNukiu7ePRflEqk-9BWsxcFflpv6BY35l7G2vT04J15r3igWSDlC5ntnVBcztrhQ-EsqUhhE2q9I1nyb0RVFBSxJJb6xEpLCnpRGpW9dwReBfnOlzdDtp6v6HvF5-u7xb7CiswnaIs3j0XZK27QC_8W4J9EZKNPEZvU-srrmFhCUDeH9zGuy0jPPyC2_WCWge45jDedc_e78V_vKEgcY8AUU9Uu9HWhzLc-9B1BQ5bnRx5v_8age7vEWuWlPZuKCShsyfds-8FPZlEmXeJWmDkNu35PIqVOq-PTEOVJ2hl88R4N4JO43pB8WWVVgyrvnzaZWv_lyhei14431ByDn6mR_AnomOVn1riSE4pebC91HuMAqPzEZZZ6Adl-kUzUC5uhnH4ifb3BAyl7jpHbRlsZyYlKsluNW4Cb8feK8KVCRbrOYlBdbN4y5PZ3-z8XA1OWrxZneyQYvjMhudK8a2RkuXxVFhYXN3rOmpt3hh_HhokxTfgnl--fOCjKEDm2TCUacD84EtxXFUU0ICtPPFIzSKkEOQFL7GxaBsBIhLvQcqvRf5ENkTGJ_NWgLlPYtrHhw344TD3HustmuK8GcD58vKq93UFb_vq07-ohYJ8GO0-jJAAzhqDgicGyPK3SZn1v1yJUXPK74e-y1YlIWeOj7fF-bgTaw_g_QLg_0lAHY3kGl1IOKXx_2QKQBy4Hz8uCSZ9nvBKR7gZd21HUbWBr83vJKo4GCzBnBTioDQOnFvWYoVEYvd4w0ojU8x9w7O1CjJWFLovJ04t1j0Muexrx2B0A6pMV33TdhFWT1zB6dCEVcp3KqvkP4q4mD3dJ6igaRrwSCuBu4TOWfbyvZlYDgZVVcQfTyHbkKTYnCuTcI3w82dwVqZNRoALYu6oelgXm_7I8mh-2YwH50NCypT8n18GI6dFRiQyvAE1ghylfVKLOIiDv20vl5WMj8FZt95zj6Nn81NTR91dXnLvuFIkcHGzzoW-_LGBzzzRSnZwd5pg1azlWjM5O09W6gB8keNVx7xkbyxByvYYi2CpUqHIOAWpbwc_64S00n_Bz3Fs6AEmyWF81vfJ0yRO0YJiSJ-EgAwMRvx5_g4g7_xqTwvGAjXBywTRWoOCivN5uYK5qwj_bj5HvTQKgDZaez-y3M65r3P3Xp7eY_yu-OycgI8ChCZrgy6FdyZwlqEUkjUfZhg9cCdnE-aoRPZ90sy6s2bUVMt2mVu7hxtg.gujY6di7F5ezUEJQ08GwDQ"}');

		{
			const unlocked = await keystore.unlockPrf(
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

	it("can decrypt a container encrypted with a password key with 1000 PBKDF iterations.", async () => {
		// 1000 iterations is artificially low to keep the test fast
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"passwordKey":{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"z8mIhLceHv-SrM8iiKlHUf0PRN0bQ0uysRklssCLCMMGFdDLAcmlpg"}},"pbkdf2Params":{"name":"PBKDF2","hash":"SHA-256","iterations":1000,"salt":{"$b64u":"45mHLHfNwhsaJPOHPmYo5D-pBxeZemBiIdSoe9vUR4M"}}},"prfKeys":[],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiIzeWhCQVM5M2FFZjQyeTVtIiwidGFnIjoiTHFaMkhfNVhCdzJ3NnphNkpmOFM2dyJ9.IJo2o_ea_KRItWBt2ZTJhPMk_8kSVKA_MgqCZkfdRJo.uQYxTNVtQxfn3rFi.jNCPwOvOHSKPR_SQ4iLgosTURYTr6hOJJ4dh2ttdotIK3gai3VBdNoQCjmL7mFYaWwmrUPkT0U3tr76-OkQduPeT4OImJC68sI9iyWEqffLWlq2PEl9k9KTaZdYamAJbcBqZYxenx6fzfJOOPgql_Y7zG3Ieo13EXuXUc9aN-gH8poQAR5FbnwNX2fR41JPSWSxZq5HdXyXRFcBp47IiP4giXXuEcQEAzJdTbMPl_bssGb42vCOKciD8nf_6O1CPguvzOULr0ah4Jv4b3dbZ9xkcpt7OAICZ-rrnUlzkfLw4jIESUWr2WrXdFuI3-3fNkg9L5lfx4fgKRDUB3Ies3v1cMpU4T7QIB1GHVwNe-5dtCL_b4mvmLAWVpgZha-0HVtR6LgJFWGNq7EmxqJ5LlaJWMSALym8Q5pgpspP28nF6CHrhAQm31eXwsITOId2NTtzBjfoQxgkDmpUfvFNPO1oSneb8qMfMvCbWpDqrQyheJ2ehrlM9aFv8k2NbFsPGm-8kf_RcTy_xY5MweOHmCtSab5r1LR0YZs91w040gX3bbShIqDiq6_Jd7j9W3LnHtTXcFC24IIgMV0R35wOw43sLMJnHSDdu857RC1hACZ6U52m9zKcDsSHV2qsBqMxogQKP2lF_mmsOUsJd22XLxdEoliXm1mAgw8Rq5wW77nPmE1yQ50qtYjXsrxkpfL7Z_4jf4KWFTQ1gkf31vb6Uqg7Tb8Vow-v34DPjrgH8q5B4UPmb3K_lc4zbFQnGE7J2pA9jbVHTUIRnN4dBE_23T8SROIH08hrtS8Vt68_n34bMFBxbMLUmR1lIYXya6dKWOtEbRES2IoK4lNhHGBWUJf2uUCMCVAMEkRUL2ecmizCzsFlfqrPza81YYecvThnsi2CRD21jt_J-5Do1uEWCmhecpyy19NjEGxvbDVWwJE6iTZhiZ5CKPPkYoxRQWexEaiNroO-ufMLWaQ_LAGksfKze5LaYvmr1l6v50VeNxV7SBGzqO7uVAJYZ2RrUQ5MmidNjViSTx0_v4Ls7ri8ZxTY--SRs8T8I5Sw7vczKMcUyZ5DtX7i8qa14uAmzVYNI1N1vsddeGk8B2y-y_SuqZhwzsDtGML2VH-IsatQ93YNHqzt7_mHz7b6NGvQn0Bi5wF6EXxdCpQw5zi6Fh6mNiFJY7wCsOO9TYxj4rVdVp0OgfV6KWMgk63BmKCCmuQ4qwawCQNxjz86aajTO_tCjiyWiWtnYNLZv8eZd9Mb5krumh4NdfTRVbrjtV62yxdPKr_z6u7_EZcy6dFXbkPJn3Leuu3ROHVKcY21DG8OOtmBtS_yRcpkugC2Typgkl2M2PbYvX0JgGe3WbJarmGwv9X5DE-BmyyoO-Q6EX-RQCfI0aeiEsQhGj6LLBHS_pLZhc8THXnxXeQ7WV_xhJOdIpT3C1d1WNriH6KmM2iTxOidv4eb8QNLYFrk9yiQnnujDhVmnuOCgdgYN_QZFC0mu8n2BDS88o5TG3fnPOvHnlK1_--uN4UqAUOkqFKEkznhxkae0C1ZzzIaR-pXA4XBEc0zO34kqKCPiKlSvFR6ygnnZldSpxBr7bHUMOOHYla9tfNTPNOC2-145D6Si_J3JcijBAC7nJmd1mfsYuSZ2BCqB3UW9T6QpfZoNg5W3QJlrRSKpppzhk7oHqo3GD7tN6PXEQZ29PfeGnCRiO2T_QRc-fl35pg.P6E9einF467fdpnuMT5_6w"}');

		const unlocked = await keystore.unlockPassword(
			privateData,
			"Asdf123!",
		);
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

	it("can decrypt a container encrypted with a password key with 2000 PBKDF iterations.", async () => {
		// 2000 iterations is artificially low to keep the test fast
		const privateData: keystore.EncryptedContainer = jsonParseTaggedBinary('{"passwordKey":{"mainKey":{"unwrappedKeyAlgo":{"name":"AES-GCM","length":256},"unwrapAlgo":"AES-KW","wrappedKey":{"$b64u":"FzMVWEX8rIQ2vw8NNBPgIbhHZ6DoxljHPoDPQGg0mp0sHOfSIWOa2A"}},"pbkdf2Params":{"name":"PBKDF2","hash":"SHA-256","iterations":2000,"salt":{"$b64u":"VpTCuqacQQWQ4dm6Z906NonPw5nfra9e0TkgChffxKc"}}},"prfKeys":[],"jwe":"eyJhbGciOiJBMjU2R0NNS1ciLCJlbmMiOiJBMjU2R0NNIiwiaXYiOiI0VEZNck9ObnNrS1hIRmY3IiwidGFnIjoiTTZHVUJRYVFDTGhjSk4xNmhWSnJSdyJ9.bkThA36BiffM4WR55sgrFoGz5dlPnDHs93G9ejTpA18.Y5GK50fxkiG7EqAp.t3qaLgEi6OYMC_3XJKQeaPkufKoaonI5MP3nEXTq63n6mQYHlXbY2TWoWOaWmlW9noWUtFuv5uSOrM21UfappRhI7PpmLAfhI9nFvedITz60qwmx7vUYSFolfQ_haKpvqUdAkxovlld9FVnAuqfKftoqGhzgpX5gtFzdAaUi-nXxjvlN24XCfnawbfRNEaWMybkFvY6p2QdyP2xnkGRUZ_FcsPPVwNfNshUIaLZZYxgKDw3vkANDMEfzkQgRRrN5e1QlUWSx-VOiA6A8dJ9b1VvY64gAQhehbluWnWaja4DqnpEXeRslJGFQKSOFK6TjOyI7FDCGBj0_3R-wYgBOQmECjmDasjmZ9eKaGcNpy-_kCMLNj-prIsBXGFN2FdCJd3IaYFJqM-PVaJL_XnA3BxmRH2iTJFHYh1RJ_NjSYjKLHp90nV504alA82LVP5SBSDeKubNA-SYafbQ-5Z7OIfLVV56cDFrtRIB4dVAJmpOyRkvU11HOwnBaddSzAIK3ObZZiFYiDXecQfwxLuOAQ94dxQ1u8a3UeypIw8pVKbB5XouH2SDEjOWl0bHj52CS-G9VfZqeOhLBkDbPWAVhmJwd1Gp79zL71rhAz9h6jktNrBa1N46TF7OWQfrcKj83Vt11WUvq3_x9uBmh9piJ1jw2XGHiYFmblQnBmPs_CVWvcJpkXGsGg6JSGzYLSc409bV2QxyKpUA4bbjyKliQPEGiSNh4k0D5R7EmR5uLSa4pdm7kWT7XFVp3b_rLJiXCVwhIHLvTgGM-Y6sTixr7WrSs_SznnC4n1rJboPw9MeE3HNA8axuzqgHSMuPBF3jI2XSjEC349xGQoVet4kQG2h-oP8Sadd9jYji4vxrzdSRxJ-_EeHhgtY7cg4QVct6OCZxC5KyBqHoS2xoVRJmcwTw5M9QbhVws8vGce-MQgfTYgcCl8Mq6vhzCUgXE1rdCmOtd5wE7Q34IoUx97CIWbmSZAuc3XnMpwWxMStnL9hoXLBf5Hu67p4JYRKAZsMyunO5ASH-t1zyFbSJ9zvwVP2Ooa1J9EQYHZCFWHcwFqZ-7UXwUKwUKido7ZZ2bE-jOSax4ezZdY9Vlqufz4fifsu6JSxbPnrSbucfTRksiTUV8gI82aHcpjrJgYSQyTqiUy251UMaXtB1LL5l3PNiOSTAOpJXRaraUalVWFOuV2Ii8dPLNVbIZC1w1o9osOl74JU8S3e8pA3T134fCaRG1xHViDMfZGLiy0bJbiyykSH5Bit1C1Qa9p5dS0-UxSOe_dzVAp8TJa9FcqeTj_KMTe1MmsP2vH8s2xY1buyB0iH-Vh6rCsQ4QUbGC7_ajjVHtyeGbOyO6-V8OWuOw7LVrs0n2lt94UhHtenPmSyraqFDiGYW74geDyld83ouxyna0AnbDsBM83ggCQys42a2QK_QyZhYKZxh-kGXp5yToaYe2lZ7NuSwLkmJRXWBgVHlg8KLucBDum8OnJGnJp1L75mIsT834M_gy3L37hfektX1-p4PtFRcg0U29994qHKA2GlXGYvrNiqrp6zG92vSLJYvykOXxA813Sdd7_CrGGQ8kVeTSxM2JJxT0DEa42m2JtLb-tAZ9FbL4gJzyUiZ29HeRZrjooILwm8133m48qReYQumJRT6TCcRC8qhuEo1NiEwFU7_UdSUr9W0jOqAgcPnKFfIb9FIkcjD0_6BZgtVX44zQ2A.Pfs_OiknjKUONlZdUkKivg"}');
		const unlocked = await keystore.unlockPassword(
			privateData,
			"Asdf123!",
		);
		assert.strictEqual(unlocked.privateDataCache, privateData);

		await asyncAssertThrows(
			() => keystore.unlockPassword(privateData, "asdf123!"),
			"Expected unlock with incorrect password to fail",
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
});
