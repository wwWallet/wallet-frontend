import { z } from "zod";
/** Integrity string per W3C SRI, e.g., "sha256-<base64url>" */
export declare const IntegrityString: z.ZodString;
export declare const Uri: z.ZodString;
export declare const LocaleTag: z.ZodString;
/** Claim path per §9.1: array of string | null | non-negative integer */
export declare const ClaimPath: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
/** svg_id: [A-Za-z_][A-Za-z0-9_]* per §8.1.2.2 */
export declare const SvgId: z.ZodString;
/** ---------- §8.1.1 "simple" rendering ---------- */
export declare const LogoMetadata: z.ZodObject<{
    uri: z.ZodString;
    "uri#integrity": z.ZodOptional<z.ZodString>;
    alt_text: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    uri: string;
    "uri#integrity"?: string | undefined;
    alt_text?: string | undefined;
}, {
    uri: string;
    "uri#integrity"?: string | undefined;
    alt_text?: string | undefined;
}>;
/** ---------- §8.1.2 "svg_templates" rendering ---------- */
export declare const RenderingSimple: z.ZodObject<{
    logo: z.ZodOptional<z.ZodObject<{
        uri: z.ZodString;
        "uri#integrity": z.ZodOptional<z.ZodString>;
        alt_text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        uri: string;
        "uri#integrity"?: string | undefined;
        alt_text?: string | undefined;
    }, {
        uri: string;
        "uri#integrity"?: string | undefined;
        alt_text?: string | undefined;
    }>>;
    background_image: z.ZodOptional<z.ZodObject<{
        uri: z.ZodString;
        "uri#integrity": z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        uri: string;
        "uri#integrity"?: string | undefined;
    }, {
        uri: string;
        "uri#integrity"?: string | undefined;
    }>>;
    background_color: z.ZodOptional<z.ZodString>;
    text_color: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    logo?: {
        uri: string;
        "uri#integrity"?: string | undefined;
        alt_text?: string | undefined;
    } | undefined;
    background_image?: {
        uri: string;
        "uri#integrity"?: string | undefined;
    } | undefined;
    background_color?: string | undefined;
    text_color?: string | undefined;
}, {
    logo?: {
        uri: string;
        "uri#integrity"?: string | undefined;
        alt_text?: string | undefined;
    } | undefined;
    background_image?: {
        uri: string;
        "uri#integrity"?: string | undefined;
    } | undefined;
    background_color?: string | undefined;
    text_color?: string | undefined;
}>;
export declare const SvgTemplateProperties: z.ZodEffects<z.ZodObject<{
    orientation: z.ZodOptional<z.ZodEnum<["portrait", "landscape"]>>;
    color_scheme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
    contrast: z.ZodOptional<z.ZodEnum<["normal", "high"]>>;
}, "strip", z.ZodTypeAny, {
    orientation?: "portrait" | "landscape" | undefined;
    color_scheme?: "light" | "dark" | undefined;
    contrast?: "normal" | "high" | undefined;
}, {
    orientation?: "portrait" | "landscape" | undefined;
    color_scheme?: "light" | "dark" | undefined;
    contrast?: "normal" | "high" | undefined;
}>, {
    orientation?: "portrait" | "landscape" | undefined;
    color_scheme?: "light" | "dark" | undefined;
    contrast?: "normal" | "high" | undefined;
}, {
    orientation?: "portrait" | "landscape" | undefined;
    color_scheme?: "light" | "dark" | undefined;
    contrast?: "normal" | "high" | undefined;
}>;
export declare const SvgTemplateEntry: z.ZodObject<{
    uri: z.ZodString;
    "uri#integrity": z.ZodOptional<z.ZodString>;
    properties: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        orientation: z.ZodOptional<z.ZodEnum<["portrait", "landscape"]>>;
        color_scheme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
        contrast: z.ZodOptional<z.ZodEnum<["normal", "high"]>>;
    }, "strip", z.ZodTypeAny, {
        orientation?: "portrait" | "landscape" | undefined;
        color_scheme?: "light" | "dark" | undefined;
        contrast?: "normal" | "high" | undefined;
    }, {
        orientation?: "portrait" | "landscape" | undefined;
        color_scheme?: "light" | "dark" | undefined;
        contrast?: "normal" | "high" | undefined;
    }>, {
        orientation?: "portrait" | "landscape" | undefined;
        color_scheme?: "light" | "dark" | undefined;
        contrast?: "normal" | "high" | undefined;
    }, {
        orientation?: "portrait" | "landscape" | undefined;
        color_scheme?: "light" | "dark" | undefined;
        contrast?: "normal" | "high" | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    uri: string;
    "uri#integrity"?: string | undefined;
    properties?: {
        orientation?: "portrait" | "landscape" | undefined;
        color_scheme?: "light" | "dark" | undefined;
        contrast?: "normal" | "high" | undefined;
    } | undefined;
}, {
    uri: string;
    "uri#integrity"?: string | undefined;
    properties?: {
        orientation?: "portrait" | "landscape" | undefined;
        color_scheme?: "light" | "dark" | undefined;
        contrast?: "normal" | "high" | undefined;
    } | undefined;
}>;
/** ---------- §8 Display metadata for the TYPE ---------- */
export declare const TypeDisplayEntry: z.ZodObject<{
    locale: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    rendering: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        simple: z.ZodOptional<z.ZodObject<{
            logo: z.ZodOptional<z.ZodObject<{
                uri: z.ZodString;
                "uri#integrity": z.ZodOptional<z.ZodString>;
                alt_text: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            }, {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            }>>;
            background_image: z.ZodOptional<z.ZodObject<{
                uri: z.ZodString;
                "uri#integrity": z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                "uri#integrity"?: string | undefined;
            }, {
                uri: string;
                "uri#integrity"?: string | undefined;
            }>>;
            background_color: z.ZodOptional<z.ZodString>;
            text_color: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        }, {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        }>>;
        svg_templates: z.ZodOptional<z.ZodArray<z.ZodObject<{
            uri: z.ZodString;
            "uri#integrity": z.ZodOptional<z.ZodString>;
            properties: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                orientation: z.ZodOptional<z.ZodEnum<["portrait", "landscape"]>>;
                color_scheme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
                contrast: z.ZodOptional<z.ZodEnum<["normal", "high"]>>;
            }, "strip", z.ZodTypeAny, {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            }, {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            }>, {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            }, {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }, {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        simple?: {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        } | undefined;
        svg_templates?: {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }[] | undefined;
    }, {
        simple?: {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        } | undefined;
        svg_templates?: {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }[] | undefined;
    }>, {
        simple?: {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        } | undefined;
        svg_templates?: {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }[] | undefined;
    }, {
        simple?: {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        } | undefined;
        svg_templates?: {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    locale: string;
    name: string;
    description?: string | undefined;
    rendering?: {
        simple?: {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        } | undefined;
        svg_templates?: {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }[] | undefined;
    } | undefined;
}, {
    locale: string;
    name: string;
    description?: string | undefined;
    rendering?: {
        simple?: {
            logo?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                alt_text?: string | undefined;
            } | undefined;
            background_image?: {
                uri: string;
                "uri#integrity"?: string | undefined;
            } | undefined;
            background_color?: string | undefined;
            text_color?: string | undefined;
        } | undefined;
        svg_templates?: {
            uri: string;
            "uri#integrity"?: string | undefined;
            properties?: {
                orientation?: "portrait" | "landscape" | undefined;
                color_scheme?: "light" | "dark" | undefined;
                contrast?: "normal" | "high" | undefined;
            } | undefined;
        }[] | undefined;
    } | undefined;
}>;
/** ---------- §9.2 Display metadata for CLAIMS ---------- */
export declare const ClaimDisplayEntry: z.ZodObject<{
    locale: z.ZodString;
    label: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    locale: string;
    label: string;
    description?: string | undefined;
}, {
    locale: string;
    label: string;
    description?: string | undefined;
}>;
/** ---------- §9 Claim metadata entry ---------- */
export declare const ClaimMetadataEntry: z.ZodObject<{
    path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
    display: z.ZodOptional<z.ZodArray<z.ZodObject<{
        locale: z.ZodString;
        label: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        locale: string;
        label: string;
        description?: string | undefined;
    }, {
        locale: string;
        label: string;
        description?: string | undefined;
    }>, "many">>;
    mandatory: z.ZodOptional<z.ZodBoolean>;
    sd: z.ZodOptional<z.ZodEnum<["always", "allowed", "never"]>>;
    svg_id: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: [string | number | null, ...(string | number | null)[]];
    display?: {
        locale: string;
        label: string;
        description?: string | undefined;
    }[] | undefined;
    mandatory?: boolean | undefined;
    sd?: "never" | "always" | "allowed" | undefined;
    svg_id?: string | undefined;
}, {
    path: [string | number | null, ...(string | number | null)[]];
    display?: {
        locale: string;
        label: string;
        description?: string | undefined;
    }[] | undefined;
    mandatory?: boolean | undefined;
    sd?: "never" | "always" | "allowed" | undefined;
    svg_id?: string | undefined;
}>;
/** ---------- §6.2 Type Metadata Document ---------- */
export declare const TypeMetadata: z.ZodEffects<z.ZodObject<{
    vct: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    extends: z.ZodOptional<z.ZodString>;
    "extends#integrity": z.ZodOptional<z.ZodString>;
    display: z.ZodOptional<z.ZodArray<z.ZodObject<{
        locale: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        rendering: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            simple: z.ZodOptional<z.ZodObject<{
                logo: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    "uri#integrity": z.ZodOptional<z.ZodString>;
                    alt_text: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                }, {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                }>>;
                background_image: z.ZodOptional<z.ZodObject<{
                    uri: z.ZodString;
                    "uri#integrity": z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                }, {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                }>>;
                background_color: z.ZodOptional<z.ZodString>;
                text_color: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            }, {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            }>>;
            svg_templates: z.ZodOptional<z.ZodArray<z.ZodObject<{
                uri: z.ZodString;
                "uri#integrity": z.ZodOptional<z.ZodString>;
                properties: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                    orientation: z.ZodOptional<z.ZodEnum<["portrait", "landscape"]>>;
                    color_scheme: z.ZodOptional<z.ZodEnum<["light", "dark"]>>;
                    contrast: z.ZodOptional<z.ZodEnum<["normal", "high"]>>;
                }, "strip", z.ZodTypeAny, {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                }, {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                }>, {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                }, {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }, {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        }, {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        }>, {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        }, {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        locale: string;
        name: string;
        description?: string | undefined;
        rendering?: {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        } | undefined;
    }, {
        locale: string;
        name: string;
        description?: string | undefined;
        rendering?: {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        } | undefined;
    }>, "many">>;
    claims: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodNull, z.ZodNumber]>, "atleastone">;
        display: z.ZodOptional<z.ZodArray<z.ZodObject<{
            locale: z.ZodString;
            label: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            locale: string;
            label: string;
            description?: string | undefined;
        }, {
            locale: string;
            label: string;
            description?: string | undefined;
        }>, "many">>;
        mandatory: z.ZodOptional<z.ZodBoolean>;
        sd: z.ZodOptional<z.ZodEnum<["always", "allowed", "never"]>>;
        svg_id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: [string | number | null, ...(string | number | null)[]];
        display?: {
            locale: string;
            label: string;
            description?: string | undefined;
        }[] | undefined;
        mandatory?: boolean | undefined;
        sd?: "never" | "always" | "allowed" | undefined;
        svg_id?: string | undefined;
    }, {
        path: [string | number | null, ...(string | number | null)[]];
        display?: {
            locale: string;
            label: string;
            description?: string | undefined;
        }[] | undefined;
        mandatory?: boolean | undefined;
        sd?: "never" | "always" | "allowed" | undefined;
        svg_id?: string | undefined;
    }>, "many">>;
    "vct#integrity": z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    vct: string;
    name?: string | undefined;
    description?: string | undefined;
    display?: {
        locale: string;
        name: string;
        description?: string | undefined;
        rendering?: {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        } | undefined;
    }[] | undefined;
    "extends#integrity"?: string | undefined;
    "vct#integrity"?: string | undefined;
    extends?: string | undefined;
    claims?: {
        path: [string | number | null, ...(string | number | null)[]];
        display?: {
            locale: string;
            label: string;
            description?: string | undefined;
        }[] | undefined;
        mandatory?: boolean | undefined;
        sd?: "never" | "always" | "allowed" | undefined;
        svg_id?: string | undefined;
    }[] | undefined;
}, {
    vct: string;
    name?: string | undefined;
    description?: string | undefined;
    display?: {
        locale: string;
        name: string;
        description?: string | undefined;
        rendering?: {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        } | undefined;
    }[] | undefined;
    "extends#integrity"?: string | undefined;
    "vct#integrity"?: string | undefined;
    extends?: string | undefined;
    claims?: {
        path: [string | number | null, ...(string | number | null)[]];
        display?: {
            locale: string;
            label: string;
            description?: string | undefined;
        }[] | undefined;
        mandatory?: boolean | undefined;
        sd?: "never" | "always" | "allowed" | undefined;
        svg_id?: string | undefined;
    }[] | undefined;
}>, {
    vct: string;
    name?: string | undefined;
    description?: string | undefined;
    display?: {
        locale: string;
        name: string;
        description?: string | undefined;
        rendering?: {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        } | undefined;
    }[] | undefined;
    "extends#integrity"?: string | undefined;
    "vct#integrity"?: string | undefined;
    extends?: string | undefined;
    claims?: {
        path: [string | number | null, ...(string | number | null)[]];
        display?: {
            locale: string;
            label: string;
            description?: string | undefined;
        }[] | undefined;
        mandatory?: boolean | undefined;
        sd?: "never" | "always" | "allowed" | undefined;
        svg_id?: string | undefined;
    }[] | undefined;
}, {
    vct: string;
    name?: string | undefined;
    description?: string | undefined;
    display?: {
        locale: string;
        name: string;
        description?: string | undefined;
        rendering?: {
            simple?: {
                logo?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                    alt_text?: string | undefined;
                } | undefined;
                background_image?: {
                    uri: string;
                    "uri#integrity"?: string | undefined;
                } | undefined;
                background_color?: string | undefined;
                text_color?: string | undefined;
            } | undefined;
            svg_templates?: {
                uri: string;
                "uri#integrity"?: string | undefined;
                properties?: {
                    orientation?: "portrait" | "landscape" | undefined;
                    color_scheme?: "light" | "dark" | undefined;
                    contrast?: "normal" | "high" | undefined;
                } | undefined;
            }[] | undefined;
        } | undefined;
    }[] | undefined;
    "extends#integrity"?: string | undefined;
    "vct#integrity"?: string | undefined;
    extends?: string | undefined;
    claims?: {
        path: [string | number | null, ...(string | number | null)[]];
        display?: {
            locale: string;
            label: string;
            description?: string | undefined;
        }[] | undefined;
        mandatory?: boolean | undefined;
        sd?: "never" | "always" | "allowed" | undefined;
        svg_id?: string | undefined;
    }[] | undefined;
}>;
/** ---------- Exported Types ---------- */
export type TypeMetadata = z.infer<typeof TypeMetadata>;
export type ClaimMetadataEntry = z.infer<typeof ClaimMetadataEntry>;
export type TypeDisplayEntry = z.infer<typeof TypeDisplayEntry>;
export type ClaimDisplayEntry = z.infer<typeof ClaimDisplayEntry>;
export type ClaimPath = z.infer<typeof ClaimPath>;
export type SvgTemplateEntry = z.infer<typeof SvgTemplateEntry>;
//# sourceMappingURL=SdJwtVcTypeMetadataSchema.d.ts.map