# Branding wwWallet

wwWallet offers several branding and customization options, allowing you to tailor the app to your brand’s identity. We are actively expanding these options to provide even more flexibility.

All available customization features are detailed below.

## Custom Directory Setup

To apply your branding, create a **`custom`** directory inside the `branding` folder. This directory will store all your custom assets, such as logos and favicons.

## Custom Logo

wwWallet supports the use of a custom logo. To ensure optimal display across the app, your logo must meet the following requirements:

- **Aspect ratio:** 1:1 (square)
- **Shape:** Circular, or include generous padding (the logo is rendered inside a loading spinner)

### Adding Your Custom Logos

1. Inside the `branding/custom` directory, create a new directory: `logo`.
2. Inside the new `branding/custom/logo` directory, add your logo files using the following filenames:
   - `logo_light.svg` **or** `logo_light.png`
   - `logo_dark.svg` **or** `logo_dark.png`
     **Note:** Both light and dark versions are required.

3. **Supported formats:**
   - **SVG (recommended):** Ensures crisp scaling and smaller file size.
   - **PNG:** Minimum resolution of **512×512**.

Vite will automatically detect these files and generate all necessary logo assets for the application. If changes don’t appear immediately, try reloading your browser. If the logos still don’t update, restart the development server.

## Favicon

You can customize the favicon by placing a `favicon.ico` file in the `branding/custom` directory. If no custom favicon is provided, the app will default to the standard favicon.

## Theme

You can customize the visual theme of wwWallet. We're working on adding support for more themability.

Create `branding/custom/theme.json`. It **must** stick to the format specified in [.schemas/theme.json](.schemas/theme.json).

The following options are supported. All fields shown below are required:

```json
{
  "$schema": "../.schemas/theme.json",
  "brand": {
    "color": "<hex/hsl/rgb>",
    "colorLight": "<hex/hsl/rgb>",
    "colorLighter": "<hex/hsl/rgb>",
    "colorDark": "<hex/hsl/rgb>",
    "colorDarker": "<hex/hsl/rgb>"
  }
}
```

| Property             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `$schema`            | Schema used to validate the theme configuration. |
| `brand.color`        | Primary brand color.                             |
| `brand.colorLight`   | Light variant of the brand color.                |
| `brand.colorLighter` | Lighter variant of the brand color.              |
| `brand.colorDark`    | Dark variant of the brand color.                 |
| `brand.colorDarker`  | Darker variant of the brand color.               |

### Theme option details

#### `brand`

The _brand_ color(s) is used in buttons and accent elements.
The _light_ and _lighter_ variants are used in light mode, while the _dark_ and _darker_ variants are used in dark mode.
Make sure that the contrast ratio is sufficient, in both light and dark mode.

## Screenshots

wwWallet includes screenshots in the PWA manifest. These can be customized through the branding system.

### Default location

branding/default/screenshots/
├── screen_mobile_1.png
├── screen_mobile_2.png
├── screen_tablet_1.png
└── screen_tablet_2.png

These files are copied to `public/screenshots/` during dev/build and used by the manifest.

### Custom screenshots

To override them, add your own files with the **same names** to the `branding/custom/screenshots` directory.

wwWallet will prefer custom files and fallback to defaults if any are missing.

### Screenshot sizes

The screenshots must match the sizes declared in the PWA manifest:

- Mobile: **828×1792**
- Tablet: **2160×1620**
