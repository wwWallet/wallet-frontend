import React from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useApi } from './index';

const wrapper = ({ children }: React.PropsWithChildren) => <MemoryRouter>{children}</MemoryRouter>;

describe('useApi.clearSession', () => {
	beforeEach(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();
	});

	afterEach(cleanup);

	it('preserves the private-data ETag only when requested', () => {
		window.localStorage.setItem('privateDataEtag', JSON.stringify('etag-1'));
		const { result } = renderHook(() => useApi(), { wrapper });

		act(() => result.current.clearSession({ preservePrivateDataEtag: true }));
		expect(window.localStorage.getItem('privateDataEtag')).toBe(JSON.stringify('etag-1'));

		act(() => result.current.clearSession());
		expect(window.localStorage.getItem('privateDataEtag')).toBeNull();
	});
});
