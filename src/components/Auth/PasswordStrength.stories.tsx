import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import PasswordStrength from './PasswordStrength';

const meta = {
	title: 'Components/PasswordStrength',
	component: PasswordStrength,
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component:
					'A strength meter shown under the password field during signup. Each of length ≥ 8, ' +
					'an uppercase letter, a digit and a special character adds 25%. Color shifts ' +
					'red → yellow → green as the score climbs.',
			},
		},
	},
	argTypes: {
		label: { control: 'text' },
		password: { control: 'text' },
	},
	args: {
		label: 'Strength:',
		password: 'abcdef',
	},
} satisfies Meta<typeof PasswordStrength>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Weak: Story = {
	args: { password: 'abc' },
};

export const Medium: Story = {
	args: { password: 'abcdefgH' },
};

export const Strong: Story = {
	args: { password: 'Abcdef1!' },
};

const InteractiveDemo = ({ label }: { label: ReactNode }) => {
	const [password, setPassword] = useState('');
	return (
		<div className="max-w-sm space-y-2">
			<input
				type="text"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="Type a password…"
				className="w-full px-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-400 dark:border-dm-gray-600 dark:text-white rounded-lg"
			/>
			<PasswordStrength label={label} password={password} />
		</div>
	);
};

/** Type in the field to watch the meter react live. */
export const Interactive: Story = {
	render: (args) => <InteractiveDemo label={args.label} />,
};
