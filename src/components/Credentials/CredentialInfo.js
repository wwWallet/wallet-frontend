import React from 'react';
import { BiSolidCategoryAlt, BiSolidUserCircle } from 'react-icons/bi';
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import { MdTitle, MdGrade } from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';
import { formatDate } from '../../functions/DateFormat';

const getFieldIcon = (fieldName) => {
  switch (fieldName) {
    case 'type':
      return <BiSolidCategoryAlt size={25} className="inline mr-1 mb-1" />;
    case 'expdate':
      return <RiPassExpiredFill size={25} className="inline mr-1 mb-1" />;
    case 'dateOfBirth':
      return <AiFillCalendar size={25} className="inline mr-1 mb-1" />;
    case 'familyName':
    case 'firstName':
      return <BiSolidUserCircle size={25} className="inline mr-1 mb-1" />;
    case 'diplomaTitle':
      return <MdTitle size={25} className="inline mr-1 mb-1" />;
    case 'eqfLevel':
      return <GiLevelEndFlag size={25} className="inline mr-1 mb-1" />;
    case 'grade':
      return <MdGrade size={25} className="inline mr-1 mb-1" />;
    default:
      return null;
  }
};

const renderRow = (fieldName, fieldValue) => {
  if (fieldValue) {
    return (
      <tr className="text-left ">
        <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
          {getFieldIcon(fieldName)}
        </td>
        <td className="py-2 px-2 rounded-r-xl">{fieldValue}</td>
      </tr>
    );
  }
  return null;
};

const CredentialInfo = ({ credential }) => {
  return (
    <div className=" pt-5 pr-2 w-full">
      <table className="lg:w-4/5">
        <tbody className="divide-y-4 divide-transparent">
          {credential && (
            <>
              {renderRow('type', credential.type)}
              {renderRow('expdate', formatDate(credential.expdate))}
              {renderRow('familyName', credential.data.familyName)}
              {renderRow('firstName', credential.data.firstName)}
              {renderRow('dateOfBirth', credential.data.dateOfBirth)}
              {renderRow('diplomaTitle', credential.data.diplomaTitle)}
              {renderRow('eqfLevel', credential.data.eqfLevel)}
              {renderRow('grade', credential.data.grade)}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CredentialInfo;
