import React,{useState} from 'react';
import Layout from '../../components/Layout';
import cred_card from '../../assets/images/cred.png';
import addImage from '../../assets/images/cred.png';
import { BsPlusCircle } from 'react-icons/bs';
import { AiOutlineCloseCircle } from 'react-icons/ai';


const Home = () => {
  const images = [
    { id: 1, src: cred_card, alt: 'Image 1' },
    { id: 2, src: cred_card, alt: 'Image 2' },
    { id: 3, src: cred_card, alt: 'Image 3' },
    { id: 4, src: cred_card, alt: 'Image 4' },
		{ id: 5, src: cred_card, alt: 'Image 3' },
    { id: 6, src: cred_card, alt: 'Image 4' },
		{ id: 7, src: cred_card, alt: 'Image 3' },
    { id: 8, src: cred_card, alt: 'Image 4' },
		{ id: 9, src: cred_card, alt: 'Image 3' },
    { id: 10, src: cred_card, alt: 'Image 4' },
		{ id: 11, src: cred_card, alt: 'Image 4' },
		{ id: 12, src: cred_card, alt: 'Image 4' },
		{ id: 13, src: cred_card, alt: 'Image 4' },
    // Add more images here
  ];

	const [fullscreenImage, setFullscreenImage] = useState(null);

  const openFullscreen = (image) => {
    setFullscreenImage(image);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-14">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
            onClick={() => openFullscreen(image)}
          >
            <img src={image.src} alt={image.alt} className="w-full h-auto rounded-xl" />
          </div>
        ))}
        <div
          className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
        >
          <img
            src={addImage}
            alt="add new credential"
            className="w-full h-auto rounded-xl opacity-100 hover:opacity-120"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <BsPlusCircle size={60} className="text-white mb-2" />
            <span className="text-white font-semibold">Add New Credential</span>
          </div>
        </div>
      </div>
      {fullscreenImage && (
        <div className=" fixed inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <img
            src={fullscreenImage.src}
            alt={fullscreenImage.alt}
            className="max-w-full max-h-full rounded-xl"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={closeFullscreen}
          >
            <AiOutlineCloseCircle size={40}/>
          </button>
        </div>
      )}
    </Layout>
  );
};

export default Home;