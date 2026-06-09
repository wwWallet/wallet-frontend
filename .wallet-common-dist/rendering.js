"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialRenderingService = CredentialRenderingService;
const jsonpointer_1 = __importDefault(require("jsonpointer"));
const formatDate_1 = require("./functions/formatDate");
const escapeSVG_1 = require("./utils/escapeSVG");
function CredentialRenderingService() {
    const renderSvgTemplate = async ({ json, credentialImageSvgTemplate, sdJwtVcMetadataClaims, filter }) => {
        let svgContent = null;
        try {
            svgContent = credentialImageSvgTemplate;
        }
        catch (error) {
            return null; // Return null if fetching fails
        }
        if (svgContent) {
            // Build pathMap from credentialHeader.vctm.claims
            const pathMap = (sdJwtVcMetadataClaims ?? []).reduce((acc, claim) => {
                if (claim.svg_id && claim.path) {
                    acc[claim.svg_id] = claim.path;
                }
                return acc;
            }, {});
            // Regular expression to match {{svg_id}} placeholders
            const regex = /{{([^}]+)}}/g;
            const replacedSvgText = svgContent.replace(regex, (_match, svgId) => {
                // Retrieve the path array for the current svgId from pathMap
                const pathArray = pathMap[svgId];
                if (Array.isArray(pathArray) && filter && !filter.map(f => f.join('.')).includes(pathArray.join('.'))) {
                    return '-';
                }
                // If pathArray exists, convert it to a JSON pointer path
                if (Array.isArray(pathArray)) {
                    const jsonPointerPath = `/${pathArray.join('/')}`;
                    // Retrieve the value from beautifiedForm using jsonpointer
                    let value = (0, escapeSVG_1.escapeSVG)(jsonpointer_1.default.get(json, jsonPointerPath));
                    if (value !== undefined) {
                        value = (0, formatDate_1.formatDate)(value, 'date');
                        return value;
                    }
                }
                return '-';
            });
            const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(replacedSvgText)}`;
            return dataUri; // Return the data URI for the SVG
        }
        return null;
    };
    return {
        renderSvgTemplate,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVuZGVyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JlbmRlcmluZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQU1BLGdFQW9EQztBQTFERCw4REFBc0M7QUFDdEMsdURBQW9EO0FBRXBELGlEQUE4QztBQUc5QyxTQUFnQiwwQkFBMEI7SUFDekMsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsMEJBQTBCLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxFQUFzSCxFQUFFLEVBQUU7UUFFM04sSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLElBQUksQ0FBQztZQUNKLFVBQVUsR0FBRywwQkFBMEIsQ0FBQztRQUN6QyxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNoQixPQUFPLElBQUksQ0FBQyxDQUFDLGdDQUFnQztRQUM5QyxDQUFDO1FBRUQsSUFBSSxVQUFVLEVBQUUsQ0FBQztZQUNoQixrREFBa0Q7WUFDbEQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFRLEVBQUUsS0FBVSxFQUFFLEVBQUU7Z0JBQzdFLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ2hDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDaEMsQ0FBQztnQkFDRCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVQLHNEQUFzRDtZQUN0RCxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUM7WUFDN0IsTUFBTSxlQUFlLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ25FLDZEQUE2RDtnQkFDN0QsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVqQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3ZHLE9BQU8sR0FBRyxDQUFDO2dCQUNaLENBQUM7Z0JBQ0QseURBQXlEO2dCQUN6RCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQztvQkFDOUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7b0JBRWxELDJEQUEyRDtvQkFDM0QsSUFBSSxLQUFLLEdBQUcsSUFBQSxxQkFBUyxFQUFDLHFCQUFXLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO29CQUU5RCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQzt3QkFDekIsS0FBSyxHQUFHLElBQUEsdUJBQVUsRUFBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7d0JBQ2xDLE9BQU8sS0FBSyxDQUFDO29CQUNkLENBQUM7Z0JBQ0YsQ0FBQztnQkFDRCxPQUFPLEdBQUcsQ0FBQztZQUNaLENBQUMsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxPQUFPLEdBQUcsMkJBQTJCLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUM7WUFDakYsT0FBTyxPQUFPLENBQUMsQ0FBQyxrQ0FBa0M7UUFDbkQsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQyxDQUFDO0lBRUYsT0FBTztRQUNOLGlCQUFpQjtLQUNqQixDQUFBO0FBQ0YsQ0FBQyJ9