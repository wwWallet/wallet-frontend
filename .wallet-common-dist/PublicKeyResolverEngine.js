"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicKeyResolverEngine = PublicKeyResolverEngine;
const error_1 = require("./error");
function PublicKeyResolverEngine() {
    const resolvers = [];
    return {
        register(resolver) {
            resolvers.push(resolver);
        },
        async resolve({ identifier }) {
            for (const r of resolvers) {
                const result = await r.resolve({ identifier });
                if (result.success) {
                    return result;
                }
            }
            return { success: false, error: error_1.PublicKeyResolutionError.CannotResolvePublicKey };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHVibGljS2V5UmVzb2x2ZXJFbmdpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUHVibGljS2V5UmVzb2x2ZXJFbmdpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSwwREFpQkM7QUFwQkQsbUNBQW1EO0FBR25ELFNBQWdCLHVCQUF1QjtJQUN0QyxNQUFNLFNBQVMsR0FBd0IsRUFBRSxDQUFDO0lBRTFDLE9BQU87UUFDTixRQUFRLENBQUMsUUFBMkI7WUFDbkMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBQ0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFVBQVUsRUFBMEI7WUFDbkQsS0FBSyxNQUFNLENBQUMsSUFBSSxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztnQkFDL0MsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3BCLE9BQU8sTUFBTSxDQUFDO2dCQUNmLENBQUM7WUFDRixDQUFDO1lBQ0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGdDQUF3QixDQUFDLHNCQUFzQixFQUFFLENBQUM7UUFDbkYsQ0FBQztLQUNELENBQUE7QUFDRixDQUFDIn0=