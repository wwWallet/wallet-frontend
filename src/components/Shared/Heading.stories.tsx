import type { Meta, StoryObj } from '@storybook/react';
import { H1, H2, H3 } from './Heading';
import Button from '../Buttons/Button';

const meta = {
	title: 'Components/Heading',
	component: H2,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'Page and section headings. `H2`/`H3` render an optional separator rule and accept ' +
					'trailing children (e.g. an action button) aligned to the end of the row.',
			},
		},
	},
	args: {
		heading: 'Section title',
	},
} satisfies Meta<typeof H2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Level2: Story = {
	args: { heading: 'Credentials' },
};

export const Level2WithAction: Story = {
	render: (args) => (
		<H2 {...args}>
			<Button variant="primary" size="sm">Add</Button>
		</H2>
	),
	args: { heading: 'Credentials' },
};

export const Level3NoRule: Story = {
	render: () => <H3 heading="Details" hr={false} />,
};

/** All heading levels together. */
export const Scale: Story = {
	render: () => (
		<div className="space-y-4">
			<H1 heading="Page title (H1)" />
			<H2 heading="Section title (H2)" />
			<H3 heading="Subsection title (H3)" />
		</div>
	),
};
