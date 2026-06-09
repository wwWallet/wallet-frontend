"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertDataUriToImage = convertDataUriToImage;
const fs_1 = __importDefault(require("fs"));
const mimeToExt = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/x-icon": ".ico",
    "image/tiff": ".tiff",
    "image/heif": ".heif"
};
function convertDataUriToImage(dataUri, outputFileName = "output-image") {
    const matches = dataUri.match(/^data:([a-zA-Z+\/]+);(?:charset=utf-8;)?(base64,|utf8,|utf-8,)?(.+)$/);
    if (!matches) {
        throw new Error("Invalid Data URI");
    }
    const mimeType = matches[1];
    const encoding = matches[2];
    const data = matches[3];
    const fileExtension = mimeToExt[mimeType] || ".bin";
    let buffer;
    if (encoding === "base64") {
        buffer = Buffer.from(data, "base64");
    }
    else {
        buffer = Buffer.from(decodeURIComponent(data), "utf-8");
    }
    const outputPath = `${outputFileName}${fileExtension}`;
    fs_1.default.writeFileSync(outputPath, buffer);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydERhdGFVcmlUb0ltYWdlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2Z1bmN0aW9ucy9jb252ZXJ0RGF0YVVyaVRvSW1hZ2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFjQSxzREFzQkM7QUFwQ0QsNENBQW9CO0FBRXBCLE1BQU0sU0FBUyxHQUEyQjtJQUN6QyxXQUFXLEVBQUUsTUFBTTtJQUNuQixZQUFZLEVBQUUsTUFBTTtJQUNwQixXQUFXLEVBQUUsTUFBTTtJQUNuQixlQUFlLEVBQUUsTUFBTTtJQUN2QixZQUFZLEVBQUUsT0FBTztJQUNyQixXQUFXLEVBQUUsTUFBTTtJQUNuQixjQUFjLEVBQUUsTUFBTTtJQUN0QixZQUFZLEVBQUUsT0FBTztJQUNyQixZQUFZLEVBQUUsT0FBTztDQUNyQixDQUFDO0FBRUYsU0FBZ0IscUJBQXFCLENBQUMsT0FBZSxFQUFFLGNBQWMsR0FBRyxjQUFjO0lBQ3JGLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0VBQXNFLENBQUMsQ0FBQztJQUV0RyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXhCLE1BQU0sYUFBYSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxNQUFNLENBQUM7SUFFcEQsSUFBSSxNQUFjLENBQUM7SUFDbkIsSUFBSSxRQUFRLEtBQUssUUFBUSxFQUFFLENBQUM7UUFDM0IsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7U0FBTSxDQUFDO1FBQ1AsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDekQsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLEdBQUcsY0FBYyxHQUFHLGFBQWEsRUFBRSxDQUFDO0lBQ3ZELFlBQUUsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3RDLENBQUMifQ==