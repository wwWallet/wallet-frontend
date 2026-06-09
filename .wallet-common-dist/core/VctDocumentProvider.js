"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVctDocumentResolutionEngine = exports.VctResolutionErrors = void 0;
const SdJwtVcTypeMetadataSchema_1 = require("../schemas/SdJwtVcTypeMetadataSchema");
const Result_1 = require("./Result");
exports.VctResolutionErrors = {
    InvalidSchema: "invalid_schema",
    NotFound: "not_found",
};
const createVctDocumentResolutionEngine = (providers) => {
    return {
        getVctMetadataDocument: async (vct) => {
            try {
                const results = await Promise.all(providers.map((p) => p.getVctMetadataDocument(vct)));
                for (const r of results) {
                    if (!r.ok)
                        continue;
                    const parsed = SdJwtVcTypeMetadataSchema_1.TypeMetadata.safeParse(r.value);
                    if (parsed.success)
                        return (0, Result_1.ok)(parsed.data);
                    const error_description = JSON.stringify(parsed.error);
                    return (0, Result_1.err)(exports.VctResolutionErrors.InvalidSchema, error_description);
                }
            }
            catch {
                return (0, Result_1.err)(exports.VctResolutionErrors.NotFound);
            }
            return (0, Result_1.err)(exports.VctResolutionErrors.NotFound);
        },
    };
};
exports.createVctDocumentResolutionEngine = createVctDocumentResolutionEngine;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmN0RG9jdW1lbnRQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL1ZjdERvY3VtZW50UHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsb0ZBQW9FO0FBQ3BFLHFDQUEyQztBQUU5QixRQUFBLG1CQUFtQixHQUFHO0lBQ2xDLGFBQWEsRUFBRSxnQkFBZ0I7SUFDL0IsUUFBUSxFQUFFLFdBQVc7Q0FDWixDQUFDO0FBU0osTUFBTSxpQ0FBaUMsR0FBRyxDQUFDLFNBQWdDLEVBQXVCLEVBQUU7SUFFMUcsT0FBTztRQUNOLHNCQUFzQixFQUFFLEtBQUssRUFBRSxHQUFXLEVBQUUsRUFBRTtZQUM3QyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZGLEtBQUssTUFBTSxDQUFDLElBQUksT0FBTyxFQUFFLENBQUM7b0JBQ3pCLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTt3QkFBRSxTQUFTO29CQUVwQixNQUFNLE1BQU0sR0FBRyx3Q0FBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQy9DLElBQUksTUFBTSxDQUFDLE9BQU87d0JBQUUsT0FBTyxJQUFBLFdBQUUsRUFBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzNDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ3ZELE9BQU8sSUFBQSxZQUFHLEVBQUMsMkJBQW1CLENBQUMsYUFBYSxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ2xFLENBQUM7WUFDRixDQUFDO1lBQ0QsTUFBTSxDQUFDO2dCQUNOLE9BQU8sSUFBQSxZQUFHLEVBQUMsMkJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUNELE9BQU8sSUFBQSxZQUFHLEVBQUMsMkJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUMsQ0FBQztLQUNELENBQUM7QUFDSCxDQUFDLENBQUM7QUFyQlcsUUFBQSxpQ0FBaUMscUNBcUI1QyJ9