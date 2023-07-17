import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

function jaroWinklerDistance(s1, s2) {
  var m = 0;

  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1 === s2) return 1;

  var range = (Math.floor(Math.max(s1.length, s2.length) / 2)) - 1,
      s1Matches = new Array(s1.length),
      s2Matches = new Array(s2.length);

  for (let i = 0; i < s1.length; i++) {
    var low = (i >= range) ? i - range : 0,
        high = (i + range <= s2.length) ? (i + range) : (s2.length - 1);

    for (let j = low; j <= high; j++) {
      if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
        ++m;
        s1Matches[i] = s2Matches[j] = true;
        break;
      }
    }
  }

  if (m === 0) return 0;

  let k = 0;
  let n_trans = 0;

  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i] === true) {
      let j = k;
      for (; j < s2.length; j++) {
        if (s2Matches[j] === true) {
          k = j + 1;
          break;
        }
      }
      if (s1[i] !== s2[j]) ++n_trans;
    }
  }

  let weight = (m / s1.length + m / s2.length + (m - n_trans / 2) / m) / 3,
      l = 0,
      p = 0.1;

  if (weight > 0.7) {
    while (s1[l] === s2[l] && l < 4) ++l;
    weight = weight + l * p * (1 - weight);
  }

  return weight;
}
function highlightBestSequence(issuer, search) {
  // Check that both issuer and search are defined and are strings
  if (typeof issuer !== 'string' || typeof search !== 'string') {
    return issuer;
  }

  let searchIndex = 0;
  let highlighted = '';

  for (let i = 0; i < issuer.length; i++) {
    if (issuer[i].toLowerCase() === search[searchIndex]?.toLowerCase()) {
      highlighted += `<span class="font-bold text-custom-blue">${issuer[i]}</span>`;
      searchIndex++;
      if (searchIndex >= search.length) {
        highlighted += issuer.slice(i + 1);
        break;
      }
    } else {
      highlighted += issuer[i];
    }
  }

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
		const filtered = searchQuery.trim() === '' ? issuers : issuers
		.map((issuer) => {
			const name = issuer.name.toLowerCase();
			const query = searchQuery.toLowerCase();
			const similarity = jaroWinklerDistance(name, query);
			return { ...issuer, similarity };
		})
		.filter((issuer) => issuer.similarity > 0.5)
		.sort((a, b) => b.similarity - a.similarity);
	
	setFilteredIssuers(filtered);
	}, [searchQuery, issuers]);




  return (
    <Layout>
      <div className="px-4 sm:px-6">
			<h1 className="text-2xl font-bold text-custom-blue">Issuers</h1>
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
