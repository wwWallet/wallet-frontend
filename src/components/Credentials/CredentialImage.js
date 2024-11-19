import { useState, useEffect, useContext } from "react";
import StatusRibbon from '../../components/Credentials/StatusRibbon';
import UsagesRibbon from "../../components/Credentials/UsagesRibbon";
import ContainerContext from '../../context/ContainerContext';

const CredentialImage = ({ credential, className, onClick, showRibbon = true, vcEntityInstances = null }) => {
	const [parsedCredential, setParsedCredential] = useState(null);
	const container = useContext(ContainerContext);

	useEffect(() => {
		if (container) {
			container.credentialParserRegistry.parse(credential).then((c) => {
				if ('error' in c) {
					return;
				}
				setParsedCredential(c);
			});
		}

	}, [credential, container]);

	return (
		<>
			{parsedCredential && parsedCredential.credentialImage && (
				<img src={parsedCredential.credentialImage.credentialImageURL} alt={"Credential"} className={className} onClick={onClick} />
			)}
			{parsedCredential && showRibbon &&
				<StatusRibbon parsedCredential={parsedCredential} />
			}
			{vcEntityInstances && showRibbon &&
				<UsagesRibbon vcEntityInstances={vcEntityInstances} />
			}
		</>
	);
};

export default CredentialImage;
