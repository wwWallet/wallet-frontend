import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Layout from '../../components/Layout';

const VerificationResult = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <FaCheckCircle size={100} className="text-green-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-800">
          Verification Successful!
        </h2>
      </div>
    </Layout>
  );
};

export default VerificationResult;
