import Polyglot from "node-polyglot";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RingLoader from "react-spinners/RingLoader";
import config from "../../config/config.dev";
import './Consent.css';
import { credentialRequest, getIssuerMetadata, tokenRequest, verifyIssuer, verifyState } from "../../utils/IssuanceUtils";
import { TokenResponseDTO } from "../../interfaces/Issuance-dto";
import ErrorModal from "../Modals/ErrorModal";



const override: any = {
	display: "block",
	margin: "0 auto",
	borderColor: "#003476"
};

const ringColor: string = "#003476";

const Consent: React.FC<{ lang: string, polyglot: Polyglot }> = ({ lang, polyglot }) => {

	const [issuerName, setIssuerName] = useState("");

	const [authCode, setAuthCode] = useState("");

	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);

	const [errModal, setErrModal] = useState(false);
	const handleOpenErrModal = () => {
		setErrModal(true);
	}
	const handleCloseErrModal = () => {
		setErrModal(false);
		window.location.href = '/';
	}
	const [err, setErr] = useState("");

	useEffect(() => {
		var displayList;
		try {
			// only need to guard getIssuerMetadata() with try-catch blocks on the two useEffect functions
			// if component mounts and they work, then we assume we are ok later in the function.
			displayList = getIssuerMetadata().credential_issuer.display;
		}
		catch (err) {
			window.location.href = '/error?code=1005';
			return;
		}
		// set issuer name from the Display object
		for (const d of displayList) {
			if (d["locale"].toLowerCase().startsWith(lang)) {
				setIssuerName(d["name"]);
			}
		}
		const authRes = authorizationResponse();
		if (!authRes.ok) {
			setErr('Invalid Authentication Response');
			window.location.href = '/error?code=1004';
			return;
		}
		else
			setAuthCode(authRes.code);
	}, [])

	useEffect(() => { // if lang is changed, then update the issuerName
		var displayList;
		try {
			displayList = getIssuerMetadata().credential_issuer.display;
		}
		catch (err) {
			window.location.href = '/error?code=1005';
			return;
		}
		// set issuer name from the Display object
		for (const d of displayList) {
			if (d["locale"].toLowerCase().startsWith(lang)) {
				setIssuerName(d["name"]);
			}
		}
	}, [lang]);

	const authorizationResponse = (): { ok: boolean, code: string } => {
		const code = searchParams.get('code');
		const state = searchParams.get('state');

		if (code === null)
			return { ok: false, code: "" };

		if (state !== null && verifyState(state))
			return { ok: true, code: code };
		else {
			return { ok: false, code: "" };
		}
	}


	const handleTokenRequest = async () => {

		setLoading(true);
		const getTokenResponse = await tokenRequest(authCode);
		if (getTokenResponse.success == false) {
			window.location.href = `/error?code=${getTokenResponse.errorCode}`;
			return;
		}
		const tokenResponse: TokenResponseDTO = getTokenResponse.tokenResponse;
		const verifyIssuerResponse = await verifyIssuer(tokenResponse.id_token);

		if (verifyIssuerResponse.status === true) {
			await handleCredentialRequest(tokenResponse);
		}
		else {
			console.log('Error verifying Issuer Response: ', verifyIssuerResponse.error);
			setErr(verifyIssuerResponse.error);
			handleOpenErrModal();
		}

	}

	const handleCredentialRequest = async (tokenResponse: TokenResponseDTO) => {

		const credentialResponse = await credentialRequest(tokenResponse);
		if (credentialResponse.success == false) {

			if(credentialResponse.errorCode == 1007) {	//verification error
				console.log('Error verifying Credential Response: ', credentialResponse.errorText);
				setErr(credentialResponse.errorText ? credentialResponse.errorText : '');
				handleOpenErrModal();
				return;
			}

			window.location.href = `/error?code=${credentialResponse.errorCode}`;
			return;
		}

		if (!config.devConformance.usage)
			window.location.href = '/';
	}

	return (
		<>
			{!loading
				?
				<div className="gunet-container">
					<h1>{polyglot.t('Consent.title')}</h1>
					<img className="issuerLogo" src={getIssuerMetadata().credential_issuer.display[0]["logo"]} alt="Issuer's logo" height={200} />
					<h4>{polyglot.t('Consent.description1')}
						<b><i>{` "${issuerName}" `}</i></b>
						{polyglot.t('Consent.description2')}
					</h4>
					<button
						className="small login-button ui fancy button"
						onClick={handleTokenRequest}>
						{polyglot.t('Consent.buttonConsent')}
					</button>
					<button
						className="small login-button ui fancy button"
						onClick={() => { }}>
						{polyglot.t('Consent.buttonDecline')}
					</button>
				</div>
				:
				<div className="gunet-container Loading">
					<div className='recenter'>
						<h2>{polyglot.t('Consent.VerifyIssuerLoadingScreen')}</h2>
					</div>
					<RingLoader color={ringColor} loading={true} css={override} size={300} speedMultiplier={0.3} />
				</div>
			}
			<ErrorModal isOpen={errModal} handleClose={handleCloseErrModal} polyglot={polyglot} err={err} />
		</>
	);
}

export default Consent;