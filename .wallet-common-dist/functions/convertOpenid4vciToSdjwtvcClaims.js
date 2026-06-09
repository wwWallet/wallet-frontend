"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertOpenid4vciToSdjwtvcClaims = convertOpenid4vciToSdjwtvcClaims;
function convertOpenid4vciToSdjwtvcClaims(metadataClaims) {
    if (!metadataClaims?.length)
        return [];
    return metadataClaims
        .map((claim) => {
        const normalizedDisplay = (claim.display ?? [])
            .filter((d) => typeof d?.locale === "string" &&
            d.locale.trim().length > 0 &&
            typeof d?.name === "string" &&
            d.name.trim().length > 0)
            .map(d => ({
            locale: d.locale.trim(),
            label: d.name.trim(),
        }));
        // preserve mandatory if present (true OR false), skip if undefined
        const mandatory = Object.prototype.hasOwnProperty.call(claim, "mandatory")
            ? claim.mandatory
            : undefined;
        return {
            path: claim.path,
            ...(normalizedDisplay.length > 0 ? { display: normalizedDisplay } : {}),
            ...(mandatory !== undefined ? { mandatory } : {}),
        };
    })
        .filter((e) => e !== null);
}
exports.default = convertOpenid4vciToSdjwtvcClaims;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydE9wZW5pZDR2Y2lUb1Nkand0dmNDbGFpbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnVuY3Rpb25zL2NvbnZlcnRPcGVuaWQ0dmNpVG9TZGp3dHZjQ2xhaW1zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsNEVBaUNDO0FBakNELFNBQWdCLGdDQUFnQyxDQUMvQyxjQUFxQztJQUVyQyxJQUFJLENBQUMsY0FBYyxFQUFFLE1BQU07UUFBRSxPQUFPLEVBQUUsQ0FBQztJQUV2QyxPQUFPLGNBQWM7U0FDbkIsR0FBRyxDQUE0QixDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3pDLE1BQU0saUJBQWlCLEdBQXdCLENBQUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7YUFDbEUsTUFBTSxDQUNOLENBQUMsQ0FBQyxFQUF5QyxFQUFFLENBQzVDLE9BQU8sQ0FBQyxFQUFFLE1BQU0sS0FBSyxRQUFRO1lBQzdCLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUM7WUFDMUIsT0FBTyxDQUFDLEVBQUUsSUFBSSxLQUFLLFFBQVE7WUFDM0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUN6QjthQUNBLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDVixNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7WUFDdkIsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3BCLENBQUMsQ0FBQyxDQUFDO1FBRUwsbUVBQW1FO1FBQ25FLE1BQU0sU0FBUyxHQUNkLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDO1lBQ3ZELENBQUMsQ0FBRSxLQUFhLENBQUMsU0FBUztZQUMxQixDQUFDLENBQUMsU0FBUyxDQUFDO1FBRWQsT0FBTztZQUNOLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtZQUNoQixHQUFHLENBQUMsaUJBQWlCLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ3ZFLEdBQUcsQ0FBQyxTQUFTLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7U0FDM0IsQ0FBQztJQUN6QixDQUFDLENBQUM7U0FDRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQTJCLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUM7QUFDdEQsQ0FBQztBQUVELGtCQUFlLGdDQUFnQyxDQUFDIn0=