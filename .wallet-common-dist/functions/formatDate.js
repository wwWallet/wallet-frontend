"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
function formatDate(value, format = 'datetime') {
    // Regex for ISO 8601 format like '2024-10-08T07:28:49.117Z'. milliseconds are optional.
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?Z$/;
    // Regex for simple YYYY-MM-DD format
    const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    // Regex for long-form date strings like 'Wed Dec 11 2024 14:46:19 GMT+0200'
    const longFormDateRegex = /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}/;
    let date;
    if (typeof value === 'number') {
        if (value.toString().length === 10) {
            // Handle Unix timestamp (seconds) by converting to milliseconds
            date = new Date(value * 1000);
        }
        else if (value.toString().length === 13) {
            // Timestamp including milliseconds
            date = new Date(value);
        }
        else {
            // Unsupported timestamp formats
            return value;
        }
    }
    else if (typeof value === 'string') {
        if (iso8601Regex.test(value)) {
            // Handle ISO 8601 format
            date = new Date(value);
        }
        else if (simpleDateRegex.test(value)) {
            // Handle YYYY-MM-DD format
            date = new Date(value);
        }
        else if (longFormDateRegex.test(value)) {
            // Handle long-form date string
            date = new Date(value);
        }
        else {
            // Non-date strings, including IDs, are returned as-is
            return value;
        }
    }
    else if (value instanceof Date) {
        // Handle Date objects directly
        date = value;
    }
    else {
        // For unsupported types, return the original value
        return value;
    }
    const options = format === 'datetime'
        ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybWF0RGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mdW5jdGlvbnMvZm9ybWF0RGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdDQWtEQztBQWxERCxTQUFnQixVQUFVLENBQUMsS0FBVSxFQUFFLE1BQU0sR0FBRyxVQUFVO0lBQ3pELHdGQUF3RjtJQUN4RixNQUFNLFlBQVksR0FBRyxvREFBb0QsQ0FBQztJQUMxRSxxQ0FBcUM7SUFDckMsTUFBTSxlQUFlLEdBQUcscUJBQXFCLENBQUM7SUFDOUMsNEVBQTRFO0lBQzVFLE1BQU0saUJBQWlCLEdBQUcseUVBQXlFLENBQUM7SUFFcEcsSUFBSSxJQUFJLENBQUM7SUFFVCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRSxDQUFDO1FBQy9CLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sS0FBSyxFQUFFLEVBQUUsQ0FBQztZQUNwQyxnRUFBZ0U7WUFDaEUsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQztRQUMvQixDQUFDO2FBQ0ksSUFBSSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ3pDLG1DQUFtQztZQUNuQyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDeEIsQ0FBQzthQUNJLENBQUM7WUFDTCxnQ0FBZ0M7WUFDaEMsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDO0lBQ0YsQ0FBQztTQUFNLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDdEMsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUIseUJBQXlCO1lBQ3pCLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QixDQUFDO2FBQU0sSUFBSSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDeEMsMkJBQTJCO1lBQzNCLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QixDQUFDO2FBQU0sSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMxQywrQkFBK0I7WUFDL0IsSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLENBQUM7YUFBTSxDQUFDO1lBQ1Asc0RBQXNEO1lBQ3RELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNGLENBQUM7U0FBTSxJQUFJLEtBQUssWUFBWSxJQUFJLEVBQUUsQ0FBQztRQUNsQywrQkFBK0I7UUFDL0IsSUFBSSxHQUFHLEtBQUssQ0FBQztJQUNkLENBQUM7U0FBTSxDQUFDO1FBQ1AsbURBQW1EO1FBQ25ELE9BQU8sS0FBSyxDQUFDO0lBQ2QsQ0FBQztJQUVELE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxVQUFVO1FBQ3BDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFO1FBQzlHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFFekQsT0FBTyxJQUFJLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFLE9BQWMsQ0FBQyxDQUFDO0FBQ3pELENBQUMifQ==