import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faSearch, faUndo, faTools, faUniversity, faHandshake, faCode, faGlobeAfrica, faBriefcase, faCopyright } from '@fortawesome/free-solid-svg-icons'
import './Footer.css';
import gunetLogo from '../../static/icons/gunet.svg'
import Polyglot from 'node-polyglot';

const Footer: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	return (
		<div id="FooterContainer">
			<div id='Footer'>
				<div className=' pull-left footerLinks ' id='services'>
					<ul className='footerList'>
						<h3 className='header '>{polyglot.t('Footer.services')}</h3>
						<li>
							<FontAwesomeIcon className="icon" icon={faCheckCircle} />&nbsp;&nbsp;<a href='#'>{polyglot.t(`Footer.signatureVerification`)}</a>
						</li>
						<li>
							<FontAwesomeIcon className="icon" icon={faSearch} />&nbsp;&nbsp;<a href='#'>{polyglot.t(`Footer.diplomaCheck`)}</a>
						</li>
						<li>
							<FontAwesomeIcon className="icon" icon={faUndo} />&nbsp;&nbsp;<a href='#'>{polyglot.t(`Footer.revocation`)}</a>
						</li>
						<li>
							<FontAwesomeIcon className="icon" icon={faTools} />&nbsp;&nbsp;<a href='#'>{polyglot.t(`Footer.templateHandlingApp`)}</a>
						</li>
					</ul>
				</div>
				<div className='pull-left footerLinks' id='info'>
					<ul className='footerList'>
						<h3 className='header '>{polyglot.t('Footer.info')}</h3>
						<li>
							<FontAwesomeIcon className="icon" icon={faUniversity} />&nbsp;&nbsp;<a href='https://ediplomas.gr/institutions' target="_blank" rel="noopener noreferrer">{polyglot.t(`Footer.participatingInstitutions`)}</a>
						</li>
						<li>
							<FontAwesomeIcon className="icon" icon={faHandshake} />&nbsp;&nbsp;<a href='#'>{polyglot.t(`Footer.termsOfUse`)}</a>
						</li>
						<li>
							<FontAwesomeIcon className="icon" icon={faCode} />&nbsp;&nbsp;<a href='#'>{polyglot.t(`Footer.developersGuide`)}</a>
						</li>
					</ul>
				</div>
				<div className='pull-left footerLinks ' id='contact'>
					<ul className='footerList'>
						<h3 className='header '>{polyglot.t('Footer.contact')}</h3>
						<li><span className='strong subheader'><FontAwesomeIcon className="icon" icon={faGlobeAfrica} />&nbsp;&nbsp;</span><a href='https://www.gunet.gr' target="_blank" rel="noopener noreferrer">{polyglot.t('Footer.web')}: https://www.gunet.gr</a></li>
						<li><span className='strong subheader'><FontAwesomeIcon className="icon" icon={faBriefcase} />&nbsp;&nbsp;</span><a href='mailto:info@gunet.gr'>{polyglot.t('Footer.email')}: info@gunet.gr</a></li>
					</ul>
				</div>
				<div className='pull-right column '>
					<ul >
						<li className='logoItem'><img id='FooterLogo' src={gunetLogo} alt='GUnet Logo'></img></li>
						<li className='logoItem'><FontAwesomeIcon className="icon" icon={faCopyright} /><small>2022 | GUnet</small></li>
					</ul>
				</div>
			</div>
		</div>
	);
}

export default Footer;