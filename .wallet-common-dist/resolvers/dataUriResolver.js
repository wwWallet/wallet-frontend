"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataUriResolver = dataUriResolver;
const matchLocalizedDisplay_1 = require("../utils/matchLocalizedDisplay");
function dataUriResolver({ customRenderer, signedClaims = {}, credentialDisplayArray, issuerDisplayArray, httpClient, sdJwtVcRenderer, sdJwtVcMetadataClaims, fallbackName = "Verifiable Credential", }) {
    return async (filter, preferredLangs = ["en-US"]) => {
        try {
            // Localize display configs
            const credentialDisplayLocalized = (0, matchLocalizedDisplay_1.matchDisplayByLocale)(credentialDisplayArray, preferredLangs);
            const issuerDisplayLocalized = (0, matchLocalizedDisplay_1.matchDisplayByLocale)(issuerDisplayArray, preferredLangs);
            const svgTemplateUri = credentialDisplayLocalized?.rendering?.svg_templates?.[0]
                ?.uri || null;
            const simpleDisplayConfig = credentialDisplayLocalized?.rendering?.simple || null;
            // 1. Try SVG template rendering (SD-JWT VC)
            if (svgTemplateUri && sdJwtVcRenderer) {
                let credentialImageSvgTemplate;
                if (svgTemplateUri.startsWith('data:')) {
                    const res = await fetch(svgTemplateUri);
                    const blob = await res.blob();
                    if (blob.type === 'image/svg+xml') {
                        const text = await blob.text();
                        if (text && text !== '') {
                            credentialImageSvgTemplate = text;
                        }
                    }
                    else {
                        console.warn(`Unsupported SVG template data URI type: ${blob.type}`);
                    }
                }
                else if (svgTemplateUri.startsWith('http')) {
                    const svgResponse = await httpClient
                        .get(svgTemplateUri, {}, { useCache: true })
                        .catch(() => null);
                    if (svgResponse) {
                        credentialImageSvgTemplate = svgResponse.data;
                    }
                }
                if (credentialImageSvgTemplate) {
                    const rendered = await sdJwtVcRenderer
                        .renderSvgTemplate({
                        json: signedClaims,
                        credentialImageSvgTemplate,
                        sdJwtVcMetadataClaims,
                        filter,
                    })
                        .catch(() => null);
                    if (rendered)
                        return rendered;
                }
            }
            // 2. "simple" rendering from credential display (SD-JWT VC)
            if (simpleDisplayConfig && credentialDisplayLocalized) {
                const rendered = await customRenderer
                    .renderCustomSvgTemplate({
                    signedClaims,
                    displayConfig: {
                        ...credentialDisplayLocalized,
                        ...simpleDisplayConfig,
                    },
                })
                    .catch(() => null);
                if (rendered)
                    return rendered;
            }
            // 3. Fallback: render from issuer display
            if (issuerDisplayLocalized) {
                const rendered = await customRenderer
                    .renderCustomSvgTemplate({
                    signedClaims,
                    displayConfig: issuerDisplayLocalized,
                })
                    .catch(() => null);
                if (rendered)
                    return rendered;
            }
            // 4. Final fallback
            return await customRenderer
                .renderCustomSvgTemplate({
                signedClaims,
                displayConfig: { name: fallbackName },
            })
                .catch(() => null);
        }
        catch {
            return null;
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YVVyaVJlc29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3Jlc29sdmVycy9kYXRhVXJpUmVzb2x2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUEwQkEsMENBOEdDO0FBdElELDBFQUFzRTtBQXdCdEUsU0FBZ0IsZUFBZSxDQUFDLEVBQy9CLGNBQWMsRUFDZCxZQUFZLEdBQUcsRUFBRSxFQUNqQixzQkFBc0IsRUFDdEIsa0JBQWtCLEVBQ2xCLFVBQVUsRUFDVixlQUFlLEVBQ2YscUJBQXFCLEVBQ3JCLFlBQVksR0FBRyx1QkFBdUIsR0FDZDtJQUN4QixPQUFPLEtBQUssRUFDWCxNQUFtQyxFQUNuQyxpQkFBMkIsQ0FBQyxPQUFPLENBQUMsRUFDbkMsRUFBRTtRQUNILElBQUksQ0FBQztZQUNKLDJCQUEyQjtZQUMzQixNQUFNLDBCQUEwQixHQUFHLElBQUEsNENBQW9CLEVBQ3RELHNCQUFzQixFQUN0QixjQUFjLENBQ2QsQ0FBQztZQUNGLE1BQU0sc0JBQXNCLEdBQUcsSUFBQSw0Q0FBb0IsRUFDbEQsa0JBQWtCLEVBQ2xCLGNBQWMsQ0FDZCxDQUFDO1lBRUYsTUFBTSxjQUFjLEdBQ25CLDBCQUEwQixFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hELEVBQUUsR0FBRyxJQUFJLElBQUksQ0FBQztZQUNoQixNQUFNLG1CQUFtQixHQUN4QiwwQkFBMEIsRUFBRSxTQUFTLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQztZQUV2RCw0Q0FBNEM7WUFDNUMsSUFBSSxjQUFjLElBQUksZUFBZSxFQUFFLENBQUM7Z0JBQ3ZDLElBQUksMEJBQThDLENBQUM7Z0JBRW5ELElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUN4QyxNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztvQkFDeEMsTUFBTSxJQUFJLEdBQUcsTUFB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