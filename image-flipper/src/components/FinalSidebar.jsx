// FinalSidebar.jsx

import React from 'react';



const FinalSidebar = ({ folders }) => {

    
  return (
    <div className="fixed top-0 right-0 h-screen w-16 bg-gray-800 flex flex-col items-center p-2 overflow-y-auto z-50">
      {Object.keys(folders).map((folderName) => (
        folders[folderName].thumbnail && (
          <div key={folderName} className="mb-4 w-12 h-12 rounded-full overflow-hidden">
            <img
              src={folders[folderName].thumbnail}
              alt={`Thumbnail of ${folderName}`}
              className="w-full h-full object-cover"
            />
          </div>
        )
      ))}
    </div>
  );
};

export default FinalSidebar;
