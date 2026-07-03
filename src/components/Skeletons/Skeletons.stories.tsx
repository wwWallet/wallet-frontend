import type { Meta, StoryObj } from '@storybook/react';
import CredentialCardSkeleton from './CredentialCardSkeleton';
import CredentialInfoSkeleton from './CredentialInfoSkeleton';

/**
 * Loading placeholders shown while credential data is being fetched.
 */
const meta = {
	title: 'Components/Skeletons',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: 'Animated `animate-pulse` placeholders used while credentials load.',
			},
		},
	},
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {
	render: () => (
		<div className="w-80">
			<CredentialCardSkeleton />
		</div>
	),
};

export const InfoRows: Story = {
	render: () => (
		<div className="max-w-lg">
			<CredentialInfoSkeleton rowCount={5} />
		</div>
	),
};

export const CardGrid: Story = {
	render: () => (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{Array.from({ length: 3 }).map((_, i) => (
				<CredentialCardSkeleton key={i} />
			))}
		</div>
	),
};
