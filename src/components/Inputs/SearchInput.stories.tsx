import type { Meta, StoryObj } from '@storybook/react';
import SearchInput from './SearchInput';

const meta = {
	title: 'Components/SearchInput',
	component: SearchInput,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Text field used to filter lists (credentials, history, …). Calls `searchCallback` ' +
					'on every keystroke with the current query.',
			},
		},
	},
	argTypes: {
		placeholder: { control: 'text' },
		searchCallback: { action: 'search' },
	},
	args: {
		placeholder: 'Search credentials…',
		searchCallback: () => {},
	},
	decorators: [
		(Story) => (
			<div className="max-w-md">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SearchInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
