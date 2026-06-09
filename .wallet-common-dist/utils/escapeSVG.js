"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeSVG = escapeSVG;
function escapeSVG(str) {
    if (typeof str !== "string")
        return str;
    return str.replace(/[<>&"']/g, function (match) {
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '"': return '&quot;';
            case "'": return '&apos;';
            default: return match;
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXNjYXBlU1ZHLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL2VzY2FwZVNWRy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDhCQWFDO0FBYkQsU0FBZ0IsU0FBUyxDQUFDLEdBQVc7SUFDcEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRO1FBQUUsT0FBTyxHQUFHLENBQUM7SUFFeEMsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxVQUFVLEtBQUs7UUFDN0MsUUFBUSxLQUFLLEVBQUUsQ0FBQztZQUNmLEtBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxNQUFNLENBQUM7WUFDeEIsS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQztZQUN4QixLQUFLLEdBQUcsQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDO1lBQ3pCLEtBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxRQUFRLENBQUM7WUFDMUIsS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLFFBQVEsQ0FBQztZQUMxQixPQUFPLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQztRQUN2QixDQUFDO0lBQ0YsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDIn0=