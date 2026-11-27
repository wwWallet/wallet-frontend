import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DcqlMatches, DcqlRequirement, DcqlSelection } from 'wallet-common';
import DcqlCredentialsPopup from './DcqlCredentialsPopup';
import { completeRequiredCombinations, reconcileSelection } from './dcqlCredentialSelection';
import type { CredentialSelectionPopupState } from '@/types/credentialSelection';
import type { ExtendedVcEntity } from '@/context/CredentialsContext';

const { credentialImageProps, credentialInfoProps } = vi.hoisted(() => ({
	credentialImageProps: vi.fn(),
	credentialInfoProps: vi.fn(),
}));

vi.mock('./PopupLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('../Credentials/CredentialImage', () => ({
	default: (props: unknown) => {
		credentialImageProps(props);
		return null;
	},
}));
vi.mock('../Credentials/CredentialInfo', () => ({
	default: (props: unknown) => {
		credentialInfoProps(props);
		return null;
	},
}));
vi.mock('@/hooks/useCredentialName', () => ({
	useCredentialName: (_: unknown, batchId: number) => `credential-${batchId}`,
}));
vi.mock('@/hooks/useScreenType', () => ({ default: () => 'desktop' }));
vi.mock('react-i18next', async (original) => ({
	...(await original<typeof import('react-i18next')>()),
	useTranslation: () => ({
		i18n: { language: 'en' },
		t: (key: string, options?: Record<string, unknown>) =>
			Object.values(options ?? {}).reduce((result, value) => `${result} ${String(value)}`, key),
	}),
}));

const candidate = (batchId: number, field = 'preferred') => ({
	batchId,
	claimSetIndex: field === 'preferred' ? 0 : 1,
	disclosurePaths: [[field]],
	disclosedClaims: { [field]: `value-${batchId}`, iat: 123 },
});
const requirements: DcqlRequirement[] = [
	{
		setIndex: 0,
		required: true,
		options: [
			{ optionIndex: 0, queryIds: ['r0'], available: true },
			{ optionIndex: 1, queryIds: ['r1', 'r2'], available: true },
		],
	},
	{ setIndex: 1, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
];
const matches: DcqlMatches = Object.fromEntries(
	[
		['r0', [candidate(1), candidate(6)], false],
		['r1', [candidate(2)], false],
		['r2', [candidate(3), candidate(4, 'fallback')], true],
		['r3', [candidate(5)], false],
		['r4', [], false],
	].map(([id, candidates, multiple]) => [
		id,
		{
			requirements,
			inventoryCanSatisfy: true,
			failures: [],
			multiple,
			credentials: (candidates as ReturnType<typeof candidate>[]).map((item) => item.batchId),
			candidates,
			requestedFields: [],
		},
	]),
) as DcqlMatches;
const inventory = [6, 5, 4, 3, 2, 1].map((batchId) => ({
	batchId,
	parsedCredential: {
		signedClaims: {},
		metadata: {
			issuer: {},
			credential: { format: 'dc+sd-jwt', TypeMetadata: { claims: [] } },
		},
		validityInfo: { signed: new Date(Date.UTC(2026, 0, batchId)) },
	},
	instances: [],
})) as unknown as ExtendedVcEntity[];

function mount(conformantCredentialsMap = matches, credentials = inventory) {
	const resolve = vi.fn();
	const reject = vi.fn();
	function Wrapper() {
		const [state, setState] = useState<CredentialSelectionPopupState>({
			isOpen: true,
			options: { conformantCredentialsMap, verifierDomainName: 'verifier.invalid', verifierPurpose: '' },
			resolve,
			reject,
		});
		return <DcqlCredentialsPopup popupState={state} setPopupState={setState} vcEntityList={credentials} />;
	}
	render(<Wrapper />);
	return { resolve, reject };
}
const next = () => fireEvent.click(screen.getByRole('button', { name: 'common.next' }));
const begin = () => fireEvent.click(screen.getByRole('button', { name: 'dcqlCredentials.reviewDetails' }));
const select = (number = 1) =>
	fireEvent.click(screen.getByRole('radio', { name: `dcqlCredentials.selectCredentialNumber ${number}` }));
const nextCredential = () =>
	fireEvent.click(
		screen.getByRole('button', { name: /pageCredentials.slideButtonAriaLabelEnable pageCredentials.slideNext/ }),
	);
const previousCredential = () =>
	fireEvent.click(
		screen.getByRole('button', { name: /pageCredentials.slideButtonAriaLabelEnable pageCredentials.slidePrevious/ }),
	);
const setAllCredentials = (selected: boolean) =>
	fireEvent.click(
		screen.getAllByRole('button', {
			name: selected ? 'dcqlCredentials.selectAll' : 'dcqlCredentials.deselectAll',
		})[0],
	);
const visibleCredentialCheckboxes = () =>
	screen.getAllByRole('checkbox', { name: /dcqlCredentials.selectCredentialNumber/ });
const setVisibleCredentials = (selected: boolean) =>
	visibleCredentialCheckboxes()
		.filter((checkbox) => (checkbox as HTMLInputElement).checked !== selected)
		.forEach((checkbox) => fireEvent.click(checkbox));
const consent = () => fireEvent.click(screen.getByRole('checkbox', { name: /dcqlCredentials.consentAria/ }));
const send = () => fireEvent.click(screen.getByRole('button', { name: 'common.navItemSendCredentialsSimple' }));
function withRequirements(sets: DcqlRequirement[]): DcqlMatches {
	return Object.fromEntries(
		Object.entries(matches).map(([id, match]) => [id, { ...match, requirements: sets }]),
	) as DcqlMatches;
}

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	credentialImageProps.mockClear();
	credentialInfoProps.mockClear();
});

describe('DCQL credential selection', () => {
	it('deduplicates complete required combinations and excludes unavailable and optional options', () => {
		const sets: DcqlRequirement[] = [
			{
				setIndex: 0,
				required: true,
				options: [
					{ optionIndex: 0, queryIds: ['r0'], available: true },
					{ optionIndex: 1, queryIds: ['r1'], available: true },
				],
			},
			{
				setIndex: 1,
				required: true,
				options: [
					{ optionIndex: 0, queryIds: ['r2'], available: true },
					{ optionIndex: 1, queryIds: ['r0', 'r2'], available: true },
					{ optionIndex: 2, queryIds: ['r4'], available: true },
				],
			},
			{ setIndex: 2, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
		];
		const result = completeRequiredCombinations(sets, withRequirements(sets));
		expect(result.truncated).toBe(false);
		expect(result.combinations.map(({ queryIds }) => queryIds)).toEqual([
			['r0', 'r2'],
			['r1', 'r2'],
			['r1', 'r0', 'r2'],
		]);
	});

	it('limits required combinations before the product grows too large', () => {
		const sets: DcqlRequirement[] = Array.from({ length: 9 }, (_, setIndex) => ({
			setIndex,
			required: true,
			options: [0, 1].map((optionIndex) => ({
				optionIndex,
				queryIds: [`q${setIndex}-${optionIndex}`],
				available: true,
			})),
		}));
		const manyMatches = Object.fromEntries(
			sets.flatMap((set) => set.options.map((option) => [option.queryIds[0], matches.r0])),
		) as DcqlMatches;
		const result = completeRequiredCombinations(sets, manyMatches);
		expect(result.combinations).toHaveLength(256);
		expect(result.truncated).toBe(true);
	});

	it('uses radio selection for a single-choice type and preserves the exact candidate', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r0'], available: true }] },
		];
		const { resolve } = mount(withRequirements(sets));
		nextCredential();
		select(2);
		previousCredential();
		next();
		fireEvent.click(screen.getByRole('button', { name: /dcqlCredentials.showDetails/ }));
		expect(credentialInfoProps.mock.lastCall?.[0]).toEqual(
			expect.objectContaining({
				parsedCredential: expect.objectContaining({ signedClaims: matches.r0.candidates[1].disclosedClaims }),
			}),
		);
		consent();
		send();
		expect(resolve).toHaveBeenCalledOnce();
		const selected = (resolve.mock.calls[0][0] as DcqlSelection).get('r0');
		expect(selected).toEqual([matches.r0.candidates[1]]);
		expect(selected?.[0]).toBe(matches.r0.candidates[1]);
	});

	it('sends a required combination with an optional credential', () => {
		const { resolve } = mount();
		fireEvent.click(screen.getAllByRole('radio')[1]);
		fireEvent.click(screen.getByRole('checkbox', { name: 'credential-5' }));
		begin();
		next();
		setAllCredentials(true);
		next();
		next();
		consent();
		send();
		expect([...(resolve.mock.calls[0][0] as DcqlSelection).keys()]).toEqual(['r1', 'r2', 'r3']);
	});

	it('requires each query when requirement sets are absent', () => {
		const { resolve } = mount({
			r0: { ...matches.r0, requirements: [] },
			r1: { ...matches.r1, requirements: [] },
		});
		select();
		next();
		next();
		consent();
		send();
		expect([...(resolve.mock.calls[0][0] as DcqlSelection).keys()]).toEqual(['r0', 'r1']);
	});

	it('allows an optional-only request', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
		];
		const { resolve } = mount({ r3: { ...matches.r3, requirements: sets } });
		fireEvent.click(screen.getByRole('checkbox', { name: 'credential-5' }));
		begin();
		next();
		consent();
		send();
		expect([...(resolve.mock.calls[0][0] as DcqlSelection).keys()]).toEqual(['r3']);
	});

	it('does not open an empty review for an optional-only request', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
		];
		mount({ r3: { ...matches.r3, requirements: sets } });
		begin();
		expect(screen.getByRole('alert')).toHaveTextContent('dcqlCredentials.emptyResponse');
		expect(screen.getByRole('button', { name: 'dcqlCredentials.reviewDetails' })).toBeInTheDocument();
	});

	it('does not open a review when optional options are unavailable', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: false, options: [{ optionIndex: 0, queryIds: ['r4'], available: false }] },
		];
		mount({ r4: { ...matches.r4, requirements: sets } });
		begin();
		expect(screen.getByRole('alert')).toHaveTextContent('dcqlCredentials.emptyResponse');
		expect(screen.getByRole('button', { name: 'dcqlCredentials.cancelPresentation' })).toBeInTheDocument();
	});

	it('keeps a credential choice when returning through the combination step', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r0'], available: true }] },
			{ setIndex: 1, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
		];
		const { resolve } = mount(withRequirements(sets));
		begin();
		select();
		next();
		fireEvent.click(screen.getByRole('button', { name: 'common.previous' }));
		fireEvent.click(screen.getByRole('button', { name: 'common.previous' }));
		begin();
		expect(screen.getByRole('radio', { name: 'dcqlCredentials.selectCredentialNumber 1' })).toBeChecked();
		next();
		consent();
		send();
		expect((resolve.mock.calls[0][0] as DcqlSelection).get('r0')).toEqual([matches.r0.candidates[0]]);
	});

	it('preserves a required selection when enabling an optional credential', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r0'], available: true }] },
			{ setIndex: 1, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
		];
		mount(withRequirements(sets));
		begin();
		select();
		next();
		fireEvent.click(screen.getByRole('button', { name: 'common.previous' }));
		fireEvent.click(screen.getByRole('button', { name: 'common.previous' }));
		fireEvent.click(screen.getAllByRole('checkbox')[0]);
		begin();
		expect(screen.getByRole('radio', { name: 'dcqlCredentials.selectCredentialNumber 1' })).toBeChecked();
	});

	it('preserves selected credentials for query IDs that remain active', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r2'], available: true }] },
			{
				setIndex: 1,
				required: true,
				options: [
					{ optionIndex: 0, queryIds: ['r2'], available: true },
					{ optionIndex: 1, queryIds: ['r2'], available: true },
				],
			},
		];
		const previous = new Map([['r2', matches.r2.candidates]]);
		const result = reconcileSelection({ r2: { ...matches.r2, requirements: sets } }, [0, 1], previous, inventory);
		expect(result.get('r2')).toBe(previous.get('r2'));
		expect(result.has('r1')).toBe(false);
	});

	it('starts newly active multi-candidate queries empty', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r2'], available: true }] },
		];
		const result = reconcileSelection({ r2: { ...matches.r2, requirements: sets } }, [0], new Map(), inventory);
		expect(result.get('r2')).toEqual([]);
	});

	it('preselects the only candidate for a multiple query', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r1'], available: true }] },
		];
		const result = reconcileSelection(
			{ r1: { ...matches.r1, multiple: true, requirements: sets } },
			[0],
			new Map(),
			inventory,
		);
		expect(result.get('r1')).toEqual([matches.r1.candidates[0]]);
	});

	it('adds and removes individual credentials in a multiple-choice query', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r2'], available: true }] },
		];
		const { resolve } = mount({ r2: { ...matches.r2, requirements: sets } });
		fireEvent.click(screen.getByRole('checkbox', { name: 'dcqlCredentials.selectCredentialNumber 1' }));
		nextCredential();
		fireEvent.click(screen.getByRole('checkbox', { name: 'dcqlCredentials.selectCredentialNumber 2' }));
		previousCredential();
		fireEvent.click(screen.getByRole('checkbox', { name: 'dcqlCredentials.selectCredentialNumber 1' }));
		next();
		fireEvent.click(screen.getByRole('button', { name: /dcqlCredentials.showDetails/ }));
		expect(credentialInfoProps.mock.lastCall?.[0]).toEqual(
			expect.objectContaining({
				parsedCredential: expect.objectContaining({ signedClaims: matches.r2.candidates[1].disclosedClaims }),
			}),
		);
		consent();
		send();
		expect((resolve.mock.calls[0][0] as DcqlSelection).get('r2')).toEqual([matches.r2.candidates[1]]);
	});

	it('supports multiple choice, select all and select none, and resets consent after a review edit', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r2'], available: true }] },
		];
		const { resolve } = mount({ r2: { ...matches.r2, requirements: sets } });
		expect(screen.getByRole('checkbox', { name: 'dcqlCredentials.selectCredentialNumber 1' })).not.toBeChecked();
		setAllCredentials(true);
		expect(screen.getByRole('checkbox', { name: 'dcqlCredentials.selectCredentialNumber 1' })).toBeChecked();
		setAllCredentials(false);
		expect(screen.getByRole('button', { name: 'common.next' })).toBeDisabled();
		setAllCredentials(true);
		next();
		expect(screen.getByRole('button', { name: 'common.navItemSendCredentialsSimple' })).toBeEnabled();
		send();
		const consentCheckbox = screen.getByRole('checkbox', { name: /dcqlCredentials.consentAria/ });
		expect(consentCheckbox).toHaveFocus();
		expect(screen.getByRole('alert')).toHaveTextContent('dcqlCredentials.consentRequired');
		expect(resolve).not.toHaveBeenCalled();
		consent();
		expect(screen.queryByText('dcqlCredentials.consentRequired')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: /dcqlCredentials.showDetails/ }));
		expect(screen.getByRole('button', { name: /dcqlCredentials.hideDetails/ })).toBeInTheDocument();
		setVisibleCredentials(false);
		expect(screen.getByRole('checkbox', { name: /dcqlCredentials.consentAria/ })).not.toBeChecked();
		expect(screen.getByRole('button', { name: 'common.navItemSendCredentialsSimple' })).toBeEnabled();
		send();
		expect(screen.getByRole('checkbox', { name: /dcqlCredentials.consentAria/ })).toHaveFocus();
		expect(resolve).not.toHaveBeenCalled();
		consent();
		send();
		expect(resolve).not.toHaveBeenCalled();
		expect(screen.getByRole('button', { name: /dcqlCredentials.hideDetails/ })).toHaveFocus();
		setVisibleCredentials(true);
		consent();
		send();
		expect((resolve.mock.calls[0][0] as DcqlSelection).get('r2')).toEqual(matches.r2.candidates);
	});

	it('keeps claim exclusions, nested paths and image disclosure filters', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r0'], available: true }] },
		];
		const rich = {
			...candidate(1),
			disclosurePaths: [['person', 'name'], ['sub']],
			disclosedClaims: { person: { name: 'Ada' }, iat: 123, iss: 'issuer', sub: 'subject-id' },
		};
		const richInventory = inventory.map((vc) =>
			vc.batchId === 1
				? ({
						...vc,
						parsedCredential: {
							...vc.parsedCredential,
							metadata: {
								...vc.parsedCredential.metadata,
								credential: {
									...vc.parsedCredential.metadata.credential,
									TypeMetadata: {
										claims: [
											{ path: ['required'], required: true },
											{ path: ['person', 'name'], display: [{ locale: 'en', label: 'Person name' }] },
										],
									},
								},
							},
						},
					} as ExtendedVcEntity)
				: vc,
		);
		mount({ r0: { ...matches.r0, candidates: [rich], credentials: [1], requirements: sets } }, richInventory);
		expect(credentialInfoProps).toHaveBeenCalledWith(
			expect.objectContaining({
				parsedCredential: expect.objectContaining({
					signedClaims: rich.disclosedClaims,
					metadata: richInventory[5].parsedCredential.metadata,
				}),
				visibleFields: [['person', 'name']],
			}),
		);
		expect(credentialImageProps).toHaveBeenCalledWith(
			expect.objectContaining({ filter: [['person', 'name'], ['required']] }),
		);
	});

	it('retains protocol fields for mdoc credentials', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r1'], available: true }] },
		];
		const mdocInventory = inventory.map((vc) =>
			vc.batchId === 2
				? ({
						...vc,
						parsedCredential: {
							...vc.parsedCredential,
							metadata: {
								...vc.parsedCredential.metadata,
								credential: {
									...vc.parsedCredential.metadata.credential,
									format: 'mso_mdoc',
								},
							},
						},
					} as ExtendedVcEntity)
				: vc,
		);
		const mdocCandidate = {
			...matches.r1.candidates[0],
			disclosedClaims: { preferred: 'value-2', iat: 123, sub: 'subject-id' },
		};
		mount({ r1: { ...matches.r1, candidates: [mdocCandidate], requirements: sets } }, mdocInventory);
		expect(credentialInfoProps).toHaveBeenCalledWith(
			expect.objectContaining({ visibleFields: [['preferred'], ['iat']] }),
		);
	});

	it('cancels through the existing rejection flow', () => {
		const { reject, resolve } = mount();
		fireEvent.click(screen.getByRole('button', { name: 'dcqlCredentials.cancelPresentation' }));
		expect(reject).toHaveBeenCalledOnce();
		expect(resolve).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: 'dcqlCredentials.cancelPresentation' })).not.toBeInTheDocument();
	});

	it('blocks step one when a required query has no matching credential', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r4'], available: true }] },
		];
		mount({ r4: { ...matches.r4, requirements: sets } });
		expect(screen.getByRole('button', { name: 'dcqlCredentials.reviewDetails' })).toBeDisabled();
	});
});
