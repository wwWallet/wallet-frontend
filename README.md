# Wallet Frontend


## Install dependancies

```
yarn install
```

## Edit configuration

Copy src/config.template.js to src/config.dev.js and edit the config dev file
## Run

```
yarn start
```

## Error Codes

**Initiate_Issuance.tsx && Consent.tsx**: _(oidc flow)_
* **1000**: Invalid Authentication Response
* **1001**: Network Error on Token Request
* **1002**: No issuer url was found
* **1003**: Error generating proof for nonce
* **1004**: Network Error on Credential Request
* **1005**: No issuer metadata were found
* **1006**: Error creating redirectUrl. Check your config.
