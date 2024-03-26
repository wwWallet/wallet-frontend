import { useState, useEffect } from "react"
import { parseCredential } from "../../functions/parseCredential";
import StatusRibbon from '../../components/Credentials/StatusRibbon';


export const CredentialImage = ({ credential, className, onClick }) => {
	const [parsedCredential, setParsedCredential] = useState(null);

	useEffect(() => {
		parseCredential(credential).then((c) => {
			setParsedCredential(c);
		});
	}, []);

	return (
		<>
			{parsedCredential &&(
				<>
				<img src={parsedCredential.credentialBranding.image.url} alt={"Credential"} className={className} onClick={onClick} />
				<StatusRibbon credential={credential}/>
				</>
			)}
		</>
	)
}
