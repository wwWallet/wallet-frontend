/* Based on https://github.com/nimiq/qr-scanner */
/* Original License: */
/*
MIT License

Copyright (c) 2017 Nimiq, danimoh

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/* eslint-env worker */
// @ts-ignore jsqr-es6 does not provide types currently
import jsQR from "jsqr-es6";

type GrayscaleWeights = {
	red: number;
	green: number;
	blue: number;
	useIntegerApproximation: boolean;
};

let inversionAttempts: "dontInvert" | "onlyInvert" | "attemptBoth" =
	"dontInvert";
let grayscaleWeights: GrayscaleWeights = {
	// weights for quick luma integer approximation (https://en.wikipedia.org/wiki/YUV#Full_swing_for_BT.601)
	red: 77,
	green: 150,
	blue: 29,
	useIntegerApproximation: true,
};

const ctx = globalThis as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (event) => {
	const id = event["data"]["id"];
	const type = event["data"]["type"];
	const data = event["data"]["data"];

	switch (type) {
		case "decode":
			decode(data, id);
			break;
		case "grayscaleWeights":
			setGrayscaleWeights(data);
			break;
		case "inversionMode":
			setInversionMode(data);
			break;
		case "close":
			// close after earlier messages in the event loop finished processing
			ctx.close();
			break;
	}
};

function decode(
	data: { data: Uint8ClampedArray; width: number; height: number },
	requestId: number,
): void {
	const rgbaData = data["data"];
	const width = data["width"];
	const height = data["height"];
	const result = jsQR(rgbaData, width, height, {
		inversionAttempts: inversionAttempts,
		greyScaleWeights: grayscaleWeights,
	});
	if (!result) {
		ctx.postMessage({
			id: requestId,
			type: "qrResult",
			data: null,
		});
		return;
	}

	ctx.postMessage({
		id: requestId,
		type: "qrResult",
		data: result.data,
		// equivalent to cornerPoints of native BarcodeDetector
		cornerPoints: [
			result.location.topLeftCorner,
			result.location.topRightCorner,
			result.location.bottomRightCorner,
			result.location.bottomLeftCorner,
		],
	});
}

function setGrayscaleWeights(data: GrayscaleWeights) {
	// update grayscaleWeights in a closure compiler compatible fashion
	grayscaleWeights.red = data["red"];
	grayscaleWeights.green = data["green"];
	grayscaleWeights.blue = data["blue"];
	grayscaleWeights.useIntegerApproximation = data["useIntegerApproximation"];
}

function setInversionMode(inversionMode: "original" | "invert" | "both") {
	switch (inversionMode) {
		case "original":
			inversionAttempts = "dontInvert";
			break;
		case "invert":
			inversionAttempts = "onlyInvert";
			break;
		case "both":
			inversionAttempts = "attemptBoth";
			break;
		default:
			throw new Error("Invalid inversion mode");
	}
}
