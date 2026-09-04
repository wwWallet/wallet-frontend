import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { highlightBestSequence } from './highlightBestSequence';

describe('highlightBestSequence', () => {
	it('treats regex special characters as literal search text', () => {
		render(<>{highlightBestSequence('Portal [preview]', '[')}</>);

		expect(screen.getByText('[').classList.contains('font-bold')).toBe(true);
	});
});
