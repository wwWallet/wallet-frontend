import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import QRScanner from './QRCodeScanner';

const scanner = vi.hoisted(() => ({ decode: null as null | ((result: { data: string }) => void) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('../../hooks/useScreenType', () => ({ default: () => 'desktop' }));
vi.mock('../Popups/PopupLayout', () => ({
	default: ({ children, loading }: { children: React.ReactNode; loading: boolean }) =>
		loading ? null : <div>{children}</div>,
}));
vi.mock('react-webcam', () => ({
	default: React.forwardRef(function FakeWebcam({ onUserMedia }: { onUserMedia: () => void }, ref) {
		React.useImperativeHandle(ref, () => ({ video: document.createElement('video') }), []);
		React.useEffect(() => {
			onUserMedia();
		}, [onUserMedia]);
		return <div>Preview</div>;
	}),
}));
vi.mock('../../utils/qr/qr-scanner', () => ({
	default: class {
		$video: HTMLVideoElement;
		constructor(video: HTMLVideoElement, decode: typeof scanner.decode) {
			this.$video = video;
			scanner.decode = decode;
		}
		start() {
			return Promise.resolve();
		}
		destroy() {}
	},
}));
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

it('keeps scanning after an invalid code and accepts only the first valid code', async () => {
	const track = {
		stop: vi.fn(),
		getCapabilities: () => ({ facingMode: ['environment'], width: { max: 640 }, height: { max: 480 } }),
	};
	Object.defineProperty(navigator, 'mediaDevices', {
		configurable: true,
		value: {
			getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track], getVideoTracks: () => [track] }),
			enumerateDevices: vi.fn().mockResolvedValue([{ kind: 'videoinput', deviceId: 'camera' }]),
		},
	});
	render(<QRScanner onClose={vi.fn()} />);
	await screen.findByText('Preview');
	vi.useFakeTimers();
	act(() => scanner.decode?.({ data: 'https://example.com' }));
	expect(screen.queryByRole('alert')).toBeNull();
	expect(vi.getTimerCount()).toBe(0);
	act(() => {
		scanner.decode?.({ data: 'openid4vp://?client_id=wallet&request_uri=https://example.com/request?token=abc' });
		scanner.decode?.({ data: 'openid-credential-offer://?credential_offer_uri=https://example.com/other' });
	});
	expect(screen.queryByRole('alert')).toBeNull();
	expect(vi.getTimerCount()).toBe(1);
	cleanup();
	expect(vi.getTimerCount()).toBe(1);
	vi.clearAllTimers();
});
