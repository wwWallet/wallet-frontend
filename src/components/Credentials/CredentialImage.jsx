import DefaultCred from "@/assets/images/cred.png";

import UsagesRibbon from "./UsagesRibbon";
import ExpiredRibbon from './ExpiredRibbon';

const CredentialImage = ({ vcEntity, className, onClick, showRibbon = true, vcEntityInstances = null, supportHover = true }) => {
	//Render
	return (
		<div className={`relative ${className} group`}>
			{vcEntity && (
				<img 
					src={vcEntity.parsedCredential.metadata.credential.image.dataUri !== "" ? vcEntity.parsedCredential.metadata.credential.image.dataUri : DefaultCred} 
					alt={"Credential"} 
					onClick={onClick} 
					className={className}
				/>
			)}

			{vcEntity && showRibbon &&
				<ExpiredRibbon vcEntity={vcEntity} />
			}
			
			{vcEntityInstances && showRibbon &&
				<UsagesRibbon vcEntityInstances={vcEntityInstances} />
			}
			
			{supportHover &&
				<div className="z-40 absolute inset-0 rounded-xl transition-opacity bg-c-lm-gray-100 dark:bg-c-dm-gray-900 opacity-0 group-hover:opacity-25 transition-opacity duration-150" />
			}
		</div>
	);
};

export default CredentialImage;
