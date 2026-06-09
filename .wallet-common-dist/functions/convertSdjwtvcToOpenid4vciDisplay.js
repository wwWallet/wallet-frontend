"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSdjwtvcToOpenid4vciDisplay = convertSdjwtvcToOpenid4vciDisplay;
/**
 * Convert SD-JWT VC TypeMetadata.display -> OpenID4VCI CredentialConfigurationSupported.display
 *
 * Notes:
 * - svg_templates are intentionally ignored
 * - We map:
 *   - name -> name
 *   - description -> description
 *   - rendering.simple.background_color -> background_color
 *   - rendering.simple.text_color -> text_color
 *   - rendering.simple.background_image.uri -> background_image.uri
 *   - rendering.simple.logo -> logo
 *   - locale -> locale
 *
 */
function convertSdjwtvcToOpenid4vciDisplay(display) {
    if (!display?.length)
        return undefined;
    const byLocale = new Map();
    for (const d of display) {
        const simple = d.rendering?.simple;
        const candidate = {
            name: d.name,
            description: d.description,
            locale: d.locale,
            background_color: simple?.background_color,
            text_color: simple?.text_color,
            ...(simple?.background_image?.uri
                ? { background_image: { uri: simple.background_image.uri } }
                : {}),
            ...(simple?.logo?.uri
                ? {
                    logo: {
                        uri: simple.logo.uri,
                        alt_text: simple.logo.alt_text,
                    },
                }
                : {}),
        };
        // remove undefined keys (keeps output tidy)
        for (const key of Object.keys(candidate)) {
            if (candidate[key] === undefined)
                delete candidate[key];
        }
        const existing = byLocale.get(d.locale);
        if (!existing) {
            byLocale.set(d.locale, candidate);
            continue;
        }
    }
    return Array.from(byLocale.values());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydFNkand0dmNUb09wZW5pZDR2Y2lEaXNwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Z1bmN0aW9ucy9jb252ZXJ0U2Rqd3R2Y1RvT3BlbmlkNHZjaURpc3BsYXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUF1QkEsOEVBNkNDO0FBN0REOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBRUgsU0FBZ0IsaUNBQWlDLENBQ2hELE9BQTRCO0lBRTVCLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTTtRQUFFLE9BQU8sU0FBUyxDQUFDO0lBRXZDLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxFQUE4QixDQUFDO0lBRXZELEtBQUssTUFBTSxDQUFDLElBQUksT0FBTyxFQUFFLENBQUM7UUFDekIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUM7UUFFbkMsTUFBTSxTQUFTLEdBQXVCO1lBQ3JDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSTtZQUNaLFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBVztZQUMxQixNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU07WUFFaEIsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLGdCQUFnQjtZQUMxQyxVQUFVLEVBQUUsTUFBTSxFQUFFLFVBQVU7WUFFOUIsR0FBRyxDQUFDLE1BQU0sRUFBRSxnQkFBZ0IsRUFBRSxHQUFHO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzVELENBQUMsQ0FBQyxFQUFFLENBQUM7WUFFTixHQUFHLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHO2dCQUNwQixDQUFDLENBQUM7b0JBQ0QsSUFBSSxFQUFFO3dCQUNMLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUc7d0JBQ3BCLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVE7cUJBQzlCO2lCQUNEO2dCQUNELENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDTixDQUFDO1FBRUYsNENBQTRDO1FBQzVDLEtBQUssTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQWlDLEVBQUUsQ0FBQztZQUMxRSxJQUFJLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxTQUFTO2dCQUFFLE9BQU8sU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDZixRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDbEMsU0FBUztRQUNWLENBQUM7SUFDRixDQUFDO0lBRUQsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQ3RDLENBQUMifQ==