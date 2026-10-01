import { afterEach, describe, expect, it, vi } from "vitest";
import { signalAllAcceptedCredentials, signalUnknownCredential } from "./util-webauthn";

const options = {
	credentialId: "credential-id",
	rpId: "example.com",
};

const allAcceptedCredentialsOptions = {
	allAcceptedCredentialIds: ["credential-id", "another-credential-id"],
	rpId: "example.com",
	userId: "user-id",
};

const installSignals = (signals: Record<string, unknown>) => {
	Object.defineProperty(window, "isSecureContext", {
		configurable: true,
		value: true,
	});
	vi.stubGlobal("PublicKeyCredential", signals);
};

describe("signalUnknownCredential", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns false without options", async () => {
		expect(await signalUnknownCredential()).toBe(false);
	});

	it("returns false when the browser cannot signal unknown credentials", async () => {
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalUnknownCredential: true }),
		});

		expect(await signalUnknownCredential(options)).toBe(false);
	});

	it("returns false when the client capability is unsupported", async () => {
		const signal = vi.fn();
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalUnknownCredential: false }),
			signalUnknownCredential: signal,
		});

		expect(await signalUnknownCredential(options)).toBe(false);
		expect(signal).not.toHaveBeenCalled();
	});

	it("forwards the credential and relying-party identifiers", async () => {
		const signal = vi.fn().mockResolvedValue(undefined);
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalUnknownCredential: true }),
			signalUnknownCredential: signal,
		});

		expect(await signalUnknownCredential(options)).toBe(true);
		expect(signal).toHaveBeenCalledTimes(1);
		expect(signal).toHaveBeenCalledWith(options);
	});

	it("returns false when the browser API rejects", async () => {
		const error = new Error("platform error");
		const signal = vi.fn().mockRejectedValue(error);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalUnknownCredential: true }),
			signalUnknownCredential: signal,
		});

		expect(await signalUnknownCredential(options)).toBe(false);
		expect(warn).toHaveBeenCalledWith("Failed to signal unknown WebAuthn credential", error);
	});
});

describe("signalAllAcceptedCredentials", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns false without options", async () => {
		expect(await signalAllAcceptedCredentials()).toBe(false);
	});

	it("returns false when the browser cannot signal all accepted credentials", async () => {
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalAllAcceptedCredentials: true }),
		});

		expect(await signalAllAcceptedCredentials(allAcceptedCredentialsOptions)).toBe(false);
	});

	it("returns false when the client capability is unsupported", async () => {
		const signal = vi.fn();
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalAllAcceptedCredentials: false }),
			signalAllAcceptedCredentials: signal,
		});

		expect(await signalAllAcceptedCredentials(allAcceptedCredentialsOptions)).toBe(false);
		expect(signal).not.toHaveBeenCalled();
	});

	it("forwards the accepted credentials and account identifiers", async () => {
		const signal = vi.fn().mockResolvedValue(undefined);
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalAllAcceptedCredentials: true }),
			signalAllAcceptedCredentials: signal,
		});

		expect(await signalAllAcceptedCredentials(allAcceptedCredentialsOptions)).toBe(true);
		expect(signal).toHaveBeenCalledTimes(1);
		expect(signal).toHaveBeenCalledWith(allAcceptedCredentialsOptions);
	});

	it("returns false when the browser API rejects", async () => {
		const error = new Error("platform error");
		const signal = vi.fn().mockRejectedValue(error);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		installSignals({
			getClientCapabilities: vi.fn().mockResolvedValue({ signalAllAcceptedCredentials: true }),
			signalAllAcceptedCredentials: signal,
		});

		expect(await signalAllAcceptedCredentials(allAcceptedCredentialsOptions)).toBe(false);
		expect(warn).toHaveBeenCalledWith("Failed to signal all accepted WebAuthn credentials", error);
	});
});
