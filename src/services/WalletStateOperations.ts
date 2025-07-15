import { FOLD_EVENT_HISTORY_AFTER } from "@/config";
import { CredentialKeyPair } from "./keystore";
import { WalletStateUtils } from "./WalletStateUtils";
import { JWK } from "jose";

const SCHEMA_VERSION = 1;
const WALLET_SESSION_EVENT_SCHEMA_VERSION = 1;


export type WalletStateContainer = {
	events: WalletSessionEvent[];
	S: WalletBaseState;
};

export type WalletSessionEvent = {
	schemaVersion: number,
	parentHash: string,
	eventId: number,
	timestamp: number,
} & ({
	type: "new_credential",
	credentialId: number,
	format: string,
	data: string,
	batchId: number,
	kid: string,
	instanceId: number,
	credentialIssuerIdentifier: string,
	credentialConfigurationId: string,
} | {
	type: "delete_credential",
	credentialId: number,
} | {
	type: "new_keypair",
	kid: string,
	keypair: CredentialKeyPair,
} | {
	type: "delete_keypair",
	kid: string,
} | {
	type: "new_presentation",
	presentationId: number,
	transactionId: number,
	data: string,
	usedCredentialIds: number[],
	timestamp: number,
	audience: string,
} | {
	type: "delete_presentation",
	presentationId: number,
} | {
	type: "alter_settings",
	settings: Record<string, string>;
} | {
	type: "save_credential_issuance_session",
	sessionId: number,

	credentialIssuerIdentifier: string,
	state: string,
	code_verifier: string,
	credentialConfigurationId: string,
	tokenResponse?: {
		data: {
			access_token: string,
			expiration_timestamp: number,
			c_nonce: string,
			c_nonce_expiration_timestamp: number,
			refresh_token?: string,
		},
		headers: {
			"dpop-nonce"?: string,
		}
	},
	dpop?: {
		dpopJti: string,
		dpopPrivateKeyJwk: JWK,
		dpopPublicKeyJwk?: JWK,
		dpopAlg: string,
	},
	firstPartyAuthorization?: {
		auth_session: string,
	},
	created: number,
})

export type WalletBaseState = {
	schemaVersion: number,
	credentials: {
		credentialId: number,
		format: string,
		data: string,
		kid: string,
		instanceId: number,
		batchId: number,
		credentialIssuerIdentifier: string,
		credentialConfigurationId: string,
	}[],
	keypairs: {
		kid: string,
		keypair: CredentialKeyPair,
	}[],
	presentations: {
		presentationId: number,
		transactionId: number, // one transaction can be associated with more than one presentations
		data: string,
		usedCredentialIds: number[],
		timestamp: number,
		audience: string,
	}[],
	settings: Record<string, string>,
	credentialIssuanceSessions: {
		sessionId: number, // unique

		credentialIssuerIdentifier: string,
		state: string,
		code_verifier: string,
		credentialConfigurationId: string,
		tokenResponse?: {
			data: {
				access_token: string,
				expiration_timestamp: number,
				c_nonce: string,
				c_nonce_expiration_timestamp: number,
				refresh_token?: string,
			},
			headers: {
				"dpop-nonce"?: string,
			}
		},
		dpop?: {
			dpopJti: string,
			dpopPrivateKeyJwk: JWK,
			dpopPublicKeyJwk?: JWK,
			dpopAlg: string,
		},
		firstPartyAuthorization?: {
			auth_session: string,
		},
		created: number,
	}[],
}

export type WalletBaseStateCredential = WalletBaseState['credentials'][number];
export type WalletBaseStateKeypair = WalletBaseState['keypairs'][number];
export type WalletBaseStatePresentation = WalletBaseState['presentations'][number];
export type WalletBaseStateSettings = WalletBaseState['settings'];
export type WalletBaseStateCredentialIssuanceSession = WalletBaseState['credentialIssuanceSessions'][number];

function credentialReducer(state: WalletBaseStateCredential[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "new_credential":
			return state.concat([{
				credentialId: newEvent.credentialId,
				data: newEvent.data,
				format: newEvent.format,
				kid: newEvent.kid,
				credentialIssuerIdentifier: newEvent.credentialIssuerIdentifier,
				credentialConfigurationId: newEvent.credentialConfigurationId,
				instanceId: newEvent.instanceId,
				batchId: newEvent.batchId,
			}]);
		case "delete_credential":
			return state.filter((cred) => cred.credentialId !== newEvent.credentialId);
		default:
			return state;
	}
}

function keypairReducer(state: WalletBaseStateKeypair[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "new_keypair":
			return state.concat([{
				kid: newEvent.kid,
				keypair: newEvent.keypair,
			}]);
		case "delete_keypair":
			return state.filter((k) => k.kid !== newEvent.kid);
		default:
			return state;
	}
}


function presentationReducer(state: WalletBaseStatePresentation[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "new_presentation":
			return state.concat([{
				presentationId: newEvent.presentationId,
				data: newEvent.data,
				usedCredentialIds: newEvent.usedCredentialIds,
				transactionId: newEvent.transactionId,
				timestamp: newEvent.timestamp,
				audience: newEvent.audience,
			}]);
		case "delete_presentation":
			return state.filter((k) => k.presentationId !== newEvent.presentationId);
		default:
			return state;
	}
}

function credentialIssuanceSessionReducer(state: WalletBaseStateCredentialIssuanceSession[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "save_credential_issuance_session":
			return state.filter((s) => s.sessionId !== newEvent.sessionId).concat([{
				sessionId: newEvent.sessionId,
				state: newEvent.state,
				code_verifier: newEvent.code_verifier,
				credentialConfigurationId: newEvent.credentialConfigurationId,
				credentialIssuerIdentifier: newEvent.credentialIssuerIdentifier,
				tokenResponse: newEvent.tokenResponse,
				dpop: newEvent.dpop,
				firstPartyAuthorization: newEvent.firstPartyAuthorization,
				created: newEvent.created,
			}]);
		default:
			return state;
	}
}

function settingsReducer(state: WalletBaseStateSettings = {}, newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "alter_settings":
			return { ...newEvent.settings };
		default:
			return state;
	}
}

async function getLastEventHashFromEventHistory(events: WalletSessionEvent[]): Promise<string> {
	return events.length > 0 ? WalletStateUtils.calculateEventHash(events[events.length - 1]) : "";
}



async function createWalletSessionEvent(container: WalletStateContainer): Promise<{ schemaVersion: number, eventId: number, parentHash: string, timestamp: number }> {
	const baseEvent = {
		schemaVersion: WALLET_SESSION_EVENT_SCHEMA_VERSION,
		eventId: WalletStateUtils.getRandomUint32(),
		parentHash: await getLastEventHashFromEventHistory(container.events),
		timestamp: Math.floor(new Date().getTime() / 1000),
	};
	return {
		...baseEvent,
	}
}

type MergeStrategy = (a: WalletSessionEvent[], b: WalletSessionEvent[]) => WalletSessionEvent[];

const mergeStrategies: Record<WalletSessionEvent["type"], MergeStrategy> = {
	new_credential: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// the following line removes the duplicate new_credential event that creates a credential with the same credentialId
		// assuming that credentialId is a safe randomly-generated number that was assigned during insertion
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "new_credential" && map.set(event.credentialId, event));
		return [...map.values()];
	},
	delete_credential: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// the following line removes the duplicate delete_credential event that deletes the same credential
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "delete_credential" && map.set(event.credentialId, event));
		return [...map.values()];
	},
	new_keypair: (a, b) => {
		const map = new Map<string, WalletSessionEvent>();
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "new_keypair" && map.set(event.kid, event));
		return [...map.values()];
	},
	delete_keypair: (a, b) => {
		const map = new Map<string, WalletSessionEvent>();
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "delete_keypair" && map.set(event.kid, event));
		return [...map.values()];
	},
	new_presentation: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// the following line accepts all presentations with unique eventId
		[...a, ...b].map((event: WalletSessionEvent) => event.type === "new_presentation" && map.set(event.eventId, event));
		return [...map.values()];
	},
	delete_presentation: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// similar to new_presentation
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "delete_presentation" && map.set(event.eventId, event));
		return [...map.values()];
	},
	alter_settings: (a, b) => {
		const settingsEvents: WalletSessionEvent[] = [];
		// get only the latest applied setting during merge based on timestamp of event
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "alter_settings" && settingsEvents.push(event));
		settingsEvents.sort((a, b) => a.timestamp - b.timestamp);
		return settingsEvents.length > 0 ? [settingsEvents[settingsEvents.length - 1]] : [];
	},
	save_credential_issuance_session: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		[...a, ...b].map((event: WalletSessionEvent) => event.type === "save_credential_issuance_session" && map.set(event.eventId, event));
		return [...map.values()];
	},
};

async function mergeDivergentHistoriesWithStrategies(historyA: WalletSessionEvent[], historyB: WalletSessionEvent[], lastCommonAncestorHashFromEventHistory: string): Promise<WalletSessionEvent[]> {
	const eventsByType: Record<WalletSessionEvent["type"], [WalletSessionEvent[], WalletSessionEvent[]]> = {
		new_credential: [[], []],
		delete_credential: [[], []],
		new_keypair: [[], []],
		delete_keypair: [[], []],
		new_presentation: [[], []],
		delete_presentation: [[], []],
		alter_settings: [[], []],
		save_credential_issuance_session: [[], []],
	};

	for (const event of historyA) {
		eventsByType[event.type][0].push(event);
	}

	for (const event of historyB) {
		eventsByType[event.type][1].push(event);
	}

	let mergedEvents: WalletSessionEvent[] = [];
	for (const type in mergeStrategies) {
		const [a, b] = eventsByType[type as WalletSessionEvent["type"]];
		const merged = mergeStrategies[type as WalletSessionEvent["type"]](a, b);
		mergedEvents = mergedEvents.concat(merged);
	}

	mergedEvents.sort((a, b) => a.timestamp - b.timestamp);

	// recalculate the hashes for the merged events to rebuild the event history
	const newEvents: WalletSessionEvent[] = [];
	for (let i = 0; i < mergedEvents.length; i++) {
		const e: WalletSessionEvent = {
			...mergedEvents[i],
			parentHash: i == 0 ? lastCommonAncestorHashFromEventHistory : await getLastEventHashFromEventHistory(newEvents),
		}
		newEvents.push(e);
	}
	return newEvents;
}

export function findDivergencePoint(events1: WalletSessionEvent[], events2: WalletSessionEvent[]): WalletSessionEvent | null {
	const parents1 = new Set();
	const parents2 = new Set();

	let i1 = events1.length - 1;
	let i2 = events2.length - 1;

	while (i1 >= 0 || i2 >= 0) {
		if (i1 >= 0) {
			if (parents2.has(events1[i1].parentHash)) {
				return events1[i1 - 1];
			}
			parents1.add(events1[i1].parentHash);
			i1 -= 1;
		}
		if (i2 >= 0) {
			if (parents1.has(events2[i2].parentHash)) {
				return events2[i2 - 1];
			}
			parents2.add(events2[i2].parentHash);
			i2 -= 1;
		}
	}
	return null;
}

async function rebuildEventHistory(events: WalletSessionEvent[]): Promise<WalletSessionEvent[]> {
	const newEvents: WalletSessionEvent[] = [];
	for (let i = 0; i < events.length; i++) {
		if (i == 0) {
			newEvents.push({
				...events[0],
				parentHash: "",
			});
			continue;
		}
		newEvents.push({
			...events[i],
			parentHash: await WalletStateUtils.calculateEventHash(events[i - 1]),
		});
	}
	return newEvents;
}

export namespace WalletStateOperations {



	export function initialWalletStateContainer(): WalletStateContainer {
		return {
			S: { schemaVersion: SCHEMA_VERSION, credentials: [], presentations: [], keypairs: [], credentialIssuanceSessions: [], settings: {} },
			events: [],
		}
	}

	export async function validateEventHistoryContinuity(events: WalletSessionEvent[]): Promise<boolean> {
		if (events.length < 1) {
			return true;
		}

		const eventHashes = await Promise.all(events.map(async (e) => WalletStateUtils.calculateEventHash(e)));
		for (let i = 1; i < events.length; i++) {
			if (events[i].parentHash !== eventHashes[i - 1]) {
				return false;
			}
		}
		return true;
	}

	export async function createNewCredentialWalletSessionEvent(container: WalletStateContainer, data: string, format: string, kid: string, batchId: number = 0, credentialIssuerIdentifier: string = "", credentialConfigurationId = "", instanceId: number = 0, credentialId: number = WalletStateUtils.getRandomUint32()): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "new_credential",
			credentialId: credentialId,
			data,
			format,
			kid,
			batchId,
			credentialIssuerIdentifier,
			credentialConfigurationId,
			instanceId,
		}
	}


	export async function createDeleteCredentialWalletSessionEvent(container: WalletStateContainer, credentialId: number): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "delete_credential",
			credentialId,
		}
	}

	export async function createNewKeypairWalletSessionEvent(container: WalletStateContainer, kid: string, keypair: CredentialKeyPair): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "new_keypair",
			kid,
			keypair,
		}
	}


	export async function createDeleteKeypairWalletSessionEvent(container: WalletStateContainer, kid: string): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "delete_keypair",
			kid,
		}
	}


	export async function createNewPresentationWalletSessionEvent(container: WalletStateContainer, transactionId: number, data: string, usedCredentialIds: number[], timestamp: number, audience: string): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "new_presentation",
			presentationId: WalletStateUtils.getRandomUint32(),
			transactionId: transactionId,
			data,
			usedCredentialIds,
			timestamp,
			audience,
		}
	}


	export async function createDeletePresentationWalletSessionEvent(container: WalletStateContainer, presentationId: number): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "delete_presentation",
			presentationId,
		}
	}

	export async function createAlterSettingsWalletSessionEvent(container: WalletStateContainer, settings: Record<string, string>): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "alter_settings",
			settings: settings,
		}
	}


	export async function createSaveCredentialIssuanceSessionWalletSessionEvent(container: WalletStateContainer,
		sessionId: number,
		credentialIssuerIdentifier: string,
		state: string,
		code_verifier: string,
		credentialConfigurationId: string,
		tokenResponse?: {
			data: {
				access_token: string,
				expiration_timestamp: number,
				c_nonce: string,
				c_nonce_expiration_timestamp: number,
				refresh_token?: string,
			},
			headers: {
				"dpop-nonce"?: string,
			}
		},
		dpop?: {
			dpopJti: string,
			dpopPrivateKeyJwk: JWK,
			dpopPublicKeyJwk?: JWK,
			dpopAlg: string,
		},
		firstPartyAuthorization?: {
			auth_session: string,
		},
		created?: number
	): Promise<WalletSessionEvent> {
		return {
			...await createWalletSessionEvent(container),
			type: "save_credential_issuance_session",
			sessionId: sessionId,

			credentialIssuerIdentifier,
			state,
			code_verifier,
			credentialConfigurationId,
			tokenResponse,
			dpop,
			firstPartyAuthorization,
			created: created ?? Math.floor(Date.now() / 1000),
		}
	}


	export function walletStateReducer(state: WalletBaseState = { schemaVersion: SCHEMA_VERSION, credentials: [], keypairs: [], presentations: [], credentialIssuanceSessions: [], settings: {} }, newEvent: WalletSessionEvent): WalletBaseState {
		return {
			schemaVersion: SCHEMA_VERSION,
			credentials: credentialReducer(state.credentials, newEvent),
			keypairs: keypairReducer(state.keypairs, newEvent),
			presentations: presentationReducer(state.presentations, newEvent),
			credentialIssuanceSessions: credentialIssuanceSessionReducer(state.credentialIssuanceSessions, newEvent),
			settings: settingsReducer(state.settings, newEvent)
		}
	}

	export async function mergeEventHistories(events1: WalletSessionEvent[], events2: WalletSessionEvent[]) {
		const pointOfDivergence = findDivergencePoint(events1, events2);
		if (pointOfDivergence === null) {
			return [...events1, ...events2].sort((e1, e2) => e1.timestamp - e2.timestamp);
		}

		const commonHistory: WalletSessionEvent[] = [];
		const history1DivergentPart = [];
		const history2DivergentPart = [];

		let pointOfDivergenceIndex = -1;
		for (let i = 0; i < events1.length; i++) {
			if (events1[i].eventId === pointOfDivergence.eventId) {
				pointOfDivergenceIndex = i;
			}
		}

		for (let i = 0; i <= pointOfDivergenceIndex; i++) {
			commonHistory.push(events1[i]);
		}

		for (let i = pointOfDivergenceIndex + 1; i < events1.length; i++) {
			history1DivergentPart.push(events1[i]);
		}

		for (let i = pointOfDivergenceIndex + 1; i < events2.length; i++) {
			history1DivergentPart.push(events2[i]);
		}


		const mergeDivergentPartsResult = await mergeDivergentHistoriesWithStrategies(history1DivergentPart, history2DivergentPart, await WalletStateUtils.calculateEventHash(pointOfDivergence));
		return commonHistory.concat(mergeDivergentPartsResult);
	}

	/**
	 * Returns a depp copy of container with the whole history of the container folded into the base state
	 * @param walletStateContainer
	 * @returns
	 */
	export function foldAllEventsIntoBaseState(walletStateContainer: WalletStateContainer) {
		// get deep copy
		const container: WalletStateContainer = { ...walletStateContainer };
		container.S = container.events.reduce(walletStateReducer, container.S);
		return container;
	}

	/**
	 * 
	 * Returns a deep copy of container with folded history for the last event only
	 * @param walletStateContainer
	 * @returns
	 */
	export async function foldLastEventIntoBaseState(walletStateContainer: WalletStateContainer, foldEventHistoryAfter = FOLD_EVENT_HISTORY_AFTER): Promise<WalletStateContainer> {
		const now = Math.floor(new Date().getTime() / 1000);
		if (walletStateContainer.events[0].timestamp > now + foldEventHistoryAfter) {
			walletStateContainer.S = walletStateReducer(walletStateContainer.S, walletStateContainer.events[0]);
			walletStateContainer.events = walletStateContainer.events.slice(1,);
			walletStateContainer.events = await rebuildEventHistory(walletStateContainer.events);
			return { ...walletStateContainer }; // return deep copy
		}

		return walletStateContainer;
	}
}
