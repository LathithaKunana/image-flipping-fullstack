//oh0uslyh
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Switch } from '@headlessui/react';
import { motion } from 'framer-motion';

const CameraApp = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = async () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const imageData = canvasRef.current.toDataURL('image/png');
    const uploadedUrl = await uploadToCloudinary(imageData);
    setUploadedImageUrl(uploadedUrl);
  };

  const uploadToCloudinary = async (imageData) => {
    const url = `https://api.cloudinary.com/v1_1/dmv42joq6/image/upload`;
    const formData = new FormData();
    formData.append('file', imageData);
    formData.append('upload_preset', 'oh0uslyh'); // Your unsigned preset

    try {
      const response = await axios.post(url, formData);
      return response.data.secure_url;
    } catch (error) {
      console.error('Upload failed:', error);
      return null;
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const flipImage = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center p-4 justify-center min-h-screen bg-neutral-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Camera App</h1>
      <div className="flex flex-col items-center w-full max-w-xl p-6 bg-white rounded-lg shadow-lg">
        <motion.video
          ref={videoRef}
          className="w-full h-auto rounded-lg shadow-md mb-4"
          style={{ transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <canvas ref={canvasRef} width="400" height="300" className="hidden" />
        <div className="flex justify-center space-x-2 mt-4">
          <Button label="Start" onClick={startCamera} />
          <Button label="Capture" onClick={capturePhoto} />
          <Button label="Flip" onClick={flipImage} />         
          <Button label="Stop" onClick={stopCamera} />
        </div>
      </div>
      {uploadedImageUrl && (
        <div className="flex flex-col items-center mt-2 w-full max-w-xl p-6 bg-white rounded-lg shadow-lg">
          <motion.div
          className="flex flex-col items-center space-y- mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Uploaded Image:
          </h2>
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="w-full max-w-xl h-auto rounded-lg shadow-md"
          />
        </motion.div>  
        </div>
        
      )}
    </div>
  );
};

const Button = ({ label, onClick }) => (
  <motion.button
    onClick={onClick}
    className="px-4 py-2 text-gray-700 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-200 ease-in-out"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {label}
  </motion.button>
);

export default CameraApp;


