import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render } from '@testing-library/react';

import React from 'react';
import QRCodeScanner from './QRCodeScanner';

function mockGetUserMedia({ error }) {
	let promise;

	if (error) {
		promise = Promise.reject(error);
	} else {
		promise = Promise.resolve({
			active: true,
			id: 'test-id',
			getTracks: () => new Array(),
			getVideoTracks: () => [
				{
					getCapabilities: () => ({ facingMode: 'environment' }),
					stop: () => {}
				}
			]
		});
	}

	return () => promise;
}

describe('QR Code Scanner', () => {
	let MEDIA_DEVICES;
	vi.mock('qr-scanner', () => {
		return {
			default: {
				start: () => {},
				stop: () => {},
				destroy: () => {}
			}
		}
	});

	beforeAll(() => {
		MEDIA_DEVICES = global.navigator.mediaDevices;
	});

	afterAll(() => {
		global.navigator.mediaDevices = MEDIA_DEVICES;
	});

	it("show camera warning when no permission to access camera devices", () => {
		global.navigator.mediaDevices = { getUserMedia: mockGetUserMedia({ error: 'Rejected access' }) };
		const renderResult = render(<QRCodeScanner></QRCodeScanner>);

		const elem = renderResult.queryByText('qrCodeScanner.cameraPermissionAllow');
		expect(elem).not.toBeNull();
		renderResult.unmount();
	});

	it("needs to be possible to shoot QR Code when having at least one valid webcam", async () => {
		global.navigator.mediaDevices = {
			getUserMedia: mockGetUserMedia({}),
			enumerateDevices: () =>  Promise.resolve([{
				deviceId: '2',
				kind: 'videoinput',
				label: 'back-camera'
			}])
		};
		const renderResult = render(<QRCodeScanner></QRCodeScanner>);
		await new Promise(resolve => setTimeout(resolve));

		const elem = renderResult.queryByText('qrCodeScanner.description');
		expect(elem).not.toBeNull();
		renderResult.unmount();
	});
});