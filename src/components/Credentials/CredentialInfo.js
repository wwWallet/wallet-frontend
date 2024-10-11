import React, { useContext, useEffect, useState } from 'react';
import { BiSolidCategoryAlt, BiSolidUserCircle } from 'react-icons/bi';
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import { MdTitle, MdGrade, MdOutlineNumbers } from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';
import { formatDate } from '../../functions/DateFormat';
import ContainerContext from '../../context/ContainerContext';

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

const renderRow = (fieldName, label, fieldValue) => {
	const isMobileScreen = window.innerWidth < 480;

	if (fieldValue) {
		return (
			<tr className="text-left">
				<td className="font-bold text-primary dark:text-primary-light py-2 max480:py-1 px-2 rounded-l-xl">
					<div className="flex md:flex-row flex-col items-left">
						{!isMobileScreen && getFieldIcon(fieldName)}
						<span className="md:ml-1 flex items-center">{label}:</span>
					</div>
				</td>
				<td className="text-gray-700 dark:text-white py-2 max480:py-1 px-2 rounded-r-xl">{fieldValue}</td>
			</tr>
		);
	} else {
		return null;
	}
};

const CredentialInfo = ({ credential, mainClassName = "text-xs sm:text-sm md:text-base pt-5 w-full" }) => {

	const [parsedCredential, setParsedCredential] = useState(null);
	const container = useContext(ContainerContext);

	useEffect(() => {
		if (container) {
			container.credentialParserRegistry.parse(credential).then((c) => {
				if ('error' in c) {
					return;
				}
				setParsedCredential(c.beautifiedForm);
			});
		}

	}, [credential, container]);

	return (
		<div className={mainClassName}>
			<table className="lg:w-4/5">
				<tbody className="divide-y-4 divide-transparent">
					{parsedCredential && (
						<>
							{renderRow('expdate', 'Expiration', formatDate(new Date(parsedCredential?.exp * 1000).toISOString()))}
							{renderRow('familyName', 'Family Name', parsedCredential?.family_name)}
							{renderRow('firstName', 'Given Name', parsedCredential?.given_name)}
							{renderRow('id', 'Personal ID', parsedCredential?.personal_identifier)}
							{renderRow('dateOfBirth', 'Birthday', formatDate(parsedCredential?.dateOfBirth, 'date'))}
							{renderRow('dateOfBirth', 'Birthday', formatDate(parsedCredential?.birth_date, 'date'))}
							{renderRow('diplomaTitle', 'Title', parsedCredential?.title)}
							{renderRow('eqfLevel', 'EQF', parsedCredential?.eqf_level)}
							{renderRow('grade', 'Grade', parsedCredential?.grade)}
							{renderRow('id', 'Social Security Number', parsedCredential?.ssn)}
							{renderRow('id', 'Document Number', parsedCredential?.document_number)}

						</>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default CredentialInfo;
