import { useState, useEffect, useContext } from "react";
import StatusRibbon from '../../components/Credentials/StatusRibbon';
import ContainerContext from '../../context/ContainerContext';


export const CredentialImage = ({ credential, className, onClick, showRibbon = true }) => {
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
			{parsedCredential && (
				<>
					<img src={parsedCredential.credentialImage.credentialImageURL} alt={"Credential"} className={className} onClick={onClick} />
					{showRibbon &&
						<StatusRibbon credential={credential} />
					}
				</>
			)}
		</>
	);
};
