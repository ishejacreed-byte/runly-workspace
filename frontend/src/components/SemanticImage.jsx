import React, { useState } from 'react';

const SemanticImage = ({ title, category }) => {
  // Extract keywords to find a relevant image (e.g., "dog", "groceries")
  const keywords = title.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 2).join(',');
  const searchTerms = encodeURIComponent(`${category},${keywords}`);
  
  // Using LoremFlickr for reliable MVP semantic matching without API keys
  const primaryUrl = `https://loremflickr.com/400/200/${searchTerms}/all`;
  const fallbackUrl = `https://loremflickr.com/400/200/${encodeURIComponent(category)}/all`;

  const [imgSrc, setImgSrc] = useState(primaryUrl);
  const [hasError, setHasError] = useState(false);

  return (
    <img 
      src={imgSrc} 
      alt={title} 
      className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 bg-secondary" 
      loading="lazy"
      onError={() => {
        if (!hasError) {
          setImgSrc(fallbackUrl);
          setHasError(true);
        }
      }} 
    />
  );
};

export default SemanticImage;