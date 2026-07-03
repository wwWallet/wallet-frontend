import type { Meta, StoryObj } from '@storybook/react';
import { Bell } from 'lucide-react';
import CounterBadge from './CounterBadge';

const meta = {
	title: 'Components/CounterBadge',
	component: CounterBadge,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'A small pill used for pending counts (e.g. on navigation items). ' +
					'Hides itself when the count is 0 and caps large numbers with `max` (e.g. 99+).',
			},
		},
	},
	argTypes: {
		count: { control: { type: 'number' } },
		max: { control: { type: 'number' } },
		active: { control: 'boolean' },
		position: {
			control: 'inline-radio',
			options: ['inline', 'top-right', 'top-left'],
		},
	},
	args: {
		count: 3,
		max: 99,
		position: 'inline',
		title: undefined,
	},
} satisfies Meta<typeof CounterBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Numbers above `max` are truncated. */
export const Capped: Story = {
	args: { count: 128, max: 99 },
};

/** A count of 0 renders nothing at all. */
export const Hidden: Story = {
	args: { count: 0 },
};

/** Positioned over a host element, as used on the bottom navigation. */
export const OverIcon: Story = {
	render: (args) => (
		<div className="relative inline-flex p-3 rounded-lg bg-lm-gray-200 dark:bg-dm-gray-800">
			<Bell className="text-lm-gray-900 dark:text-white" />
			<CounterBadge {...args} />
		</div>
	),
	args: { count: 5, position: 'top-right' },
};
