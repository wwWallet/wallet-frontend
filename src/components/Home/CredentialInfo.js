// CredentialInfo.js

import React from 'react';
import { BiSolidCategoryAlt, BiSolidUserCircle } from 'react-icons/bi';
import { AiFillCalendar } from 'react-icons/ai';
import { RiPassExpiredFill } from 'react-icons/ri';
import { MdTitle, MdGrade } from 'react-icons/md';
import { GiLevelEndFlag } from 'react-icons/gi';

const getFieldIcon = (fieldName) => {
  switch (fieldName) {
    case 'type':
      return <BiSolidCategoryAlt size={25} className="inline mr-1 mb-1" />;
    case 'expdate':
      return <RiPassExpiredFill size={25} className="inline mr-1 mb-1" />;
    case 'dateOfBirth':
      return <AiFillCalendar size={25} className="inline mr-1 mb-1" />;
    case 'familyName':
      return <BiSolidUserCircle size={25} className="inline mr-1 mb-1" />;
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

const CredentialInfo = ({ credential }) => {
  return (
    <div className=" pt-5 mx-2 px-1 lg:w-1/2 overflow-x-auto">
      <table className="lg:w-4/5">
        <tbody className="divide-y-4 divide-gray-100">
          {credential && (
            <>
              <tr className="text-left bg-white">
                <td className="font-bold text-custom-blue py-2 px-2 align-left rounded-l-xl">
                  {getFieldIcon('type')}
                </td>
                <td className="py-2 px-2 rounded-r-xl ">{credential.type}</td>
              </tr>
              <tr className="text-left bg-white">
                <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                  {getFieldIcon('expdate')}
                </td>
                <td className="py-2 px-2 rounded-r-xl">{credential.expdate}</td>
              </tr>
              {credential.type === 'VerifiableId' && (
                <>
                  <tr className="text-left bg-white">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('dateOfBirth')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.dateOfBirth}</td>
                  </tr>
                  <tr className="text-left bg-white">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('familyName')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.familyName}</td>
                  </tr>
                  <tr className="text-left bg-white">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('firstName')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.firstName}</td>
                  </tr>
                </>
              )}
              {credential.type === 'Bachelor' && (
                <>
                  <tr className="text-left bg-white w-full">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('diplomaTitle')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.diplomaTitle}</td>
                  </tr>
                  <tr className="text-left bg-white">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('eqfLevel')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.eqfLevel}</td>
                  </tr>
                  <tr className="text-left bg-white">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('familyName')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.familyName}</td>
                  </tr>
                  <tr className="text-left bg-white">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('firstName')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.firstName}</td>
                  </tr>
                  <tr className="text-left bg-white">
                    <td className="font-bold text-custom-blue py-2 px-2 rounded-l-xl">
                      {getFieldIcon('grade')}
                    </td>
                    <td className="py-2 px-2 rounded-r-xl">{credential.data.grade}</td>
                  </tr>
                </>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CredentialInfo;