import ExpiredRibbon from './ExpiredRibbon';
import UsagesRibbon from "./UsagesRibbon";

const CredentialImage = ({ parsedCredential, className, onClick, showRibbon = true, vcEntityInstances = null }) => {

	return (
		<>
			{parsedCredential && (
				<img src={parsedCredential.credentialImage.credentialImageURL} alt={"Credential"} className={className} onClick={onClick} />
			)}
			{parsedCredential && showRibbon &&
				<ExpiredRibbon parsedCredential={parsedCredential} />
			}
			{vcEntityInstances && showRibbon &&
				<UsagesRibbon vcEntityInstances={vcEntityInstances} />
			}
		</>
	);
};

export default CredentialImage;
