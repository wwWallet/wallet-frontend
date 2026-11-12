import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DcqlMatches, DcqlRequirement, DcqlSelection } from 'wallet-common';
import DcqlCredentialsPopup, { completeRequiredCombinations } from './DcqlCredentialsPopup';
import type { CredentialSelectionPopupState } from '@/types/credentialSelection';
import type { ExtendedVcEntity } from '@/context/CredentialsContext';

vi.mock('./PopupLayout', () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('../Credentials/CredentialImage', () => ({ default: () => <span /> }));
vi.mock('../Credentials/CredentialInfo', () => ({
	default: ({
		parsedCredential,
		visibleFields,
	}: {
		parsedCredential: { signedClaims: unknown };
		visibleFields: unknown;
	}) => (
		<pre data-testid="disclosure" data-fields={JSON.stringify(visibleFields)}>
			{JSON.stringify(parsedCredential.signedClaims)}
		</pre>
	),
}));
vi.mock('@/hooks/useCredentialName', () => ({
	useCredentialName: (_: unknown, batchId: number) => `credential-${batchId}`,
}));
vi.mock('@/hooks/useScreenType', () => ({ default: () => 'desktop' }));
vi.mock('react-i18next', async (original) => ({
	...(await original<typeof import('react-i18next')>()),
	useTranslation: () => ({ i18n: { language: 'en' }, t: (key: string) => key }),
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
	function Wrapper() {
		const [state, setState] = useState<CredentialSelectionPopupState>({
			isOpen: true,
			options: { conformantCredentialsMap, verifierDomainName: 'verifier.invalid', verifierPurpose: '' },
			resolve,
			reject: vi.fn(),
		});
		return <DcqlCredentialsPopup popupState={state} setPopupState={setState} vcEntityList={credentials} />;
	}
	render(<Wrapper />);
	return resolve;
}
function review() {
	const button = screen.queryByRole('button', { name: 'dcqlCredentials.reviewDetails' });
	if (button) fireEvent.click(button);
}
function send(resolve: ReturnType<typeof vi.fn>): DcqlSelection {
	review();
	fireEvent.click(screen.getByRole('checkbox', { name: 'dcqlCredentials.consentAria' }));
	fireEvent.click(screen.getByRole('button', { name: 'common.navItemSendCredentialsSimple' }));
	expect(resolve).toHaveBeenCalledOnce();
	return resolve.mock.calls[0][0] as DcqlSelection;
}
function withRequirements(sets: DcqlRequirement[]): DcqlMatches {
	return Object.fromEntries(
		Object.entries(matches).map(([id, match]) => [id, { ...match, requirements: sets }]),
	) as DcqlMatches;
}

afterEach(cleanup);

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

	it('sends the chosen required combination and an optional credential', () => {
		const resolve = mount();
		fireEvent.click(screen.getAllByRole('radio')[1]);
		fireEvent.click(screen.getByRole('checkbox', { name: 'credential-5' }));
		expect([...send(resolve).keys()]).toEqual(['r1', 'r2', 'r3']);
	});

	it('requires every query when credential sets are absent', () => {
		const resolve = mount({
			r0: { ...matches.r0, requirements: [] },
			r1: { ...matches.r1, requirements: [] },
		});
		expect([...send(resolve).keys()]).toEqual(['r0', 'r1']);
	});

	it('puts optional choices in step one when there is one required combination', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r0'], available: true }] },
			{ setIndex: 1, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
		];
		const resolve = mount(withRequirements(sets));
		const optional = screen.getByRole('checkbox', { name: 'credential-5' });
		expect(screen.getByText('dcqlCredentials.step')).toBeInTheDocument();
		fireEvent.click(optional);
		review();
		expect(screen.queryByRole('checkbox', { name: 'credential-5' })).not.toBeInTheDocument();
		expect(screen.getByRole('checkbox', { name: 'dcqlCredentials.consentAria' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('checkbox', { name: 'dcqlCredentials.consentAria' }));
		fireEvent.click(screen.getByRole('button', { name: 'common.navItemSendCredentialsSimple' }));
		expect([...(resolve.mock.calls[0][0] as DcqlSelection).keys()]).toEqual(['r0', 'r3']);
	});

	it('shows only optional controls when there are no required sets', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: false, options: [{ optionIndex: 0, queryIds: ['r3'], available: true }] },
		];
		const resolve = mount(withRequirements(sets));
		expect(screen.queryByRole('radio')).not.toBeInTheDocument();
		expect(screen.queryByText('dcqlCredentials.noCombination')).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole('checkbox', { name: 'credential-5' }));
		expect([...send(resolve).keys()]).toEqual(['r3']);
	});

	it('skips step one when the only required combination has no optional choices', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r0'], available: true }] },
		];
		const resolve = mount(withRequirements(sets));
		expect(screen.queryByRole('button', { name: 'dcqlCredentials.reviewDetails' })).not.toBeInTheDocument();
		expect([...send(resolve).keys()]).toEqual(['r0']);
	});

	it('cannot send when a required query has no matching credential', () => {
		const sets: DcqlRequirement[] = [
			{ setIndex: 0, required: true, options: [{ optionIndex: 0, queryIds: ['r4'], available: true }] },
		];
		mount({ r4: { ...matches.r4, requirements: sets } });
		expect(screen.getByRole('button', { name: 'dcqlCredentials.reviewDetails' })).toBeDisabled();
	});

	it('starts with the newest matching credential and can switch to another', () => {
		const resolve = mount();
		review();
		fireEvent.click(screen.getByRole('button', { name: 'dcqlCredentials.chooseAnother' }));
		fireEvent.click(screen.getByRole('button', { name: /credential-1/ }));
		const selection = send(resolve);
		expect(selection.get('r0')?.[0]).toMatchObject({ batchId: 1, disclosedClaims: { preferred: 'value-1' } });
	});

	it('can add a second credential when the query allows multiple', () => {
		const resolve = mount();
		fireEvent.click(screen.getAllByRole('radio')[1]);
		review();
		fireEvent.click(screen.getByRole('button', { name: 'dcqlCredentials.chooseAnother' }));
		fireEvent.click(screen.getByRole('button', { name: 'dcqlCredentials.add' }));
		expect(
			send(resolve)
				.get('r2')
				?.map(({ batchId }) => batchId),
		).toEqual([4, 3]);
	});

	it('removes an added credential from its card header', () => {
		const resolve = mount();
		fireEvent.click(screen.getAllByRole('radio')[1]);
		review();
		fireEvent.click(screen.getByRole('button', { name: 'dcqlCredentials.chooseAnother' }));
		fireEvent.click(screen.getByRole('button', { name: 'dcqlCredentials.add' }));
		const removeButtons = screen.getAllByRole('button', { name: 'dcqlCredentials.removeCredential' });
		expect(removeButtons).toHaveLength(2);
		expect(removeButtons[0].parentElement?.querySelector('h3')).toBeInTheDocument();
		fireEvent.click(removeButtons[0]);
		expect(screen.queryByRole('button', { name: 'dcqlCredentials.removeCredential' })).not.toBeInTheDocument();
		expect(
			send(resolve)
				.get('r2')
				?.map(({ batchId }) => batchId),
		).toEqual([3]);
	});
});
