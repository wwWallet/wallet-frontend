import { useState, useEffect, useContext } from "react";
import ExpiredRibbon from './ExpiredRibbon';
import UsagesRibbon from "./UsagesRibbon";
import CredentialParserContext from "../../context/CredentialParserContext";

const CredentialImage = ({ credential, className, onClick, showRibbon = true, vcEntityInstances = null }) => {
	const [parsedCredential, setParsedCredential] = useState(null);
	const { credentialParserRegistry } = useContext(CredentialParserContext);

	useEffect(() => {
		if (credentialParserRegistry) {
			credentialParserRegistry.parse(credential).then((c) => {
				if ('error' in c) {
					return;
				}
				setParsedCredential(c);
			});
		}

	}, [credential, credentialParserRegistry]);

	return (
		<>
			{parsedCredential && parsedCredential.credentialImage && (
				<img src={parsedCredential.credentialImage.credentialImageURL} alt={"Credential"} className={className} onClick={onClick} />
			)}
			{parsedCredential && showRibbon &&
				<ExpiredRibbon parsedCredential={parsedCredential.beautifiedForm} />
			}
			{vcEntityInstances && showRibbon &&
				<UsagesRibbon vcEntityInstances={vcEntityInstances} />
			}
		</>
	);
};

export default CredentialImage;
