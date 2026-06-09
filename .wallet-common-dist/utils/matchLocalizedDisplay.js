"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchDisplayByLocale = matchDisplayByLocale;
function matchDisplayByLocale(arr, preferredLangs) {
    if (!Array.isArray(arr))
        return null;
    for (const lang of preferredLangs) {
        const match = arr.find(d => d.locale === lang ||
            d.locale?.startsWith(lang + '-') ||
            lang?.startsWith(d.locale + '-'));
        if (match)
            return match;
    }
    return arr[0] ?? null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0Y2hMb2NhbGl6ZWREaXNwbGF5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL21hdGNoTG9jYWxpemVkRGlzcGxheS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLG9EQWVDO0FBZkQsU0FBZ0Isb0JBQW9CLENBQ25DLEdBQW9CLEVBQ3BCLGNBQXdCO0lBRXhCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUFFLE9BQU8sSUFBSSxDQUFDO0lBRXJDLEtBQUssTUFBTSxJQUFJLElBQUksY0FBYyxFQUFFLENBQUM7UUFDbkMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUMxQixDQUFDLENBQUMsTUFBTSxLQUFLLElBQUk7WUFDakIsQ0FBQyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztZQUNoQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQ2hDLENBQUM7UUFDRixJQUFJLEtBQUs7WUFBRSxPQUFPLEtBQUssQ0FBQztJQUN6QixDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO0FBQ3ZCLENBQUMifQ==