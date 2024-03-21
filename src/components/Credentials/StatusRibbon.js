// StatusRibbon.js

import React from 'react';

const StatusRibbon = ({ expDate }) => {
  const CheckExpired = (expDate) => {
    const today = new Date();
    const expirationDate = new Date(expDate);
    return expirationDate < today;
  };

  return (
    <div className={`absolute bottom-0 right-0 text-white text-xs py-1 px-3 rounded-tl-lg border-t border-l border-white ${CheckExpired(expDate) ? 'bg-red-500' : 'bg-green-500'}`}>
      {CheckExpired(expDate) ? 'Expired' : 'Active'}
    </div>
  );
};

export default StatusRibbon;
