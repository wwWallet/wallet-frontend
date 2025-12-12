<img src="./branding/default/logo/logo_dark.svg" width="80" style="max-width: 100%; float:left; margin-right: 20px;"/>

# wwWallet

![Greek (EL) Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/wwWallet/wallet-frontend/master/translation_coverage/coverage_el.json)
![Portuguese (PT) Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/wwWallet/wallet-frontend/master/translation_coverage/coverage_pt.json)

Welcome to wwWallet Frontend repository! This application is a user-friendly web wallet that empowers users to manage their digital credentials effortlessly. With a seamless interface and powerful features, users can view their credentials, obtain new ones from issuers, present credentials to verifiers, and access their presentation history.

## Table of Contents

- ✨ [Features](#features)
- 🔍 [Prerequisites](#prerequisites)
- 📦 [Installation](#installation)
- ✅ [Pre-commit Hook](#pre-commit-hook)
- 🚀 [Usage](#usage)
- 🔐 [PRF Compatibility](#prf-compatibility)
- 🎨 [Tailwind CSS](#tailwind-css)
- 💡 [Contributing](#contributing)

## ✨Features

Our Web Wallet provides a range of features tailored to enhance the credential management experience:

- **Credential Display:** Users can easily view their stored digital credentials in a structured manner, making it simple to keep track of their qualifications.

- **Issuer Interaction:** Seamless integration with issuers allows users to request and receive new digital credentials directly within the wallet.

- **Verifier Presentation:** Users can present their credentials to verifiers using the wallet, providing a secure and efficient method of showcasing their qualifications.

- **Presentation History:** The wallet maintains a history of credential presentations, allowing users to review and track when and where they've shared their credentials.

## 🔍Prerequisites

- Node.js
- npm/yarn

## 📦Installation

- Clone the repository:

- **Option 1: Using HTTPS**

  ```bash
  git clone https://github.com/your-username/wallet-frontend.git
  ```

- **Option 2: Using SSH**

  ```bash
  git clone git@github.com:your-username/wallet-frontend.git
  ```

- Navigate to the project folder:

  ```bash
  cd wallet-frontend
  ```

- Configure Environment Variables:
  The project uses environment variables to manage different configurations. A `.env` file is used to keep all these variables. There is a `.env.template` file in the repository. Copy it and rename it to `.env`.

  ```bash
  cp .env.template .env
  ```

  Now, open the .env file and fill in the variables according to your own configuration. Below is an explanation for each variable:

  - HOST: The IP address where your app will be running (default is '0.0.0.0').
  - PORT: The port on which your app will run (default is 3000).
  - VITE_WS_URL: The URL of the websocket service.
  - VITE_WALLET_BACKEND_URL: The URL of your backend service.
  - VITE_LOGIN_WITH_PASSWORD: A Boolean value which show/hide the classic login/signup.
  - VITE_DISPLAY_CONSOLE: Handle console logs (`true` or `false`). If left empty, it will be handled as `true`.
  - VITE_INACTIVE_LOGOUT_SECONDS: Session will time out after approximately this time in seconds since the last user activity (default is 15 minutes).
  - VITE_WEBAUTHN_RPID: WebAuthn relying party ID (when running locally, set to `localhost`). This must match the `config.webauthn.rp.id` setting in `wallet-backend-server`.
  - VITE_OPENID4VCI_REDIRECT_URI: Redirect uri after authentication and token request at the authorization server in OID4VCI flow.
  - VITE_OPENID4VP_SAN_DNS_CHECK: Verify at the OID4VP incoming authorization request that the SAN contained in the certificate is the same with the response_uri (`true` or `false`).
  - VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS: Flag to switch (`true` or `false`) the Subject Alternative Name validation of the certificates during the OpenID4VP.
  - VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS: Flag to switch (`true` or `false`) the validation of issued credentials with the registered trust anchors that were defined in the wallet-backend-server.
  - VITE_MULTI_LANGUAGE_DISPLAY: Enable or disable multi-language support (`true` or `false`). If left empty, it will be handled as `false`.
  - VITE_CLOCK_TOLERANCE: Αpplied on the verification of timestamps in credential signatures (default is 60 seconds).
  - VITE_STATIC_PUBLIC_URL: The installation's public url
  - VITE_STATIC_NAME: The installation's public name
  - VITE_I18N_WALLET_NAME_OVERRIDE: String to override translations of common.walletName (Optional)
  - VITE_DISPLAY_ISSUANCE_WARNINGS: Enable or disable (`true` or `false`) the display of the issuance warnings popup
  - VITE_OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: Configure the maximum accepted batch size during an OpenID4VCI flow
  - VITE_WELLKNOWN_APPLE_APPIDS: Used to generate the `.well-known/apple-app-site-association` file, used for IOS wrappers. This should be in the format `"<APP_ID>,<APP_ID>,<APP_ID>,..."` Can be left blank.
  - VITE_WELLKNOWN_ANDROID_PACKAGE_NAMES_AND_FINGERPRINTS: Used to generate the `.well-known/assetlinks.json` file, used for Android wrappers. This should be in the format `"<PKG_NAME>::<FINGERPRINT>,<PKG_NAME>::<FINGERPRINT>,<PKG_NAME>::<FINGERPRINT>,..."` Can be left blank.

- Install dependencies:
    ```bash
    yarn install
    ```

- Start the development server:

    ```bash
    yarn start
    ```

## ✅Pre-commit Hook

We use [pre-commit](https://pre-commit.com/) to enforce our `.editorconfig` before code is committed.

### One-time setup

```
# install pre-commit if you don’t already have it
pip install pre-commit       # or brew install pre-commit / pipx install pre-commit

# enable the git hook in this repo
pre-commit install

# optional: clean up the repo on demand
pre-commit run --all-files

git add -A
```

### What happens on commit

- Auto-fixers run (e.g. add final newlines).
- After the auto-fixers, the editorconfig-checker runs inside Docker to validate all staged files.
- If violations remain, fix them manually until the commit passes.

## 🚀Usage

Once the development server is running, you can access the app by visiting http://localhost:3000 in your web browser. The app provides various pages and components that you can interact with. Explore the features and enjoy using the Wallet Frontend!

## 🔐PRF Compatibility

The wwWallet Frontend is designed to be compatible with the PRF extension to WebAuthn, ensuring a streamlined and secure registration and authentication process. Below, we present specific compatibility scenarios based on the operating system, emphasizing both WebAuthn and PRF extension compatibility.

### Compatibility Description

The PRF (Pseudo Random Function) extension in WebAuthn enables the evaluation of a hash message authentication code stored on the security key during the retrieval of a credential. This mechanism is crucial for generating secret keys vital for encrypting user data. While WebAuthn supports various authentication methods, the focus of this table is the compatibility with the PRF extension.

### PRF Compatibility Scenarios Support by Operating System and Latest Browser Versions

<table>
  <thead>
    <tr>
      <th rowspan="2">OS</th>
      <th rowspan="2">Authenticator</th>
      <th rowspan="2">Transport</th>
      <th colspan="4">PRF Compatibility</th>
    </tr>
    <tr>
      <th style="display:flex;align-items:center;border:none;">
        <img  src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/240px-Google_Chrome_icon_%28February_2022%29.svg.png" alt="Chrome" height="24"/>
        <img style="margin-left:5px;" src="https://upload.wikimedia.org/wikipedia/commons/5/51/Brave_icon_lionface.png" alt="Brave" height="24"/>
        <img style="margin-left:5px;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Microsoft_Edge_logo_%282019%29.svg/128px-Microsoft_Edge_logo_%282019%29.svg.png" alt="Microsoft Edge" height="24"/>
        <img style="margin-left:5px;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Opera_2015_icon.svg/240px-Opera_2015_icon.svg.png" alt="Opera" height="24"/>
      </th>
      <th><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/250px-Firefox_logo%2C_2019.svg.png" alt="Firefox" height="24"/></th>
      <th><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Safari_browser_logo.svg/129px-Safari_browser_logo.svg.png" alt="Safari" height="24"/></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Linux</td>
      <td>Linux</td>
      <td>Internal</td>
      <td> </td>
      <td> </td>
      <td> </td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>Android</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>iOS</td>
      <td>Hybrid</td>
      <td>❌</td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>Linux</td>
      <td>FIDO Security Key</td>
      <td>USB</td>
      <td>✅</td>
      <td>✅</td>
      <td> </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>Windows</td>
      <td>Internal</td>
      <td>❌</td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>Android</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>✅</td>
      <td> </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>iOS</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>✅</td>
      <td> </td>
    </tr>
    <tr>
      <td>Windows</td>
      <td>FIDO Security Key</td>
      <td>USB</td>
      <td>✅</td>
      <td>✅</td>
      <td> </td>
    </tr>
    <tr>
      <td>MacOS</td>
      <td>MacOS</td>
      <td>Internal</td>
      <td>✅</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>MacOS</td>
      <td>Android</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>❌</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>MacOS</td>
      <td>iOS</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>❌</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>MacOS</td>
      <td>FIDO Security Key</td>
      <td>USB</td>
      <td>✅</td>
      <td>❌</td>
      <td>❌</td>
    </tr>
    <tr>
      <td>Android</td>
      <td>Android</td>
      <td>Internal</td>
      <td>✅</td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>Android</td>
      <td>Android</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>Android</td>
      <td>iOS</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>Android</td>
      <td>FIDO Security Key</td>
      <td>USB</td>
      <td>✅<sup>[1]</sup></td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>Android</td>
      <td>FIDO Security Key</td>
      <td>NFC</td>
      <td>❌</td>
      <td>❌</td>
      <td> </td>
    </tr>
    <tr>
      <td>iOS</td>
      <td>iOS</td>
      <td>Internal</td>
      <td>✅</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>iOS</td>
      <td>Android</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>iOS</td>
      <td>iOS</td>
      <td>Hybrid</td>
      <td>✅</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>iOS</td>
      <td>FIDO Security Key</td>
      <td>USB</td>
      <td>❌</td>
      <td>❌</td>
      <td>❌</td>
    </tr>
    <tr>
      <td>iOS</td>
      <td>FIDO Security Key</td>
      <td>NFC</td>
      <td>❌</td>
      <td>❌</td>
      <td>❌</td>
    </tr>
  </tbody>
</table>

<sup>[1]</sup> **Note on Android with FIDO Security Keys over USB:** It's essential to have **Google Play Services (GPS) version 24.08.12 or later**.

**\*Notes:**
- Additional information about WebAuthn browser compatibility, can be found on Yubico's [WebAuthn](https://developers.yubico.com/WebAuthn/WebAuthn_Browser_Support/) and [PRF](https://developers.yubico.com/WebAuthn/Concepts/PRF_Extension/Developers_Guide_to_PRF.html) Developers page.
- ✅-marked scenarios have been confirmed using the latest public releases of relevant browsers, operating systems, and other dependencies at the time of testing.
- In this table, we use the term "FIDO Security Key" to refer to compatible security keys. It's important to understand that any security key should work with the hmac-secret extension, provided it supports this feature.
  For a detailed list of security key models that support hmac-secret, you can refer to the [FIDO MDS Explorer](https://opotonniee.github.io/fido-mds-explorer/), where hmac-secret support is listed under metadataStatement > authenticatorGetInfo > extensions.\*
- **Mozilla Firefox supports the PRF extension** starting with **version 135.0 or later** except on iOS. This is because Firefox generally uses the Gecko engine, but on iOS, all browsers are required to run on WebKit.
- iOS supports PRF extension starting with the **iOS 18** release.

The wwWallet is committed to delivering a secure and adaptable authentication experience with an emphasis on PRF extension compatibility.

## 🎨Tailwind CSS

This project utilizes **Tailwind CSS**, a utility-first CSS framework that enables rapid development of custom user interfaces with minimal effort. Tailwind CSS offers a collection of utility classes that make styling components and layouts a breeze, eliminating the need for writing extensive custom CSS.

### Styling with Utility Classes

To apply styles using Tailwind CSS, you can directly add utility classes to your HTML or JSX components. For example, to apply padding, margin, text color, and more:

```html
<div class="p-4 m-2 text-blue-500">Styled with Tailwind CSS</div>
```

### Customization

Tailwind CSS provides an extensive set of default styles, but you can also customize them to match your project's design. The **tailwind.config.js** file in the project's root directory allows you to customize colors, fonts, spacing, breakpoints, and more.

### Learn More

Explore the [Tailwind CSS documentation](https://tailwindcss.com/docs/installation) to learn about all the utility classes, configuration options, and techniques for building beautiful UIs efficiently.

## 💡Contributing

Want to contribute? Check out our [Contribution Guidelines](https://github.com/wwWallet/.github/blob/main/CONTRIBUTING.md) for more details!
