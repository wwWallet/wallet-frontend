"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeDcqlQuery = serializeDcqlQuery;
/**
 * removes _ underscore
 * @param obj
 * @returns
 */
function serializeDcqlQuery(obj) {
    if (Array.isArray(obj)) {
        return obj.map(serializeDcqlQuery);
    }
    else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(Object.entries(obj)
            .filter(([key, _]) => !key.startsWith('_'))
            .map(([key, value]) => [key, serializeDcqlQuery(value)]));
    }
    return obj;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyaWFsaXplRGNxbFF1ZXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3V0aWxzL3NlcmlhbGl6ZURjcWxRdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLGdEQVdDO0FBaEJEOzs7O0dBSUc7QUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxHQUFRO0lBQzFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1FBQ3hCLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7U0FBTSxJQUFJLEdBQUcsS0FBSyxJQUFJLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDcEQsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUN4QixNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQzthQUNqQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQ3pELENBQUM7SUFDSCxDQUFDO0lBQ0QsT0FBTyxHQUFHLENBQUM7QUFDWixDQUFDIn0=