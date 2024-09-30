import { useState, useEffect } from "react";
import { parseCredential } from "../../functions/parseCredential";
import StatusRibbon from '../../components/Credentials/StatusRibbon';
import RenderSvgTemplate from "./RenderSvgTemplate";

export const CredentialImage = ({ credential, className, onClick, showRibbon = true }) => {
	const [parsedCredential, setParsedCredential] = useState(null);
	const [svgImage, setSvgImage] = useState(null);

	useEffect(() => {
		parseCredential(credential).then((c) => {
			setParsedCredential(c);
		});
	}, [credential]);

	const handleSvgGenerated = (svgUri) => {
		setSvgImage(svgUri);
	};

	return (
		<>
			{parsedCredential && (
				<>
					{parsedCredential.renderMethod && (
						<RenderSvgTemplate credential={parsedCredential} onSvgGenerated={handleSvgGenerated} />
					)}
					{svgImage ? (
						<img src={svgImage} alt={"Credential"} className={className} onClick={onClick} />
					) : (
						<img src={parsedCredential.credentialBranding.image.url} alt={"Credential"} className={className} onClick={onClick} />
					)}
					{showRibbon && <StatusRibbon credential={credential} />}
				</>
			)}
		</>
	);
};
