"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIssuerMetadata = getIssuerMetadata;
const schemas_1 = require("../schemas");
const error_1 = require("../error");
async function getIssuerMetadata(httpClient, issuer, warnings, useCache = true) {
    if (!issuer)
        return { metadata: null };
    const url = `${issuer}/.well-known/openid-credential-issuer`;
    let issuerResponse = null;
    try {
        issuerResponse = await httpClient.get(url, { "Accept": "application/json" }, { useCache });
    }
    catch (err) {
        warnings.push({
            code: error_1.CredentialParsingError.FailFetchIssuerMetadata,
        });
        return { metadata: null };
    }
    if (!issuerResponse || issuerResponse.status !== 200 || !issuerResponse.data) {
        warnings.push({
            code: error_1.CredentialParsingError.FailFetchIssuerMetadata,
        });
        return { metadata: null };
    }
    const parsed = schemas_1.OpenidCredentialIssuerMetadataSchema.safeParse(issuerResponse.data);
    if (!parsed.success) {
        warnings.push({
            code: error_1.CredentialParsingError.FailSchemaIssuerMetadata,
        });
        return { metadata: null };
    }
    return { metadata: parsed.data };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SXNzdWVyTWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdXRpbHMvZ2V0SXNzdWVyTWV0YWRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSw4Q0F3Q0M7QUE3Q0Qsd0NBQWtFO0FBR2xFLG9DQUFrRDtBQUUzQyxLQUFLLFVBQVUsaUJBQWlCLENBQ3RDLFVBQXNCLEVBQ3RCLE1BQWMsRUFDZCxRQUEyQixFQUMzQixXQUFvQixJQUFJO0lBSXhCLElBQUksQ0FBQyxNQUFNO1FBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUV2QyxNQUFNLEdBQUcsR0FBRyxHQUFHLE1BQU0sdUNBQXVDLENBQUM7SUFFN0QsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDO0lBRTFCLElBQUksQ0FBQztRQUNKLGNBQWMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUMsUUFBUSxFQUFFLGtCQUFrQixFQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2QsUUFBUSxDQUFDLElBQUksQ0FBQztZQUNiLElBQUksRUFBRSw4QkFBc0IsQ0FBQyx1QkFBdUI7U0FDcEQsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsSUFBSSxDQUFDLGNBQWMsSUFBSSxjQUFjLENBQUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM5RSxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQ2IsSUFBSSxFQUFFLDhCQUFzQixDQUFDLHVCQUF1QjtTQUNwRCxDQUFDLENBQUM7UUFDSCxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRCxNQUFNLE1BQU0sR0FBRyw4Q0FBb0MsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRW5GLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDckIsUUFBUSxDQUFDLElBQUksQ0FBQztZQUNiLElBQUksRUFBRSw4QkFBc0IsQ0FBQyx3QkFBd0I7U0FDckQsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEMsQ0FBQyJ9