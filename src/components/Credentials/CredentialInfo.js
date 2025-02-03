import React from 'react';
import { BiSolidCategoryAlt, BiSolidUserCircle } from 'react-icons/bi';
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import { MdTitle, MdGrade, MdOutlineNumbers } from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';
import { formatDate } from '../../functions/DateFormat';
import useScreenType from '../../hooks/useScreenType';

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
			<tr className="text-left">
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

const CredentialInfo = ({ parsedCredential, mainClassName = "text-sm lg:text-base w-full" }) => {

	const screenType = useScreenType();

	return (
		<div className={mainClassName}>
			<table className="lg:w-4/5">
				<tbody className="divide-y-4 divide-transparent">
					{parsedCredential.beautifiedForm && (
						<>
							{renderRow('expdate', 'Expiration', formatDate(new Date(parsedCredential.beautifiedForm?.exp * 1000).toISOString()), screenType)}
							{renderRow('familyName', 'Family Name', parsedCredential.beautifiedForm?.family_name, screenType)}
							{renderRow('firstName', 'Given Name', parsedCredential.beautifiedForm?.given_name, screenType)}
							{renderRow('id', 'Personal ID', parsedCredential.beautifiedForm?.personal_identifier, screenType)}
							{renderRow('dateOfBirth', 'Birthday', formatDate(parsedCredential.beautifiedForm?.dateOfBirth, 'date'), screenType)}
							{renderRow('dateOfBirth', 'Birthday', formatDate(parsedCredential.beautifiedForm?.birth_date, 'date'), screenType)}
							{renderRow('diplomaTitle', 'Title', parsedCredential.beautifiedForm?.title, screenType)}
							{renderRow('eqfLevel', 'EQF', parsedCredential.beautifiedForm?.eqf_level, screenType)}
							{renderRow('grade', 'Grade', parsedCredential.beautifiedForm?.grade, screenType)}
							{renderRow('id', 'Social Security Number', parsedCredential.beautifiedForm?.ssn, screenType)}
							{renderRow('id', 'Document Number', parsedCredential.beautifiedForm?.document_number, screenType)}
						</>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default CredentialInfo;
