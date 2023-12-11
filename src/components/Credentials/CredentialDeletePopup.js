import React from 'react';
import { MdDelete } from 'react-icons/md';
import Spinner from '../../components/Spinner';

const CredentialDeletePopup = ({ credential, onCancel, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Spinner />
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-2 text-custom-blue">
              <MdDelete size={20} className="inline mr-1 mb-1" />
              Delete: {credential.type.replace(/([A-Z])/g, ' $1')}
            </h2>
            <hr className="mb-2 border-t border-custom-blue/80" />
            <p className="mb-2 mt-4 text-md">
              Are you sure you want to delete the{' '}
              <strong> {credential.type.replace(/([A-Z])/g, ' $1')}</strong> credential?
              <br />
              If you delete it,{' '}
              <strong>all the presentations that include this VC will be removed from your history</strong>.
            </p>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                onClick={onConfirm}
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CredentialDeletePopup;
