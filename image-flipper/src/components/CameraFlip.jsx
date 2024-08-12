import React, { useRef, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { PinturaEditor } from '@pqina/react-pintura';
import { getEditorDefaults } from '@pqina/pintura';

const CameraApp = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [flippedImage, setFlippedImage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editedImage, setEditedImage] = useState(null);

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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the original image
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const originalImageData = canvas.toDataURL('image/png');
    setOriginalImage(originalImageData);

    // Generate the flipped image
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const flippedImageData = canvas.toDataURL('image/png');
    setFlippedImage(flippedImageData);

    setShowEditor(true); // Show editor after capturing the image
  };

  const uploadToCloudinary = async (imageData) => {
    const url = `https://api.cloudinary.com/v1_1/dmv42joq6/image/upload`;
    const formData = new FormData();
    formData.append('file', imageData);
    formData.append('upload_preset', 'oh0uslyh');

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

  const downloadImage = () => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Combine the images side by side
    const img1 = new Image();
    const img2 = new Image();

    img1.onload = () => {
      img2.onload = () => {
        canvas.width = img1.width + img2.width;
        canvas.height = img1.height;

        context.drawImage(img1, 0, 0); // Original image on the left
        context.drawImage(img2, img1.width, 0); // Edited flipped image on the right

        const combinedImage = canvas.toDataURL('image/png');

        // Trigger download
        const link = document.createElement('a');
        link.href = combinedImage;
        link.download = 'combined_image.png';
        link.click();
      };
      img2.src = editedImage;
    };
    img1.src = originalImage;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Camera App</h1>
      <div className="flex flex-col items-center w-full max-w-xl p-6 bg-white rounded-lg shadow-lg">
        <motion.video
          ref={videoRef}
          className="w-full h-auto rounded-lg shadow-md mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <canvas ref={canvasRef} width="400" height="300" className="hidden" />
        <div className="flex flex-wrap justify-center space-x-2 mt-4">
          <Button label="Start" onClick={startCamera} />
          <Button label="Capture" onClick={capturePhoto} />
          <Button label="Stop" onClick={stopCamera} />
        </div>
      </div>
      {originalImage && flippedImage && (
        <div className="flex justify-around mt-8 space-x-4 p-4 items-center">
          <img
            src={originalImage}
            alt="Original"
            className="w-1/2 rounded-lg shadow-lg"
          />
          <img
            src={editedImage || flippedImage}
            alt="Flipped"
            className="w-1/2 rounded-lg shadow-lg"
          />
        </div>
      )}
      {flippedImage && showEditor && (
        <motion.div
          className="mt-8 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', height: '80vh', padding: '20px' }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Edit Image:
          </h2>
          <PinturaEditor
            {...getEditorDefaults()}
            src={flippedImage}
            onProcess={(res) => {
              const processedUrl = URL.createObjectURL(res.dest);
              setEditedImage(processedUrl);
              setShowEditor(false); // Optionally hide editor after processing
            }}
          />
        </motion.div>
      )}
      {originalImage && editedImage && (
        <motion.div
          className="mt-8 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            label="Download Image"
            onClick={downloadImage}
            className="mt-4"
          />
        </motion.div>
      )}
    </div>
  );
};

const Button = ({ label, onClick, className }) => (
  <motion.button
    onClick={onClick}
    className={`px-4 py-2 text-gray-700 rounded-md bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-200 ease-in-out ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {label}
  </motion.button>
);

export default CameraApp;
