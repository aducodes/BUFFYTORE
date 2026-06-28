import React from 'react';
import { useNavigate } from 'react-router-dom';

const NewsletterBox = () => {
  const navigate = useNavigate(); // Must be inside the component

  const handleRedirect = () => {
    navigate('/collection'); // Use navigate here safely
  };

  return (
    <div className='text-center'>
      <p className='text-2xl font-medium text-green-600'>Order now</p>
      <p className='text-white mt-3'>
        Grab your favorites while they last! shop now and save!
      </p>
      <button onClick={handleRedirect} className='bg-green-700 border-white text-white text-xs px-10 py-4 my-5 hover:text-black hover:border-1 hover:bg-green-100 hover:transition duration-300'>ORDER NOW</button>
    </div>
  );
};

export default NewsletterBox;
