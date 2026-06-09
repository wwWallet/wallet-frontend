"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomCredentialSvg = CustomCredentialSvg;
const escapeSVG_1 = require("../utils/escapeSVG");
const formatDate_1 = require("./formatDate");
function CustomCredentialSvg(args) {
    const defaultBackgroundColor = "#D3D3D3";
    const defaultTextColor = "#000000";
    const defaultName = "Credential";
    const svgTemplate = `<svg
			xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="829"
			height="504" version="1.1">
			<rect width="100%" height="100%" fill="{{backgroundColor}}" />
			{{backgroundImageBase64}}
			{{logoBase64}}
			<text x="50" y="80" font-family="Arial, Helvetica, sans-serif" font-size="35" fill="{{textColor}}" font-weight="normal">{{name}}</text>
			<text x="50" y="120" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="{{textColor}}" font-weight="normal">{{description}}</text>
			<text x="790" y="431" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="{{textColor}}" font-weight="normal">{{expiry_date}}</text>
		</svg>`;
    function formatExpiryDate(signedClaims) {
        if (signedClaims.expiry_date) {
            return (0, formatDate_1.formatDate)(signedClaims.expiry_date, 'date');
        }
        else if (signedClaims.exp != null) {
            const expiryDateISO = new Date(Number(signedClaims.exp) * 1000).toISOString();
            return (0, formatDate_1.formatDate)(expiryDateISO, 'date');
        }
        else {
            return "";
        }
    }
    async function getBase64Image(url) {
        if (!url)
            return null;
        try {
            const isBrowser = typeof window !== "undefined";
            if (isBrowser) {
                // Frontend: Use FileReader with Fetch API
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            }
            else {
                // Backend (Node.js): Use Axios or Fetch with Buffer
                const response = await args.httpClient.get(url, {}, { responseType: 'arraybuffer', useCache: true });
                const blob = response.data;
                const base64 = Buffer.from(blob, "binary").toString("base64");
                const mimeType = response.headers["content-type"]; // Get MIME type
                return `data:${mimeType};base64,${base64}`;
            }
        }
        catch (error) {
            console.error("Failed to load image", url, error);
            return null;
        }
    }
    const renderCustomSvgTemplate = async ({ signedClaims, displayConfig }) => {
        const name = displayConfig?.name ? (0, escapeSVG_1.escapeSVG)(displayConfig?.name) : defaultName;
        const description = displayConfig?.description ? (0, escapeSVG_1.escapeSVG)(displayConfig?.description) : "";
        const backgroundColor = displayConfig.background_color || defaultBackgroundColor;
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
            .replace(/{{backgroundImageBase64}}/g, backgroundImageBase64
            ? `<image xlink:href="${backgroundImageBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />`
            : '')
            .replace(/{{logoBase64}}/g, logoBase64
            ? `<image xlink:href="${logoBase64}" x="50" y="380" height="20%"><title>${displayConfig.logoAltText || 'Logo'}</title></image>`
            : '')
            .replace(/{{name}}/g, name)
            .replace(/{{textColor}}/g, textColor)
            .replace(/{{description}}/g, description)
            .replace(/{{expiry_date}}/g, expiryDate ? `Expiry Date: ${expiryDate}` : '');
        const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(replacedSvgText)}`;
        return dataUri;
    };
    return {
        renderCustomSvgTemplate,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3VzdG9tQ3JlZGVudGlhbFN2Zy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mdW5jdGlvbnMvQ3VzdG9tQ3JlZGVudGlhbFN2Zy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLGtEQXNHQztBQXpHRCxrREFBK0M7QUFDL0MsNkNBQTBDO0FBRTFDLFNBQWdCLG1CQUFtQixDQUFDLElBQWdDO0lBRW5FLE1BQU0sc0JBQXNCLEdBQUcsU0FBUyxDQUFDO0lBQ3pDLE1BQU0sZ0JBQWdCLEdBQUcsU0FBUyxDQUFDO0lBQ25DLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQztJQUNqQyxNQUFNLFdBQVcsR0FDaEI7Ozs7Ozs7OztTQVNPLENBQUE7SUFHUixTQUFTLGdCQUFnQixDQUFDLFlBQThCO1FBQ3ZELElBQUksWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlCLE9BQU8sSUFBQSx1QkFBVSxFQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckQsQ0FBQzthQUFNLElBQUksWUFBWSxDQUFDLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNyQyxNQUFNLGFBQWEsR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlFLE9BQU8sSUFBQSx1QkFBVSxFQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxDQUFDO2FBQU0sQ0FBQztZQUNQLE9BQU8sRUFBRSxDQUFDO1FBQ1gsQ0FBQztJQUNGLENBQUM7SUFHRCxLQUFLLFVBQVUsY0FBYyxDQUFDLEdBQVc7UUFDeEMsSUFBSSxDQUFDLEdBQUc7WUFBRSxPQUFPLElBQUksQ0FBQztRQUV0QixJQUFJLENBQUM7WUFDSixNQUFNLFNBQVMsR0FBRyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUM7WUFFaEQsSUFBSSxTQUFTLEVBQUUsQ0FB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