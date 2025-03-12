import { HttpClient, OpenID4VCICredentialRendering } from "../interfaces";
import { CredentialClaims } from "../types";
import { escapeSVG } from "../utils/escapeSVG";
import { formatDate } from "./formatDate";

export function OpenID4VCICredentialRendering(args: { httpClient: HttpClient }): OpenID4VCICredentialRendering {

	const defaultBackgroundColor = "#D3D3D3";
	const defaultTextColor = "#000000";
	const defaultName = "Credential";
	const svgTemplate =
		`<svg
			xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="829"
			height="504" version="1.1">
			<rect width="100%" height="100%" fill="{{backgroundColor}}" />
			{{backgroundImageBase64}}
			{{logoBase64}}
			<text x="50" y="80" font-family="Arial, Helvetica, sans-serif" font-size="35" fill="{{textColor}}" font-weight="normal">{{name}}</text>
			<text x="50" y="120" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="{{textColor}}" font-weight="normal">{{description}}</text>
			<text x="790" y="431" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="{{textColor}}" font-weight="normal">{{expiry_date}}</text>
		</svg>`


	function formatExpiryDate(signedClaims: CredentialClaims): string {
		if (signedClaims.expiry_date) {
			return formatDate(signedClaims.expiry_date, 'date');
		} else if (signedClaims.exp != null) {
			const expiryDateISO = new Date(Number(signedClaims.exp) * 1000).toISOString();
			return formatDate(expiryDateISO, 'date');
		} else {
			return "";
		}
	}


	async function getBase64Image(url: string) {
		if (!url) return null;

		try {
			const isBrowser = typeof window !== "undefined";

			if (isBrowser) {
				// Frontend: Use FileReader with Fetch API
				const response = await fetch(url);
				const blob = await response.blob();

				return new Promise<string | null>((resolve, reject) => {
					const reader = new FileReader();
					reader.onloadend = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				});
			} else {
				// Backend (Node.js): Use Axios or Fetch with Buffer
				const response = await args.httpClient.get(url, {}, { responseType: 'arraybuffer' })
				const blob = response.data as any;
				const base64 = Buffer.from(blob, "binary").toString("base64");
				const mimeType = response.headers["content-type"]; // Get MIME type
				return `data:${mimeType};base64,${base64}`;
			}
		} catch (error) {
			console.error("Failed to load image", url, error);
			return null;
		}
	}


	const renderCustomSvgTemplate = async ({ signedClaims, displayConfig }: { signedClaims: CredentialClaims, displayConfig: any }) => {
		const name =  displayConfig?.name ? escapeSVG(displayConfig?.name) : defaultName;
		const description = displayConfig?.description ? escapeSVG(displayConfig?.description) : "";
		const backgroundColor = displayConfig.backgroundColor || defaultBackgroundColor;
		const textColor = displayConfig.text_color || defaultTextColor;
		const backgroundImageBase64 = displayConfig?.background_image?.uri ?
			displayConfig?.background_image?.uri?.startsWith("data:") ?
				displayConfig?.background_image.uri
				: await getBase64Image(displayConfig?.background_image?.uri)
			: '';

		const logoBase64 = displayConfig?.logo?.uri ? await getBase64Image(displayConfig.logo.uri) : '';
		const expiryDate = formatExpiryDate(signedClaims);

		const replacedSvgText = svgTemplate
			.replace(/{{backgroundColor}}/g, backgroundColor)
			.replace(
				/{{backgroundImageBase64}}/g,
				backgroundImageBase64
					? `<image xlink:href="${backgroundImageBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />`
					: ''
			)
			.replace(
				/{{logoBase64}}/g,
				logoBase64
					? `<image xlink:href="${logoBase64}" x="50" y="380" height="20%"><title>${displayConfig.logoAltText || 'Logo'}</title></image>`
					: ''
			)
			.replace(/{{name}}/g, name)
			.replace(/{{textColor}}/g, textColor)
			.replace(/{{description}}/g, description)
			.replace(/{{expiry_date}}/g, expiryDate ? `Expiry Date: ${expiryDate}` : '');

		const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(replacedSvgText)}`;
		return dataUri;
	};

	return {
		renderCustomSvgTemplate,
	}
}
