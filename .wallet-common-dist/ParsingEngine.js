"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsingEngine = ParsingEngine;
const error_1 = require("./error");
function ParsingEngine() {
    const parsers = [];
    return {
        register(parser) {
            parsers.push(parser);
        },
        async parse({ rawCredential, credentialIssuer }) {
            for (const parser of parsers) {
                try {
                    const result = await parser.parse({ rawCredential, credentialIssuer });
                    // Parser not supported this format, try next parser
                    if (!result.success && result.error === error_1.CredentialParsingError.UnsupportedFormat) {
                        continue;
                    }
                    // Otherwise return immediately
                    return result;
                }
                catch {
                    return { success: false, error: error_1.CredentialParsingError.UnknownError };
                }
            }
            // No parser handled it
            return { success: false, error: error_1.CredentialParsingError.UnsupportedFormat };
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFyc2luZ0VuZ2luZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9QYXJzaW5nRW5naW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0Esc0NBOEJDO0FBakNELG1DQUFpRDtBQUdqRCxTQUFnQixhQUFhO0lBQzVCLE1BQU0sT0FBTyxHQUF1QixFQUFFLENBQUM7SUFFdkMsT0FBTztRQUNOLFFBQVEsQ0FBQyxNQUF3QjtZQUNoQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3RCLENBQUM7UUFFRCxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixFQUFFO1lBQzlDLEtBQUssTUFBTSxNQUFNLElBQUksT0FBTyxFQUFFLENBQUM7Z0JBQzlCLElBQUksQ0FBQztvQkFDSixNQUFNLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxhQUFhLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDO29CQUV2RSxvREFBb0Q7b0JBQ3BELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEtBQUssOEJBQXNCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzt3QkFDbEYsU0FBUztvQkFDVixDQUFDO29CQUVELCtCQUErQjtvQkFDL0IsT0FBTyxNQUFNLENBQUM7Z0JBRWYsQ0FBQztnQkFBQyxNQUFNLENBQUM7b0JBQ1IsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLDhCQUFzQixDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUN2RSxDQUFDO1lBQ0YsQ0FBQztZQUVELHVCQUF1QjtZQUN2QixPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsOEJBQXNCLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUM1RSxDQUFDO0tBQ0QsQ0FBQztBQUNILENBQUMifQ==