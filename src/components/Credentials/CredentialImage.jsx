import ExpiredRibbon from './ExpiredRibbon';
import UsagesRibbon from "./UsagesRibbon";

const CredentialImage = ({ vcEntity, className, onClick, showRibbon = true, vcEntityInstances = null }) => {

	return (
		<>
			{vcEntity && (
				<img src={vcEntity.parsedCredential.metadata.credential.image.dataUri} alt={"Credential"} className={className} onClick={onClick} />
			)}
			{vcEntity && showRibbon &&
				<ExpiredRibbon vcEntity={vcEntity} />
			}
			{vcEntityInstances && showRibbon &&
				<UsagesRibbon vcEntityInstances={vcEntityInstances} />
			}
		</>
	);
};

export default CredentialImage;
