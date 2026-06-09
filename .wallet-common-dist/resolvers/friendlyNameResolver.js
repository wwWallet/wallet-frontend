"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendlyNameResolver = friendlyNameResolver;
const matchLocalizedDisplay_1 = require("../utils/matchLocalizedDisplay");
function friendlyNameResolver({ credentialDisplayArray, issuerDisplayArray, fallbackName = "Verifiable Credential", }) {
    return async (preferredLangs = ["en-US"]) => {
        // 1) Credential display name
        const credentialDisplayLocalized = (0, matchLocalizedDisplay_1.matchDisplayByLocale)(credentialDisplayArray, preferredLangs);
        if (credentialDisplayLocalized?.name) {
            return credentialDisplayLocalized.name;
        }
        // 2) Issuer display name
        const issuerDisplayLocalized = (0, matchLocalizedDisplay_1.matchDisplayByLocale)(issuerDisplayArray, preferredLangs);
        if (issuerDisplayLocalized?.name) {
            return issuerDisplayLocalized.name;
        }
        return fallbackName;
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJpZW5kbHlOYW1lUmVzb2x2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcmVzb2x2ZXJzL2ZyaWVuZGx5TmFtZVJlc29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBZ0JBLG9EQTRCQztBQTNDRCwwRUFBc0U7QUFldEUsU0FBZ0Isb0JBQW9CLENBQUMsRUFDcEMsc0JBQXNCLEVBQ3RCLGtCQUFrQixFQUNsQixZQUFZLEdBQUcsdUJBQXVCLEdBQ1Q7SUFDN0IsT0FBTyxLQUFLLEVBQUUsaUJBQTJCLENBQUMsT0FBTyxDQUFDLEVBQTBCLEVBQUU7UUFDN0UsNkJBQTZCO1FBQzdCLE1BQU0sMEJBQTBCLEdBQUcsSUFBQSw0Q0FBb0IsRUFDdEQsc0JBQXNCLEVBQ3RCLGNBQWMsQ0FDZCxDQUFDO1FBRUYsSUFBSSwwQkFBMEIsRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUN0QyxPQUFPLDBCQUEwQixDQUFDLElBQUksQ0FBQztRQUN4QyxDQUFDO1FBRUQseUJBQXlCO1FBQ3pCLE1BQU0sc0JBQXNCLEdBQUcsSUFBQSw0Q0FBb0IsRUFDbEQsa0JBQWtCLEVBQ2xCLGNBQWMsQ0FDZCxDQUFDO1FBRUYsSUFBSSxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUNsQyxPQUFPLHNCQUFzQixDQUFDLElBQUksQ0FBQztRQUNwQyxDQUFDO1FBRUQsT0FBTyxZQUFZLENBQUM7SUFDckIsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyJ9