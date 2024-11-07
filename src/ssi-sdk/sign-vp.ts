import { KeyLike, SignJWT, SignOptions } from "jose";

/**
 * @example
 * ```
 * 	const vpjwt = await new SignVerifiablePresentationJWT()
 *		.setProtectedHeader({ alg: "ES256K", typ: "JWT" })
 *		.setAudience(wallet.did)
 *		.setIssuer(wallet.did)
 *		.setHolder(wallet.did)
 *		.setNonce("1233efw23d2e4f4f")
 *		.setVerifiableCredential([vcjwt])
 *		.sign(holderPrivateKey);
 * ```
 */
export class SignVerifiablePresentationJWT extends SignJWT {


	private vp: any;
	/**
	 *
	 * @param verifiableCredential must be in jwt_vc format or array of jwt_vc
	 */
	constructor() {
		super({});

		// This pre-initialization of jwt.vp attribute, maintains structure of the vp
		this.vp = {
			"@context": [],
			type: [],
			holder: "",
			id: "",
			verifiableCredential: [],
			issuer: undefined,
			audience: "",
			issued: "",
			issuanceDate: "",
			validFrom: "",
			expirationDate: "",
			credentialSchema: {
				id: "",
				type: ""
			}
		};
	}

	setVerifiableCredential(verifiableCredential: any[]): this {
		this.vp.verifiableCredential = verifiableCredential;
		return this;
	}

	override setAudience(audience: string | string[]): this {
		super.setAudience(audience);
		this.vp.audience = audience;
		return this;
	}

	setHolder(holder: string): this {
		this.vp.holder = holder;
		return this;
	}

	override setIssuer(issuer: string | any): this {
		if (typeof issuer == 'string') {
			super.setIssuer(issuer);
		}
		else {
			super.setIssuer(issuer.id);
		}

		this.vp.issuer = issuer;
		return this;
	}

	override setJti(jwtId: string): this {
		super.setJti(jwtId);
		this.vp.id = jwtId;
		return this;
	}

	override setIssuedAt(input?: number): this {
		super.setIssuedAt(input);	// this function sets iat
		if(this._payload.iat) {	// due to the above line, these are safe
			this.vp["issuanceDate"] = new Date(this._payload.iat * 1000).toISOString();
			this.vp["issued"] = new Date(this._payload.iat * 1000).toISOString();
			this.vp["validFrom"] = new Date(this._payload.iat * 1000).toISOString();
		}
		return this;
	}

	setNonce(nonce: string): this {
		this._payload["nonce"] = nonce;
		return this;
	}

	setCredentialSchema(schemaUri: string, type: string = "FullJsonSchemaValidator2021"): this {
		this.vp.credentialSchema = {
			id: schemaUri,
			type: type
		};
		return this;
	}

	setContext(context: string[]): this {
		this.vp["@context"] = context;
		return this;
	}

	setType(type: string[]): this {
		this.vp.type = type;
		return this;
	}

	override setExpirationTime(input: string | number): this {
		super.setExpirationTime(input);		// this function sets exp
		if(this._payload.exp)	// due to the above line, this is safe
			this.vp.expirationDate = new Date(this._payload.exp * 1000).toISOString();
		return this;
	}

	override async sign(key: KeyLike | Uint8Array, options?: SignOptions): Promise<string> {
		this._payload.vp = this.vp;
		const jwt = await super.sign(key, options);
		return jwt;
	}
}
