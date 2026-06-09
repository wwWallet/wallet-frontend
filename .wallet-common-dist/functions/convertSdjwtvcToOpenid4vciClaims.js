"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSdjwtvcToOpenid4vciClaims = convertSdjwtvcToOpenid4vciClaims;
/**
 * Converts SD-JWT VC type-metadata claims to OpenID4VCI claims.
 * - display[].label -> display[].name
 * - preserves mandatory if present
 * - removes undefined fields
 */
function convertSdjwtvcToOpenid4vciClaims(claims) {
    if (!claims?.length)
        return [];
    return claims.map((claim) => {
        // Map display entries
        const display = (claim.display ?? [])
            .filter((d) => typeof d?.locale === "string" &&
            d.locale.trim() !== "" &&
            typeof d?.label === "string" &&
            d.label.trim() !== "")
            .map((d) => ({
            locale: d.locale.trim(),
            name: d.label.trim(),
        }));
        // Only include mandatory if explicitly present (true OR false)
        const hasMandatory = Object.prototype.hasOwnProperty.call(claim, "mandatory");
        const result = {
            path: claim.path,
            ...(display.length > 0 ? { display } : {}),
            ...(hasMandatory ? { mandatory: claim.mandatory } : {}),
        };
        return result;
    });
}
exports.default = convertSdjwtvcToOpenid4vciClaims;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydFNkand0dmNUb09wZW5pZDR2Y2lDbGFpbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnVuY3Rpb25zL2NvbnZlcnRTZGp3dHZjVG9PcGVuaWQ0dmNpQ2xhaW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBWUEsNEVBa0NDO0FBeENEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsZ0NBQWdDLENBQy9DLE1BQW9DO0lBRXBDLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTTtRQUFFLE9BQU8sRUFBRSxDQUFDO0lBRS9CLE9BQU8sTUFBTSxDQUFDLEdBQUcsQ0FBYyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3hDLHNCQUFzQjtRQUN0QixNQUFNLE9BQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO2FBQ25DLE1BQU0sQ0FDTixDQUFDLENBQUMsRUFBMEIsRUFBRSxDQUM3QixPQUFPLENBQUMsRUFBRSxNQUFNLEtBQUssUUFBUTtZQUM3QixDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDdEIsT0FBTyxDQUFDLEVBQUUsS0FBSyxLQUFLLFFBQVE7WUFDNUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQ3RCO2FBQ0EsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1osTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ3ZCLElBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtTQUNwQixDQUFDLENBQUMsQ0FBQztRQUVMLCtEQUErRDtRQUMvRCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQ3hELEtBQUssRUFDTCxXQUFXLENBQ1gsQ0FBQztRQUVGLE1BQU0sTUFBTSxHQUFRO1lBQ25CLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtZQUNoQixHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUMxQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztTQUN2RCxDQUFDO1FBRUYsT0FBTyxNQUFxQixDQUFDO0lBQzlCLENBQUMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLGdDQUFnQyxDQUFDIn0=