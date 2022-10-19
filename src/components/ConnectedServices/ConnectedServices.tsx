import Polyglot from "node-polyglot";
import ConnectedServiceCard from "./ConnectedServiceCard";

import uniLogo from '../../static/icons/uni-logo.png';
import verifierLogo from '../../static/icons/verifier.png';
import ministryLogo from '../../static/icons/minlogo.png';

const ConnectedServices: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	return (
		<div className="gunet-container stable">
			<ConnectedServiceCard 
				action={() => { window.location.href = '/' }}
				title={polyglot.t('Wallet.tab3.vid')}
				logo={ministryLogo}
			/>
			<ConnectedServiceCard 
				action={() => { window.location.href = 'http://localhost:8000' }}
				title={polyglot.t('Wallet.tab3.diplomaHeader')}
				subtitle={polyglot.t('Wallet.tab3.diplomaDesc')}
				logo={uniLogo}
			/>
			<ConnectedServiceCard 
				action={() => { window.location.href = '/' }}
				title={polyglot.t('Wallet.tab3.verifyHeader')}
				subtitle={polyglot.t('Wallet.tab3.verifyDesc')}
				logo={verifierLogo}
			/>
		</div>
	);
}

export default ConnectedServices;