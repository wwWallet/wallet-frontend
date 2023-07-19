import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';


function highlightBestSequence(issuer, search) {
  if (typeof issuer !== 'string' || typeof search !== 'string') {
    return issuer;
  }

  const searchRegex = new RegExp(search, 'gi');
  const highlighted = issuer.replace(searchRegex, '<span class="font-bold text-custom-blue">$&</span>');

  return highlighted;
}


const Issuers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [issuers, setIssuers] = useState([]);
  const [filteredIssuers, setFilteredIssuers] = useState([]);

  // Generate issuers only once
  useEffect(() => {
  const generateIssuers = () => {
      const generatedIssuers = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    for (let i = 1; i <= 100; i++) {
      let name = '';

      // Generate a random text length between 5 and 20 characters
      const length = Math.floor(Math.random() * 240) + 5;

      // Generate a random title with varying text lengths
      for (let j = 0; j < length; j++) {
        const randomIndex = Math.floor(Math.random() * letters.length);
        name += letters[randomIndex];

          // Add a space with a 20% probability
          if (Math.random() < 0.2) {
            name += ' ';
          }
      }

        generatedIssuers.push({ id: i, name });
    }

      return generatedIssuers;
  };

    const generatedIssuers = generateIssuers();
    setIssuers(generatedIssuers);
    setFilteredIssuers(generatedIssuers);
  }, []);

  // Handle search query changes
  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };


	// Filter issuers based on search query and sort by best match
	useEffect(() => {
		const filtered = searchQuery.trim() === '' ? issuers : issuers.filter((issuer) => {
			const name = issuer.name.toLowerCase();
			const query = searchQuery.toLowerCase();
			return name.includes(query);
		});

		setFilteredIssuers(filtered);
	}, [searchQuery, issuers]);


  return (
    <Layout>
      <div className="px-4 sm:px-6">
			<h1 className="text-2xl mb-2 font-bold text-custom-blue">Issuers</h1>
			<hr className="mb-2 border-t border-custom-blue/80" />
			<p className="italic text-gray-700">Search and choose an issuer for credential retrieval</p>

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
            >
            <div dangerouslySetInnerHTML={{ __html: highlightBestSequence(issuer.name, searchQuery) }} />
            </li>
          ))}

        </ul>
      </div>
    </Layout>
  );
};

export default Issuers;
