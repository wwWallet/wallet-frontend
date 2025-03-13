import { assert, describe, it } from "vitest";
import { OpenID4VCICredentialRendering } from "./openID4VCICredentialRendering";
import { HttpClient } from "../interfaces";
import axios, { AxiosHeaders } from "axios";
import path from "path";
import fs from "fs";

const mimeToExt = {
	"image/png": ".png",
	"image/jpeg": ".jpg",
	"image/gif": ".gif",
	"image/svg+xml": ".svg",
	"image/webp": ".webp",
	"image/bmp": ".bmp",
	"image/x-icon": ".ico",
	"image/tiff": ".tiff",
	"image/heif": ".heif"
};

function convertDataUriToImage(dataUri, outputFileName = "output-image") {
	const matches = dataUri.match(/^data:([a-zA-Z+\/]+);(?:charset=utf-8;)?(base64,|utf8,|utf-8,)?(.+)$/);

	if (!matches) {
		throw new Error("Invalid Data URI");
	}

	const mimeType = matches[1]; // Extract MIME type
	const encoding = matches[2]; // "base64" or "charset=utf-8"
	const data = matches[3];     // Image data

	// Get the file extension based on MIME type
	const fileExtension = mimeToExt[mimeType] || ".bin"; // Default to .bin if unknown

	let buffer;
	if (encoding === "base64") {
		buffer = Buffer.from(data, "base64");
	} else {
		buffer = Buffer.from(decodeURIComponent(data), "utf-8");
	}

	const outputPath = `${outputFileName}${fileExtension}`;
	fs.writeFileSync(outputPath, buffer);
}


const httpClient: HttpClient = {
	async get(url, headers, opts) {
		return axios.get(url, { ...opts, headers: headers as any }).then((res) => (res?.data ? { status: res.status, data: res.data, headers: res.headers } : {})).catch((err) => (err?.response?.data ? { ...err.response.data } : {}));

	},
	async post(url, data, headers, opts) {
		return axios.post(url, data, { ...opts, headers: headers as any }).then((res) => (res?.data ? { status: res.status, data: res.data, headers: res.headers } : {})).catch((err) => (err?.response?.data ? { ...err.response.data } : {}));
	},
}


describe("The openID4VCICredentialRendering", () => {

	it("can render credential in svg format", async () => {
		const renderer = OpenID4VCICredentialRendering({ httpClient });

		const result = await renderer.renderCustomSvgTemplate({
			signedClaims: {
				"family_name": "Doe",
				"given_name": "John",
				"birth_date": "1990-10-15",
				"issuing_authority": "PID:00001",
				"issuing_country": "GR",
				"document_number": "12313213",
				"issuance_date": "2025-03-02",
				"expiry_date": "2035-04-21",
				"age_over_21": true
			},
			displayConfig: {
				"name": "PID - MDOC",
				"description": "Person Identification Data (PID) VC in mso_mdoc format",
				"background_image": {
					"uri": "https://issuer.wwwallet.org/images/background-image.png"
				},
				"background_color": "#4CC3DD",
				"text_color": "#FFFFFF",
				"locale": "en-US"
			}
		});

		assert(result != null);
		assert(typeof result === 'string');
		convertDataUriToImage(result, path.join(__dirname, "../../output/openID4VCIRenderingResult"));
	});
})
