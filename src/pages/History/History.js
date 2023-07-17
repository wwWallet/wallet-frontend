import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

// Generate some mock history data
const generateHistory = () => {
  const history = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for (let i = 1; i <= 100; i++) {
    let name = '';

    // Generate a random text length between 5 and 20 characters
    const length = Math.floor(Math.random() * 50) + 5;

    // Generate a random title with varying text lengths
    for (let j = 0; j < length; j++) {
      const randomIndex = Math.floor(Math.random() * letters.length);
      name += letters[randomIndex];

      // Add a space with a 20% probability
      if (Math.random() < 0.2) {
        name += ' ';
      }
    }

    // Generate a random date between now and 30 days ago
    const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

    history.push({ id: i, name, date });
  }

  return history;
};

const History = () => {
  const [history, setHistory] = useState([]);

  // Generate history only once
  useEffect(() => {
    const generatedHistory = generateHistory();
    // Sort by date in descending order
    generatedHistory.sort((a, b) => b.date - a.date);
    setHistory(generatedHistory);
  }, []);

	return (
    <Layout>
      <div className="px-4 sm:px-6 w-full">
				<h1 className="text-2xl mb-2 font-bold text-custom-blue">History</h1>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic pd-2 text-gray-700">View history of credential transmissions, detailing when and to which verifiers you sent</p>

        <div className="my-4 overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
            {history.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 break-words"
                  style={{ wordBreak: 'break-all' }}
                >
                  <div className="font-bold">{item.name}</div>
                  <div>{item.date.toLocaleDateString('en-GB')} {item.date.toLocaleTimeString()}</div>
                </div>
            ))}
        </div>
      </div>
    </Layout>
  );
};

export default History;