"use strict";
/**
 * AuthZEN types for trust evaluation.
 *
 * These types mirror the AuthZEN Trust Registry Profile specification
 * as implemented by go-trust.
 *
 * @see https://openid.github.io/authzen/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustStatus = exports.AuthZENErrorCode = void 0;
/**
 * Error codes that can be returned by the AuthZEN proxy.
 */
var AuthZENErrorCode;
(function (AuthZENErrorCode) {
    /** Request was malformed or missing required fields */
    AuthZENErrorCode["INVALID_REQUEST"] = "invalid_request";
    /** Authentication failed (invalid/missing JWT) */
    AuthZENErrorCode["UNAUTHORIZED"] = "unauthorized";
    /** Query was not authorized by policy */
    AuthZENErrorCode["FORBIDDEN"] = "forbidden";
    /** Trust evaluation is not configured */
    AuthZENErrorCode["NOT_CONFIGURED"] = "not_configured";
    /** PDP request failed */
    AuthZENErrorCode["PDP_ERROR"] = "pdp_error";
    /** Network or timeout error */
    AuthZENErrorCode["NETWORK_ERROR"] = "network_error";
})(AuthZENErrorCode || (exports.AuthZENErrorCode = AuthZENErrorCode = {}));
/**
 * Trust status for display purposes.
 */
var TrustStatus;
(function (TrustStatus) {
    /** Entity is trusted per policy */
    TrustStatus["TRUSTED"] = "trusted";
    /** Entity is not trusted */
    TrustStatus["UNTRUSTED"] = "untrusted";
    /** Trust evaluation is pending/in-progress */
    TrustStatus["PENDING"] = "pending";
    /** Trust could not be evaluated (error) */
    TrustStatus["UNKNOWN"] = "unknown";
})(TrustStatus || (exports.TrustStatus = TrustStatus = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXV0aHplbi90eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7O0FBOElIOztHQUVHO0FBQ0gsSUFBWSxnQkFrQlg7QUFsQkQsV0FBWSxnQkFBZ0I7SUFDM0IsdURBQXVEO0lBQ3ZELHVEQUFtQyxDQUFBO0lBRW5DLGtEQUFrRDtJQUNsRCxpREFBNkIsQ0FBQTtJQUU3Qix5Q0FBeUM7SUFDekMsMkNBQXVCLENBQUE7SUFFdkIseUNBQXlDO0lBQ3pDLHFEQUFpQyxDQUFBO0lBRWpDLHlCQUF5QjtJQUN6QiwyQ0FBdUIsQ0FBQTtJQUV2QiwrQkFBK0I7SUFDL0IsbURBQStCLENBQUE7QUFDaEMsQ0FBQyxFQWxCVyxnQkFBZ0IsZ0NBQWhCLGdCQUFnQixRQWtCM0I7QUFpQkQ7O0dBRUc7QUFDSCxJQUFZLFdBWVg7QUFaRCxXQUFZLFdBQVc7SUFDdEIsbUNBQW1DO0lBQ25DLGtDQUFtQixDQUFBO0lBRW5CLDRCQUE0QjtJQUM1QixzQ0FBdUIsQ0FBQTtJQUV2Qiw4Q0FBOEM7SUFDOUMsa0NBQW1CLENBQUE7SUFFbkIsMkNBQTJDO0lBQzNDLGtDQUFtQixDQUFBO0FBQ3BCLENBQUMsRUFaVyxXQUFXLDJCQUFYLFdBQVcsUUFZdEIifQ==