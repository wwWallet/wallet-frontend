"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMetadata = exports.ClaimMetadataEntry = exports.ClaimDisplayEntry = exports.TypeDisplayEntry = exports.SvgTemplateEntry = exports.SvgTemplateProperties = exports.RenderingSimple = exports.LogoMetadata = exports.SvgId = exports.ClaimPath = exports.LocaleTag = exports.Uri = exports.IntegrityString = void 0;
const zod_1 = require("zod");
/** Integrity string per W3C SRI, e.g., "sha256-<base64url>" */
exports.IntegrityString = zod_1.z.string().min(1);
exports.Uri = zod_1.z.string().url();
exports.LocaleTag = zod_1.z.string().min(1);
/** Claim path per §9.1: array of string | null | non-negative integer */
exports.ClaimPath = zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.null(), zod_1.z.number().int().nonnegative()])).nonempty();
/** svg_id: [A-Za-z_][A-Za-z0-9_]* per §8.1.2.2 */
exports.SvgId = zod_1.z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/);
/** ---------- §8.1.1 "simple" rendering ---------- */
exports.LogoMetadata = zod_1.z.object({
    uri: exports.Uri, // REQUIRED
    ["uri#integrity"]: exports.IntegrityString.optional(),
    alt_text: zod_1.z.string().optional(),
});
/** ---------- §8.1.2 "svg_templates" rendering ---------- */
exports.RenderingSimple = zod_1.z.object({
    logo: exports.LogoMetadata.optional(),
    background_image: zod_1.z.object({
        uri: exports.Uri,
        ["uri#integrity"]: exports.IntegrityString.optional(),
    }).optional(),
    background_color: zod_1.z.string().optional(), // CSS color; keep as string
    text_color: zod_1.z.string().optional(), // CSS color; keep as string
});
exports.SvgTemplateProperties = zod_1.z.object({
    orientation: zod_1.z.enum(["portrait", "landscape"]).optional(),
    color_scheme: zod_1.z.enum(["light", "dark"]).optional(),
    contrast: zod_1.z.enum(["normal", "high"]).optional(),
}).refine((o) => o.orientation !== undefined || o.color_scheme !== undefined || o.contrast !== undefined, { message: "svg_template.properties must contain at least one of orientation, color_scheme, contrast" });
exports.SvgTemplateEntry = zod_1.z.object({
    uri: exports.Uri, // REQUIRED
    ["uri#integrity"]: exports.IntegrityString.optional(),
    properties: exports.SvgTemplateProperties.optional(), // REQUIRED if >1 template; enforced at array level
});
const Rendering = zod_1.z.object({
    simple: exports.RenderingSimple.optional(),
    svg_templates: zod_1.z.array(exports.SvgTemplateEntry).optional(), // optional here
}).superRefine((val, ctx) => {
    const arr = val.svg_templates;
    if (arr && arr.length > 1) {
        arr.forEach((t, i) => {
            if (!t.properties) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `rendering.svg_templates[${i}].properties is required when more than one template is present`,
                    path: ["svg_templates", i, "properties"],
                });
            }
        });
    }
});
/** ---------- §8 Display metadata for the TYPE ---------- */
exports.TypeDisplayEntry = zod_1.z.object({
    locale: exports.LocaleTag, // REQUIRED
    name: zod_1.z.string().min(1), // REQUIRED
    description: zod_1.z.string().optional(),
    rendering: Rendering.optional(),
});
/** ---------- §9.2 Display metadata for CLAIMS ---------- */
exports.ClaimDisplayEntry = zod_1.z.object({
    locale: exports.LocaleTag, // REQUIRED
    label: zod_1.z.string().min(1), // REQUIRED
    description: zod_1.z.string().optional(),
});
/** ---------- §9 Claim metadata entry ---------- */
exports.ClaimMetadataEntry = zod_1.z.object({
    path: exports.ClaimPath, // REQUIRED
    display: zod_1.z.array(exports.ClaimDisplayEntry).optional(), // §9.2
    mandatory: zod_1.z.boolean().optional(), // §9.3 d12
    sd: zod_1.z.enum(["always", "allowed", "never"]).optional(), // §9.3 (default "allowed")
    svg_id: exports.SvgId.optional(), // §8.1.2.2
});
/** ---------- §6.2 Type Metadata Document ---------- */
exports.TypeMetadata = zod_1.z.object({
    vct: zod_1.z.string(),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    extends: zod_1.z.string().optional(),
    ["extends#integrity"]: exports.IntegrityString.optional(),
    display: zod_1.z.array(exports.TypeDisplayEntry).optional(), // §8
    claims: zod_1.z.array(exports.ClaimMetadataEntry).optional(), // §9
    // §7 integrity for the vct reference when used
    ["vct#integrity"]: exports.IntegrityString.optional(),
})
    .strip() // remove unknown fields but don't error
    .superRefine((val, ctx) => {
    const ids = new Set();
    val.claims?.forEach((c, i) => {
        if (c.svg_id) {
            if (ids.has(c.svg_id)) {
                ctx.addIssue({
                    code: zod_1.z.ZodIssueCode.custom,
                    message: `svg_id "${c.svg_id}" must be unique within the type metadata`,
                    path: ["claims", i, "svg_id"],
                });
            }
            ids.add(c.svg_id);
        }
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2RKd3RWY1R5cGVNZXRhZGF0YVNjaGVtYS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWFzL1NkSnd0VmNUeXBlTWV0YWRhdGFTY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQXdCO0FBRXhCLCtEQUErRDtBQUNsRCxRQUFBLGVBQWUsR0FBRyxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXBDLFFBQUEsR0FBRyxHQUFHLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUV2QixRQUFBLFNBQVMsR0FBRyxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRTNDLHlFQUF5RTtBQUM1RCxRQUFBLFNBQVMsR0FBRyxPQUFDLENBQUMsS0FBSyxDQUMvQixPQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUMvRCxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBRWIsa0RBQWtEO0FBQ3JDLFFBQUEsS0FBSyxHQUFHLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUVsRSxzREFBc0Q7QUFDekMsUUFBQSxZQUFZLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNwQyxHQUFHLEVBQUUsV0FBRyxFQUErQixXQUFXO0lBQ2xELENBQUMsZUFBZSxDQUFDLEVBQUUsdUJBQWUsQ0FBQyxRQUFRLEVBQUU7SUFDN0MsUUFBUSxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7Q0FDL0IsQ0FBQyxDQUFDO0FBRUgsNkRBQTZEO0FBQ2hE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