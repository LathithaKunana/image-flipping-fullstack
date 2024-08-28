// Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaUpload, FaMusic, FaVideo, FaTrashAlt, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const Sidebar = ({ folders, setFolders, setIsFinalized, setInitialThumbnails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [localInitialThumbnails, setLocalInitialThumbnails] = useState({});

  useEffect(() => {
    // Initialize localInitialThumbnails with existing folder thumbnails
    const initialThumbs = Object.keys(folders).reduce((acc, folderName) => {
      if (folders[folderName].thumbnail) {
        acc[folderName] = folders[folderName].thumbnail;
      }
      return acc;
    }, {});
    setLocalInitialThumbnails(initialThumbs);
    setInitialThumbnails(initialThumbs);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleUpload = async (folderName, files) => {
    setLoadingStates((prevState) => ({ ...prevState, [folderName]: true }));

    const updatedFolder = [...folders[folderName].images];
    const updatedInitialThumbnails = { ...localInitialThumbnails };

    for (let file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'rc98zxhy');

      try {
        const response = await axios.post('https://api.cloudinary.com/v1_1/dxhxijoo4/upload', formData);
        const uploadedUrl = response.data.secure_url;

        updatedFolder.push(uploadedUrl);

        if (!updatedInitialThumbnails[folderName]) {
          updatedInitialThumbnails[folderName] = uploadedUrl;
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    setFolders((prevState) => ({
      ...prevState,
      [folderName]: {
        ...prevState[folderName],
        images: updatedFolder,
        thumbnail: updatedFolder.length ? updatedFolder[0] : null,
      },
    }));
    setLocalInitialThumbnails(updatedInitialThumbnails);
    setInitialThumbnails(updatedInitialThumbnails);
    setLoadingStates((prevState) => ({ ...prevState, [folderName]: false }));
  };

  const handleDelete = (folderName, index) => {
    const updatedFolder = [...folders[folderName].images];
    updatedFolder.splice(index, 1); // Remove the item at the specified index
    setFolders((prevState) => ({
      ...prevState,
      [folderName]: {
        ...prevState[folderName],
        images: updatedFolder,
        thumbnail: updatedFolder.length ? updatedFolder[0] : null,
      },
    }));
  };

  const handleFinalize = () => {
    setIsFinalized(true);
  };

  return (
    <div className={`fixed top-0 left-0 h-screen bg-gray-900 z-50 transition-all duration-300 ${isOpen ? 'w-64 sm:w-72' : 'w-16'}`}>
      <button
        onClick={toggleSidebar}
        className="absolute top-4 -right-3 bg-gray-900 p-2 rounded-full shadow-md text-white z-10"
      >
        {isOpen ? <FaArrowLeft /> : <FaArrowRight />}
      </button>
      <div className={`h-full overflow-y-auto p-4 text-white ${isOpen ? 'block' : 'hidden'}`}>
        {Object.keys(folders).map((folderName) => (
          <div key={folderName} className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{folderName}</h3>
            <div className="flex items-center mb-2">
              <button
                onClick={() => document.getElementById(`file-upload-${folderName}`).click()}
                className="flex items-center bg-blue-500 p-2 rounded-lg text-white shadow-md hover:bg-blue-600"
                disabled={loadingStates[folderName]}
              >
                {loadingStates[folderName] ? (
                  <FaSpinner className="mr-2 animate-spin" />
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    Upload
                  </>
                )}
              </button>
              <input
                id={`file-upload-${folderName}`}
                type="file"
                multiple
                onChange={(e) => handleUpload(folderName, Array.from(e.target.files))}
                className="hidden"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {folders[folderName].images.map((url, index) => {
                let content;
                if (url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png')) {
                  content = <img src={url} alt={`uploaded ${folderName}`} className="w-full h-20 object-cover rounded-lg" />;
                } else if (url.endsWith('.mp4') || url.endsWith('.mov')) {
                  content = (
                    <div className="w-full h-20 flex items-center justify-center bg-gray-700 rounded-lg">
                      <FaVideo className="text-white text-2xl" />
                    </div>
                  );
                } else if (url.endsWith('.mp3') || url.endsWith('.wav')) {
                  content = (
                    <div className="w-full h-20 flex items-center justify-center bg-gray-700 rounded-lg">
                      <FaMusic className="text-white text-2xl" />
                    </div>
                  );
                } else {
                  content = <div className="w-full h-20 bg-gray-700 rounded-lg"></div>;
                }

                return (
                  <div key={index} className="relative">
                    {content}
                    <button
                      onClick={() => handleDelete(folderName, index)}
                      className="absolute top-1 right-1 p-1 text-white bg-red-500 rounded-full hover:bg-red-600"
                      title="Delete"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <button
          onClick={handleFinalize}
          className="bg-green-500 text-white font-bold py-2 px-4 rounded mt-4 w-full"
        >
          Done
        </button>
      </div>
      {/* Circular containers visible when sidebar is collapsed */}
      <div className={`h-screen flex flex-col items-center w-16 p-2 ${isOpen ? 'hidden' : 'flex'} overflow-y-auto`}>
        {Object.keys(folders).map((folderName) =>
          localInitialThumbnails[folderName] && (
            <div key={folderName} className="mb-4 w-12 h-12 rounded-full overflow-hidden border-2 border-gray-500 bg-gray-800">
              <img
                src={localInitialThumbnails[folderName]}
                alt={`Thumbnail of ${folderName}`}
                className="w-full h-full object-cover"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Sidebar;
