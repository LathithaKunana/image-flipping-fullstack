import React, { useState } from 'react';
import { PinturaEditor } from '@pqina/react-pintura';
import '@pqina/pintura/pintura.css';

const SimpleEditor = () => {
  const [imageUrl] = useState('https://res.cloudinary.com/dmv42joq6/image/upload/v1723482202/cgrhndods28xwqrhdnkh.png');

  return (
    <div style={{ width: '400px', height: '400px' }}>
      <PinturaEditor
        src={imageUrl}
        onProcess={({ dest }) => {
          console.log('Processed image:', dest);
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default SimpleEditor;
