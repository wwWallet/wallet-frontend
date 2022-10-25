

import React, { useEffect, useState } from "react";
import Polyglot from "node-polyglot";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExclamationCircle, faCheck } from '@fortawesome/free-solid-svg-icons'
import './VerificationResults.css';

const VerificationResults: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {
	return(
		<div id="VerificationResults">
			<div className="gunet-container">
				<section className="layout">
				<FontAwesomeIcon className="resultIcon" icon={faCheck} />
				Verification success
				</section>

			</div>
		</div>

	)
}


export default VerificationResults;