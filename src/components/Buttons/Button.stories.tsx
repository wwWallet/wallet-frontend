import type { Meta, StoryObj } from '@storybook/react';
import { Trash2, Download, ArrowRight } from 'lucide-react';
import Button from './Button';

const meta = {
	title: 'Components/Button',
	component: Button,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'The shared wallet button. Variants map to semantic roles (primary action, ' +
					'destructive, link, …) and pick up brand/theme colors automatically in light and dark mode.',
			},
		},
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['primary', 'secondary', 'delete', 'outline', 'invisible', 'link', 'default'],
		},
		size: {
			control: 'select',
			options: ['sm', 'md', 'lg', 'xl', '2xl'],
		},
		textSize: {
			control: 'inline-radio',
			options: ['sm', 'md', 'lg'],
		},
		square: { control: 'boolean' },
		disabled: { control: 'boolean' },
		children: { control: 'text' },
		onClick: { action: 'clicked' },
	},
	args: {
		children: 'Button',
		variant: 'primary',
		size: 'md',
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
	args: { variant: 'primary', children: 'Continue' },
};

export const Secondary: Story = {
	args: { variant: 'secondary', children: 'Add credential' },
};

export const Delete: Story = {
	args: {
		variant: 'delete',
		children: (
			<>
				<Trash2 size={16} /> Delete
			</>
		),
	},
};

export const Outline: Story = {
	args: { variant: 'outline', children: 'Cancel' },
};

export const Link: Story = {
	args: { variant: 'link', children: 'Learn more' },
};

export const Disabled: Story = {
	args: { variant: 'primary', children: 'Continue', disabled: true },
};

export const WithIcon: Story = {
	args: {
		variant: 'primary',
		children: (
			<>
				<Download size={16} /> Download
			</>
		),
	},
};

/** Every variant side by side. */
export const AllVariants: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-3">
			<Button variant="primary">Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="delete">
				<Trash2 size={16} /> Delete
			</Button>
			<Button variant="outline">Outline</Button>
			<Button variant="invisible">Invisible</Button>
			<Button variant="default">Default</Button>
			<Button variant="link">Link</Button>
		</div>
	),
};

/** Every size for the primary variant. */
export const AllSizes: Story = {
	render: () => (
		<div className="flex flex-wrap items-center gap-3">
			<Button variant="primary" size="sm">Small</Button>
			<Button variant="primary" size="md">Medium</Button>
			<Button variant="primary" size="lg">Large</Button>
			<Button variant="primary" size="xl">XL</Button>
			<Button variant="primary" size="2xl">2XL</Button>
		</div>
	),
};

/** Square buttons are handy for icon-only actions. */
export const SquareIcon: Story = {
	args: {
		variant: 'primary',
		square: true,
		ariaLabel: 'Next',
		children: <ArrowRight size={18} />,
	},
};
