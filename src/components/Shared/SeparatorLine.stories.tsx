import type { Meta, StoryObj } from '@storybook/react';
import SeparatorLine from './SeparatorLine';

const meta = {
	title: 'Components/SeparatorLine',
	component: SeparatorLine,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'A horizontal rule that can wrap centered content — used to separate sections such as ' +
					'the "or" between login options.',
			},
		},
	},
	args: {
		children: undefined,
	},
} satisfies Meta<typeof SeparatorLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Plain: Story = {};

export const WithLabel: Story = {
	render: () => (
		<div className="max-w-md">
			<SeparatorLine>
				<span className="text-sm text-lm-gray-700 dark:text-dm-gray-300">or</span>
			</SeparatorLine>
		</div>
	),
};
