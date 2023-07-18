import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

const Issuers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIssuer, setSelectedIssuer] = useState(null);
  const [filteredIssuers, setFilteredIssuers] = useState([]);

  // Generate 100 random issuers with varying text lengths
  const generateIssuers = () => {
    const issuers = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    for (let i = 1; i <= 100; i++) {
      let name = '';

      // Generate a random text length between 5 and 20 characters
      const length = Math.floor(Math.random() * 240) + 5;

      // Generate a random title with varying text lengths
      for (let j = 0; j < length; j++) {
        const randomIndex = Math.floor(Math.random() * letters.length);
        name += letters[randomIndex];
      }

      issuers.push({ id: i, name });
    }

    return issuers;
  };

  const issuers = generateIssuers();

  // Handle search query changes
  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  // Filter issuers based on search query
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		const filtered = issuers.filter((issuer) =>
			issuer.name.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setFilteredIssuers(filtered);
	}, [searchQuery]);

  // Handle issuer selection
  const handleSelectIssuer = (issuer) => {
    setSelectedIssuer(issuer);
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6">
        <h1 className="text-2xl font-bold">Issuers</h1>
        <div className="my-4">
          <input
            type="text"
            placeholder="Search issuers..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <ul
          className="max-h-screen-80 overflow-y-auto space-y-2"
          style={{ maxHeight: '80vh' }}
        >
          {filteredIssuers.map((issuer) => (
            <li
              key={issuer.id}
              className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 break-words"
              style={{ wordBreak: 'break-all' }}
              onClick={() => handleSelectIssuer(issuer)}
            >
              {issuer.name}
            </li>
          ))}
        </ul>
        {selectedIssuer && (
          <div className="mt-4 bg-white px-4 py-2 border border-gray-300 rounded-md">
            <h2 className="text-lg font-bold">Selected Issuer: {selectedIssuer.name}</h2>
            {/* Display additional details or actions for the selected issuer */}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Issuers;
