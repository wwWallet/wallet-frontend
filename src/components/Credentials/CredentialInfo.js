import React, { useContext, useEffect, useState } from 'react';
import { BiSolidCategoryAlt, BiSolidUserCircle } from 'react-icons/bi';
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import { MdTitle, MdGrade, MdOutlineNumbers } from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';
import { formatDate } from '../../functions/DateFormat';
import ContainerContext from '../../context/ContainerContext';
import useScreenType from '../../hooks/useScreenType';
import StatusContext from '../../context/StatusContext';
import { VerifiableCredentialFormat } from '../../lib/schemas/vc';
import { CredentialFormat } from '../../functions/parseSdJwtCredential';

const locale = 'en-US';

const getFieldIcon = (fieldName) => {
	switch (fieldName) {
		case 'type':
			return <BiSolidCategoryAlt size={25} className="inline mr-1" />;
		case 'expdate':
			return <RiPassExpiredFill size={25} className="inline mr-1" />;
		case 'dateOfBirth':
			return <AiFillCalendar size={25} className="inline mr-1" />;
		case 'id':
			return <MdOutlineNumbers size={25} className="inline mr-1" />;
		case 'familyName':
		case 'firstName':
			return <BiSolidUserCircle size={25} className="inline mr-1" />;
		case 'diplomaTitle':
			return <MdTitle size={25} className="inline mr-1" />;
		case 'eqfLevel':
			return <GiLevelEndFlag size={25} className="inline mr-1" />;
		case 'grade':
			return <MdGrade size={25} className="inline mr-1" />;
		default:
			return null;
	}
};

const renderRow = (fieldName, label, fieldValue, screenType) => {
	if (fieldValue) {
		return (
			<tr className="text-left" key={fieldName}>
				<td className="font-bold text-primary dark:text-primary-light py-2 xm:py-1 px-2 rounded-l-xl">
					<div className="flex flex-row items-left">
						{screenType !== 'mobile' && getFieldIcon(fieldName)}
						<span className="md:ml-1 flex items-center">{label}:</span>
					</div>
				</td>
				<td className="text-gray-700 dark:text-white py-2 xm:py-1 px-2 rounded-r-xl">{fieldValue}</td>
			</tr>
		);
	} else {
		return null;
	}
};

const CredentialInfo = ({ credential, mainClassName = "text-sm lg:text-base w-full" }) => {
	const { isOnline } = useContext(StatusContext);
	const [parsedCredential, setParsedCredential] = useState(null);
	const [credentialFormat, setCredentialFormat] = useState('');
	const [credentialSubjectRows, setCredentialSubjectRows] = useState([]);
	const container = useContext(ContainerContext);
	const screenType = useScreenType();

	useEffect(() => {
		if (!container || !credential) {
			return;
		}

		const parseCredential = async () => {
			const c = await container.credentialParserRegistry.parse(credential);

			if ('error' in c) {
				return;
			}

			setParsedCredential(c.beautifiedForm);

			let iss = c.beautifiedForm.iss;

			// @todo: make less specific for SURF agent
			// this will no longer be needed if the issuer configuration is saved and includes the issuer URL
			if (iss.startsWith('did:web:')) {
				const issDomain = iss.split(':').pop();
				const domainParts = issDomain.split('.');
				const domain = domainParts.slice(-3).join('.');
				const subDomain = domainParts.slice(0, -3).join('');
				iss = `https://agent.${domain}/${subDomain}`;
			}

			const metadataResponse = await container.openID4VCIHelper.getCredentialIssuerMetadata(isOnline, iss, true);
			
			if (!metadataResponse) {
				return { error: 'No metadata response' };
			}

			const { metadata } = metadataResponse;

			if (!metadata) {
				return;
			}

			const supportedCredentialConfigurations = Object.values(metadata.credential_configurations_supported);

			if (! supportedCredentialConfigurations.every(configuration => configuration.format === VerifiableCredentialFormat.JWT_VC_JSON.toString())) {
				return;
			}

			setCredentialFormat(VerifiableCredentialFormat.JWT_VC_JSON.toString());

			const credentialSubjects = supportedCredentialConfigurations
				.filter(config => (c.beautifiedForm.type || c.beautifiedForm.vc?.type || []).includes(config.scope))
				.map(config => Object.entries(config?.credential_definition?.credentialSubject || {}))
				;
			
			const rows = credentialSubjects.reduce((prev, curr) => {
				return [
					...prev,
					...curr.reduce(
						(previous, [key, subject]) => {
							const display = subject.display.find(d => d.locale === locale) || subject.display[0];
							return [
								...previous,
								{
									name: key,
									label: display.name,
									value: (c.beautifiedForm.credentialSubject || c.beautifiedForm.vc.credentialSubject)[key] || '',
								},
							]
						},
						[],
					)
				];
			}, []);

			setCredentialSubjectRows(rows);
		}

		parseCredential();
	}, [
		credential,
		container,
		isOnline
	]);

	return (
		<div className={mainClassName}>
			<table className="lg:w-4/5">
				<tbody className="divide-y-4 divide-transparent">
					{!credentialFormat && parsedCredential && (
						<>
							{renderRow('expdate', 'Expiration', parsedCredential?.exp ? formatDate(new Date(parsedCredential?.exp * 1000).toISOString()) : 'never', screenType)}
							{renderRow('familyName', 'Family Name', parsedCredential?.family_name, screenType)}
							{renderRow('firstName', 'Given Name', parsedCredential?.given_name, screenType)}
							{renderRow('id', 'Personal ID', parsedCredential?.personal_identifier, screenType)}
							{renderRow('dateOfBirth', 'Birthday', formatDate(parsedCredential?.dateOfBirth, 'date'), screenType)}
							{renderRow('dateOfBirth', 'Birthday', formatDate(parsedCredential?.birth_date, 'date'), screenType)}
							{renderRow('diplomaTitle', 'Title', parsedCredential?.title, screenType)}
							{renderRow('eqfLevel', 'EQF', parsedCredential?.eqf_level, screenType)}
							{renderRow('grade', 'Grade', parsedCredential?.grade, screenType)}
							{renderRow('id', 'Social Security Number', parsedCredential?.ssn, screenType)}
							{renderRow('id', 'Document Number', parsedCredential?.document_number, screenType)}
						</>
					)}
					{
						credentialFormat === CredentialFormat.JWT_VC_JSON.toString() &&
						parsedCredential &&
						(
							<>
								{renderRow('expdate', 'Expiration', parsedCredential?.exp ? formatDate(new Date(parsedCredential?.exp * 1000).toISOString()) : 'never', screenType)}
								{credentialSubjectRows.map(row => renderRow(row.name, row.label, row.value, screenType))}
								{/* @todo: make dynamic using schema from credential context */}
								{renderRow('name', 'Name', parsedCredential?.credentialSubject?.achievement?.name, screenType)}
								{renderRow('description', 'Description', parsedCredential?.credentialSubject?.achievement?.description, screenType)}
								{renderRow('id', 'ID', parsedCredential?.credentialSubject?.achievement?.id, screenType)}
								{renderRow('criteria', 'Criteria', parsedCredential?.credentialSubject?.achievement?.criteria?.narrative, screenType)}
							</>
						)
					}
				</tbody>
			</table>
		</div>
	);
};

export default CredentialInfo;
