"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyingEngine = VerifyingEngine;
const error_1 = require("./error");
function VerifyingEngine() {
    const verifiers = [];
    return {
        register(credentialVerifier) {
            verifiers.push(credentialVerifier);
        },
        async verify({ rawCredential, opts }) {
            let lastError = null;
            for (const v of verifiers) {
                const result = await v.verify({ rawCredential, opts });
                if (result.success) {
                    return result;
                }
                lastError = result.error;
            }
            return {
                success: false,
                error: lastError ? lastError : error_1.CredentialVerificationError.UnknownProblem
            };
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmVyaWZ5aW5nRW5naW5lLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1ZlcmlmeWluZ0VuZ2luZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU1BLDBDQThCQztBQXBDRCxtQ0FBc0Q7QUFNdEQsU0FBZ0IsZUFBZTtJQUM5QixNQUFNLFNBQVMsR0FBeUIsRUFBRSxDQUFDO0lBRTNDLE9BQU87UUFDTixRQUFRLENBQUMsa0JBQXNDO1lBQzlDLFNBQVMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBTWpDO1lBQ0EsSUFBSSxTQUFTLEdBQXVDLElBQUksQ0FBQztZQUN6RCxLQUFLLE1BQU0sQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDO2dCQUMzQixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDdkQsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3BCLE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7Z0JBQ0QsU0FBUyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDMUIsQ0FBQztZQUVELE9BQU87Z0JBQ04sT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxtQ0FBMkIsQ0FBQyxjQUFjO2FBQ3pFLENBQUE7UUFDRixDQUFDO0tBQ0QsQ0FBQTtBQUNGLENBQUMifQ==