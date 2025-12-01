# Branding wwWallet

Some elements of wwWallet can be customized, allowing you to apply your own branding. We’re currently working to expand these customization options for even greater flexibility.

All the currently available customization options are listed here.

## Custom Logo

wwWallet supports using a custom logo. To ensure your logo displays correctly across the app, make sure it meets the following requirements:

* **Aspect ratio:** 1:1 (square)
* **Shape:** Circular, or include generous padding (the logo is rendered inside a loading spinner)

### Adding Your Custom Logos

1. Inside the `branding` directory (this folder), create a new folder named **`custom`**.
2. Add your logo files to `branding/custom` using the following filenames:

   * `logo_light.svg` **or** `logo_light.png`
   * `logo_dark.svg` **or** `logo_dark.png`
     **Both light and dark versions are required.**
3. Supported formats:

   * **SVG (recommended)** for crisp scaling and smaller file size
   * **PNG** with a minimum resolution of **512×512**

Vite will automatically detect these files and generate all the necessary logo assets used throughout the application.

If changes don’t appear immediately, try reloading the browser. If the logos still don’t update, restart the development server.
