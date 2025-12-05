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
