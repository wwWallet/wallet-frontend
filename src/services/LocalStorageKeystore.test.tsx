import React from "react";
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LocalStorageKeystore } from "./LocalStorageKeystore";
import { useLocalStorageKeystore } from "./LocalStorageKeystore";
import * as keystoreApi from "./keystore";
import { CurrentSchema, foldState, mergeEventHistories } from "./WalletStateSchema";
import { getItem } from "../indexedDB";
import { toBase64Url } from "../util";

const mocks = vi.hoisted(() => {
	let resolveWrite: (() => void) | undefined;
	let resolveWriteStarted: (() => void) | undefined;
	let writeStarted = Promise.resolve();
	const read = vi.fn(async (): Promise<{ content: keystoreApi.EncryptedContainer } | undefined> => ({ content: {
		prfKeys: [{ credentialId: new Uint8Array([0xaa]) }] as keystoreApi.WebauthnPrfEncryptionKeyInfo[],
		jwe: "user-a",
	} }));
	const write = vi.fn(async (_stores: string[], _transaction: (tx: IDBTransaction) => IDBRequest<unknown>) => await mocks.setWritePending());
	const destroy = vi.fn(async () => undefined);

	return {
		db: { read, write, destroy },
		resetWriteGate: () => {
			writeStarted = new Promise<void>((resolve) => {
				resolveWriteStarted = resolve;
			});
		},
		waitForWriteStarted: () => writeStarted,
		resolveWrite: () => resolveWrite?.(),
		setWritePending: () => new Promise<void>((resolve) => {
			resolveWriteStarted?.();
			resolveWrite = resolve;
		}),
	};
});

vi.mock("react-router-dom", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("../hooks/useIndexedDb", () => ({
	useIndexedDb: () => mocks.db,
}));

vi.mock("../indexedDB", () => ({
	getItem: vi.fn(async () => null),
}));

vi.mock("./WalletStateSchema", async (importOriginal) => ({
	...await importOriginal<typeof import("./WalletStateSchema")>(),
	foldState: vi.fn(() => ({ user: "unlocked" })),
	mergeEventHistories: vi.fn(),
}));

vi.mock("./keystore", async (importOriginal) => {
	const actual = await importOriginal<typeof import("./keystore")>();
	return {
		...actual,
		parsePrivateData: vi.fn(actual.parsePrivateData),
		unlockPrf: vi.fn(),
		updateWalletState: vi.fn(),
		initPrf: vi.fn(async () => ({
			mainKey: { id: "user-b-main-key" },
			keyInfo: { id: "user-b-key-info" },
		})),
		init: vi.fn(async () => ({
			mainKey: { id: "user-b-main-key" },
			privateData: {
				prfKeys: [{ credentialId: new Uint8Array([0xbb]) }],
				jwe: "user-b",
			},
		})),
		openPrivateData: vi.fn(async () => [{}, {}, {}]),
		importMainKey: vi.fn(async () => ({})),
		exportMainKey: vi.fn(async () => new Uint8Array([0xbb])),
	};
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

const eventTarget = new EventTarget();

function KeystoreProbe({ onReady }: { onReady: (keystore: LocalStorageKeystore) => void }) {
	onReady(useLocalStorageKeystore(eventTarget));
	return null;
}

describe("useLocalStorageKeystore", () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
		mocks.resetWriteGate();
		mocks.resolveWrite();

		window.localStorage.setItem("cachedUsers", JSON.stringify([
			{
				displayName: "User A",
				userHandleB64u: "user-a",
				prfKeys: [{ credentialId: { $b64u: "qg" } }],
			},
		]));
		window.localStorage.setItem("userHandle", JSON.stringify("user-a"));
		window.localStorage.setItem("globalTabId", JSON.stringify("tab-a"));
		window.sessionStorage.setItem("userHandle", JSON.stringify("user-a"));
		window.sessionStorage.setItem("tabId", JSON.stringify("tab-a"));
	});

	it("does not update user A's cached PRF keys while unlocking user B", async () => {
		let keystore: LocalStorageKeystore | undefined;
		render(<KeystoreProbe onReady={(value) => { keystore = value; }} />);

		// Let the initial effect load user A's existing private data.
		await act(async () => { await Promise.resolve(); });

		const unlockPromise = keystore!.initPrf(
			{} as PublicKeyCredential,
			new Uint8Array([0xbb]),
			async () => false,
			{ displayName: "User B", userHandle: new TextEncoder().encode("user-b") },
		);

		try {
			// The IndexedDB write is intentionally pending. The cache-sync effect must
			// not observe B's private data with A's still-current user handle.
			await act(async () => { await mocks.waitForWriteStarted(); });

			expect(keystore!.getCachedUsers().find((user) => user.userHandleB64u === "user-a")?.prfKeys)
				.toEqual([{
					credentialId: new Uint8Array([0xaa]),
					transports: undefined,
					prfSalt: undefined,
				}]);
		} finally {
			mocks.resolveWrite();
			await act(async () => { await unlockPromise; });
		}
	});
});

// Exercise the private merge helper through the public hook. Crypto and storage
// are controlled boundaries; tagged-binary serialization and React effects run normally.
describe("unlocking with locally cached encrypted private data", () => {
	const remote: keystoreApi.AsymmetricEncryptedContainer = { jwe: "remote", prfKeys: [] } as keystoreApi.AsymmetricEncryptedContainer;
	const merged: keystoreApi.AsymmetricEncryptedContainer = { ...remote, jwe: "merged" };
	const credential = { id: toBase64Url(new Uint8Array([0xaa])) } as PublicKeyCredential;
	const userHandle = new TextEncoder().encode("merge-user");
	const user = { displayName: "Merge User", userHandle };
	const promptForPrfRetry = vi.fn(async () => false);
	const remoteState = CurrentSchema.WalletStateOperations.initialWalletStateContainer() as CurrentSchema.WalletStateContainer & { S: CurrentSchema.WalletState };
	const localState = { ...remoteState, lastEventHash: "local-history" };
	const mergedState = { ...remoteState, S: { ...remoteState.S, credentials: [] }, lastEventHash: "merged-history" };
	const put = vi.fn();
	let remoteKey: CryptoKey;
	let oldKey: CryptoKey;
	let mergedKey: CryptoKey;
	let local: keystoreApi.EncryptedContainer;

	beforeEach(async () => {
		vi.clearAllMocks();
		window.localStorage.clear();
		window.sessionStorage.clear();
		[remoteKey, oldKey, mergedKey] = await Promise.all([0, 1, 2].map(() =>
			crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"])
		));
		local = { jwe: "local", prfKeys: [] };
		vi.mocked(getItem).mockResolvedValue(null);
		vi.mocked(keystoreApi.parsePrivateData).mockClear();
		vi.mocked(keystoreApi.unlockPrf).mockReset().mockResolvedValue([{ privateData: remote, mainKey: remoteKey }, null]);
		vi.mocked(keystoreApi.openPrivateData).mockReset().mockImplementation(async (key, data) => {
			return [data.jwe === remote.jwe ? remoteState : localState, key, remoteState.S];
		});
		vi.mocked(keystoreApi.updateWalletState).mockReset().mockResolvedValue({ newContainer: [merged, mergedKey] });
		vi.mocked(mergeEventHistories).mockReset().mockResolvedValue(mergedState);
		vi.mocked(foldState).mockImplementation((container) => container.S as CurrentSchema.WalletState);
		mocks.db.read.mockResolvedValue(undefined);
		put.mockImplementation((record) => {
			mocks.db.read.mockResolvedValue(record);
		});
		mocks.db.write.mockImplementation(async (_stores, transaction) => {
			transaction({ objectStore: () => ({ put }) } as unknown as IDBTransaction);
		});
		vi.spyOn(console, "warn").mockImplementation(() => undefined);
	});

	function cacheLocal(data = local) {
		vi.mocked(getItem).mockResolvedValue({ privateData: keystoreApi.serializePrivateData(data) });
	}

	async function unlock(cachedUser = false) {
		const { result } = renderHook(() => useLocalStorageKeystore(eventTarget));
		let unlocked: Awaited<ReturnType<LocalStorageKeystore["unlockPrf"]>>;
		await act(async () => {
			unlocked = await result.current.unlockPrf(remote, credential, promptForPrfRetry,
				cachedUser ? { displayName: user.displayName, userHandleB64u: toBase64Url(userHandle), prfKeys: [] } : user);
		});
		return { result, encrypted: unlocked![0] };
	}

	function expectRemoteFallback(result: { current: LocalStorageKeystore }, encrypted: keystoreApi.EncryptedContainer) {
		expect(encrypted).toBe(remote);
		expect(result.current.isOpen()).toBe(true);
		expect(result.current.getCalculatedWalletState()).toBe(remoteState.S);
		expect(put).toHaveBeenCalledWith({ userHandle: toBase64Url(userHandle), content: remote });
		expect(mergeEventHistories).not.toHaveBeenCalled();
		expect(keystoreApi.updateWalletState).not.toHaveBeenCalled();
	}

	it.each([false, true])("uses the remote state when no local user exists (cached user: %s)", async (cachedUser) => {
		const { result, encrypted } = await unlock(cachedUser);
		expect(getItem).toHaveBeenCalledWith("users", "merge-user");
		expect(keystoreApi.parsePrivateData).not.toHaveBeenCalled();
		expectRemoteFallback(result, encrypted);
	});

	it.each([false, true])("does not merge user A's open wallet when logging in as user B (cached user: %s)", async (cachedUser) => {
		const userA = { displayName: "User A", userHandle: new TextEncoder().encode("user-a") };
		const credentialA = { id: toBase64Url(new Uint8Array([0xbb])) } as PublicKeyCredential;
		vi.mocked(keystoreApi.unlockPrf).mockResolvedValueOnce([{ privateData: local, mainKey: oldKey }, null]);
		vi.mocked(foldState).mockReturnValueOnce(localState.S);
		const { result } = renderHook(() => useLocalStorageKeystore(eventTarget));

		await act(async () => {
			await result.current.unlockPrf(local, credentialA, promptForPrfRetry, userA);
		});
		expect(result.current.isOpen()).toBe(true);
		expect(result.current.getUserHandleB64u()).toBe(toBase64Url(userA.userHandle));
		expect(result.current.getCalculatedWalletState()).toBe(localState.S);

		// A second login can return B's passkey while A's keystore is still open.
		// Use the same mounted hook so its current handle, private data and key remain A's.
		vi.clearAllMocks();
		let unlocked: Awaited<ReturnType<LocalStorageKeystore["unlockPrf"]>>;
		await act(async () => {
			unlocked = await result.current.unlockPrf(remote, credential, promptForPrfRetry,
				cachedUser ? { displayName: user.displayName, userHandleB64u: toBase64Url(userHandle), prfKeys: [] } : user);
		});

		expect(getItem).toHaveBeenCalledWith("users", "merge-user");
		expect(keystoreApi.openPrivateData).toHaveBeenCalledOnce();
		expect(keystoreApi.openPrivateData).toHaveBeenCalledWith(remoteKey, remote);
		expect(put).toHaveBeenCalledOnce();
		expect(result.current.getUserHandleB64u()).toBe(toBase64Url(userHandle));
		expectRemoteFallback(result, unlocked![0]);
	});

	it("skips local decryption when the JWE matches even if PRF metadata differs", async () => {
		cacheLocal({ ...remote, prfKeys: [{ credentialId: new Uint8Array([0xaa]) }] } as keystoreApi.EncryptedContainer);
		const { result, encrypted } = await unlock();
		expect(keystoreApi.parsePrivateData).toHaveBeenCalledOnce();
		expect(keystoreApi.openPrivateData).toHaveBeenCalledOnce();
		expect(keystoreApi.openPrivateData).toHaveBeenCalledWith(remoteKey, remote);
		expect(keystoreApi.unlockPrf).toHaveBeenCalledOnce();
		expectRemoteFallback(result, encrypted);
	});

	it("merges different local data with the remote main key without evaluating PRF again", async () => {
		cacheLocal();
		const { result, encrypted } = await unlock();
		expect(keystoreApi.openPrivateData).toHaveBeenNthCalledWith(2, remoteKey, local);
		expect(keystoreApi.unlockPrf).toHaveBeenCalledOnce();
		expect(mergeEventHistories).toHaveBeenCalledOnce();
		expect(mergeEventHistories).toHaveBeenCalledWith(remoteState, localState);
		expect(keystoreApi.updateWalletState).toHaveBeenCalledOnce();
		expect(keystoreApi.updateWalletState).toHaveBeenCalledWith([remote, remoteKey], mergedState);
		expect(encrypted).toBe(merged);
		expect(put).toHaveBeenCalledWith({ userHandle: toBase64Url(userHandle), content: merged });
		expect(keystoreApi.exportMainKey).toHaveBeenCalledWith(mergedKey);
		expect(result.current.getCalculatedWalletState()).toBe(mergedState.S);
	});

	function rejectRemoteKeyForLocal() {
		vi.mocked(keystoreApi.openPrivateData).mockImplementation(async (key, data) => {
			if (data.jwe === local.jwe && key === remoteKey) {
				throw new Error("Local data was encrypted with an older main key");
			}
			return [data.jwe === remote.jwe ? remoteState : localState, key, remoteState.S];
		});
	}

	function matchingLocalPrf() {
		local = { ...local, prfKeys: [{ credentialId: new Uint8Array([0xaa]) }] } as keystoreApi.EncryptedContainer;
		cacheLocal();
		rejectRemoteKeyForLocal();
	}

	it("recovers an older local main key using the matching credential and merges under the remote key", async () => {
		matchingLocalPrf();
		vi.mocked(keystoreApi.unlockPrf)
			.mockResolvedValueOnce([{ privateData: remote, mainKey: remoteKey }, null])
			.mockResolvedValueOnce([{ privateData: local, mainKey: oldKey }, null]);
		const { result, encrypted } = await unlock();
		expect(keystoreApi.unlockPrf).toHaveBeenNthCalledWith(2, local, credential, promptForPrfRetry);
		expect(keystoreApi.openPrivateData).toHaveBeenNthCalledWith(3, oldKey, local);
		expect(mergeEventHistories).toHaveBeenCalledWith(remoteState, localState);
		expect(keystoreApi.updateWalletState).toHaveBeenCalledWith([remote, remoteKey], mergedState);
		expect(encrypted).toBe(merged);
		expect(result.current.getCalculatedWalletState()).toBe(mergedState.S);
	});

	it.each([
		{ label: "missing", prfKeys: undefined },
		{ label: "empty", prfKeys: [] },
		{ label: "different credential", prfKeys: [{ credentialId: new Uint8Array([0xbb]) }] },
	])(
		"keeps remote data when the old key fails and local PRF keys are $label",
		async ({ prfKeys }) => {
			local = { ...local, prfKeys } as keystoreApi.EncryptedContainer;
			cacheLocal();
			rejectRemoteKeyForLocal();
			const { result, encrypted } = await unlock();
			expect(keystoreApi.unlockPrf).toHaveBeenCalledOnce();
			expectRemoteFallback(result, encrypted);
		},
	);

	it("keeps initialized remote data when local decryption fails without an unlock credential", async () => {
		matchingLocalPrf();
		vi.mocked(keystoreApi.init).mockResolvedValueOnce({ privateData: remote, mainKey: remoteKey });
		const { result } = renderHook(() => useLocalStorageKeystore(eventTarget));
		let encrypted: keystoreApi.EncryptedContainer;
		await act(async () => {
			encrypted = await result.current.initPrf(credential, new Uint8Array([1]), promptForPrfRetry, user);
		});
		expect(keystoreApi.openPrivateData).toHaveBeenNthCalledWith(2, remoteKey, local);
		expect(keystoreApi.unlockPrf).not.toHaveBeenCalled();
		expectRemoteFallback(result, encrypted!);
	});

	it.each(["merge", "encryption"])("does not persist or open the wallet if %s fails", async (failure) => {
		cacheLocal();
		const error = new Error(`${failure} failed`);
		if (failure === "merge") {
			vi.mocked(mergeEventHistories).mockRejectedValueOnce(error);
		} else {
			vi.mocked(keystoreApi.updateWalletState).mockRejectedValueOnce(error);
		}
		const { result } = renderHook(() => useLocalStorageKeystore(eventTarget));
		await act(async () => {
			await expect(result.current.unlockPrf(remote, credential, promptForPrfRetry, user)).rejects.toBe(error);
		});
		expect(put).not.toHaveBeenCalled();
		expect(result.current.isOpen()).toBe(false);
		expect(result.current.getCalculatedWalletState()).toBeNull();
	});

	it.each(["PRF unlock", "local decryption"])("keeps remote data if recovery fails during %s", async (failure) => {
		matchingLocalPrf();
		vi.mocked(keystoreApi.unlockPrf).mockResolvedValueOnce([{ privateData: remote, mainKey: remoteKey }, null]);
		if (failure === "PRF unlock") {
			vi.mocked(keystoreApi.unlockPrf).mockRejectedValueOnce(new Error("PRF unavailable"));
		} else {
			vi.mocked(keystoreApi.unlockPrf).mockResolvedValueOnce([{ privateData: local, mainKey: oldKey }, null]);
			vi.mocked(keystoreApi.openPrivateData)
				.mockResolvedValueOnce([remoteState, remoteKey, remoteState.S])
				.mockRejectedValueOnce(new Error("Main key mismatch"))
				.mockRejectedValueOnce(new Error("Corrupt local ciphertext"));
		}
		const { result, encrypted } = await unlock();
		expect(keystoreApi.unlockPrf).toHaveBeenCalledTimes(2);
		expectRemoteFallback(result, encrypted);
	});
});
