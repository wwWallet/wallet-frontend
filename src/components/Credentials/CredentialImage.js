import { useState, useEffect, useContext } from "react";
import StatusRibbon from '../../components/Credentials/StatusRibbon';
import ContainerContext from '../../context/ContainerContext';
import RenderSvgTemplate from "./RenderSvgTemplate";

export const CredentialImage = ({ credential, className, onClick, showRibbon = true }) => {
	const [parsedCredential, setParsedCredential] = useState(null);
	const [svgImage, setSvgImage] = useState(null);
	const container = useContext(ContainerContext);

	useEffect(() => {
		if (container) {
			container.credentialParserRegistry.parse(credential).then((c) => {
				if ('error' in c) {
					return;
				}
				console.log('->',c)
				setParsedCredential(c);
			});
		}

	}, [credential, container]);

	const handleSvgGenerated = (svgUri) => {
		setSvgImage(svgUri);
	};

	return (
		<>
			{parsedCredential && parsedCredential.credentialImage && parsedCredential.credentialImage.credentialImageSvgTemplateURL ? (
				<>
					<RenderSvgTemplate credential={parsedCredential} onSvgGenerated={handleSvgGenerated} />
					{parsedCredential && svgImage && (
						<img src={svgImage} alt={"Credential"} className={className} onClick={onClick} />
					)}
				</>
			) : parsedCredential && parsedCredential.credentialImage && parsedCredential.credentialImage.credentialImageURL && (
				<img src={parsedCredential.credentialImage.credentialImageURL} alt={"Credential"} className={className} onClick={onClick} />
			)}

			{parsedCredential && showRibbon &&
				<StatusRibbon credential={credential} />
			}
		</>
	);
};
