// CameraApp.jsx

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { FaCamera, FaStop, FaSyncAlt, FaDownload, FaUpload, FaPlay } from "react-icons/fa";
import Sidebar from "./SideBar";
import FinalSidebar from "./FinalSidebar";

const CameraApp = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [flippedImage, setFlippedImage] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [cameraMode, setCameraMode] = useState("user");
  const [overlayImageElement, setOverlayImageElement] = useState(null);
  const [flippedImageElement, setFlippedImageElement] = useState(null);
  const overlayRef = useRef(null);
  const trRef = useRef(null);
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 });
  const parentRef = useRef(null);
  const [folders, setFolders] = useState({
    "Folder 1": { images: [], thumbnail: null },
    "Folder 2": { images: [], thumbnail: null },
    "Folder 3": { images: [], thumbnail: null },
    "Folder 4": { images: [], thumbnail: null },
    "Folder 5": { images: [], thumbnail: null },
    "Folder 6": { images: [], thumbnail: null },
  });
  const [isFinalized, setIsFinalized] = useState(false);

  // Functions for Camera and Image Handling
  // ... (existing functions here) ...

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraMode },
      });
      setStream(mediaStream);
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const originalImageData = canvas.toDataURL("image/png");
    setOriginalImage(originalImageData);

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const flippedImageData = canvas.toDataURL("image/png");
    setFlippedImage(flippedImageData);

    const img = new window.Image();
    img.src = flippedImageData;
    img.onload = () => {
      setFlippedImageElement(img);
      setShowEditor(true);
    };
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleCamera = () => {
    setCameraMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    stopCamera();
    startCamera();
  };

  const handleOverlayTransform = () => {
    const node = overlayRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const overlayData = node.toDataURL();
    node.scaleX(scaleX);
    node.scaleY(scaleY);

    const img = new window.Image();
    img.src = overlayData;
    img.onload = () => {
      setOverlayImageElement(img);
    };
  };

  const handleOverlayUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        setOverlayImageElement(img);
      };
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const imgWidth = flippedImageElement.width;
    const imgHeight = flippedImageElement.height;

    canvas.width = imgWidth * 2;
    canvas.height = imgHeight;

    const img1 = new Image();
    img1.onload = () => {
      context.drawImage(img1, 0, 0, imgWidth, imgHeight);
      context.drawImage(flippedImageElement, imgWidth, 0, imgWidth, imgHeight);

      const overlayNode = overlayRef.current;
      if (overlayNode) {
        const absolutePosition = overlayNode.getAbsolutePosition();
        const scaleX = overlayNode.scaleX();
        const scaleY = overlayNode.scaleY();
        context.drawImage(
          overlayImageElement,
          imgWidth + absolutePosition.x,
          absolutePosition.y,
          overlayNode.width() * scaleX,
          overlayNode.height() * scaleY
        );
      }

      const combinedImage = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = combinedImage;
      link.download = "combined_image.png";
      link.click();
    };

    img1.src = originalImage;
  };

  useEffect(() => {
    if (showEditor && trRef.current && overlayRef.current) {
      trRef.current.nodes([overlayRef.current]);
      trRef.current.getLayer().batchDraw();
    }

    if (parentRef.current) {
      const handleResize = () => {
        setParentSize({
          width: parentRef.current.offsetWidth,
          height: parentRef.current.offsetHeight,
        });
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [showEditor, overlayImageElement]);

  return (
    <div className="flex flex-col px-14 sm:px-20 sm:flex-row min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <Sidebar folders={folders} setFolders={setFolders} setIsFinalized={setIsFinalized} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-800">Camera App</h1>
          <div className="w-full max-w-2xl p-4 sm:p-8 bg-white rounded-lg shadow-xl">
            <motion.video
              ref={videoRef}
              className="w-full h-auto rounded-lg shadow-md mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <canvas ref={canvasRef} width="400" height="300" className="hidden" />
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button label="Start" icon={<FaPlay/>} onClick={startCamera} />
              <Button label="Capture" icon={<FaCamera />} onClick={capturePhoto} />
              <Button label="Stop" icon={<FaStop />} onClick={stopCamera} />
              <Button label="Rotate" icon={<FaSyncAlt />} onClick={toggleCamera} />
            </div>
          </div>
          {originalImage && flippedImageElement && showEditor && (
            <div className="flex flex-col md:flex-row justify-around mt-8 space-y-4 md:space-y-0 md:space-x-4 p-4 items-center w-full max-w-5xl">
              <img
                src={originalImage}
                alt="Original"
                className="w-full md:w-1/2 rounded-lg shadow-lg"
              />
              <div
                ref={parentRef}
                className="w-full h-96 md:w-1/2 rounded-lg shadow-lg overflow-hidden"
              >
                {parentSize.width && parentSize.height && (
                  <Stage
                    width={parentSize.width}
                    height={parentSize.height}
                    className="mx-auto"
                  >
                    <Layer>
                      <KonvaImage
                        image={flippedImageElement}
                        width={parentSize.width}
                        height={parentSize.height}
                      />
                      {overlayImageElement && (
                        <KonvaImage
                          ref={overlayRef}
                          image={overlayImageElement}
                          draggable
                          onTransformEnd={handleOverlayTransform}
                        />
                      )}
                      <Transformer ref={trRef} rotateEnabled resizeEnabled />
                    </Layer>
                  </Stage>
                )}
              </div>
            </div>
          )}
          {showEditor && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button
                label="Download"
                icon={<FaDownload />}
                onClick={downloadImage}
              />
              <label
                htmlFor="overlay-upload"
                className="bg-indigo-500 text-white font-bold py-2 px-4 rounded inline-flex items-center cursor-pointer"
              >
                <FaUpload className="mr-2" />
                <span className="hidden sm:inline">Upload Overlay</span>
              </label>
              <input
                id="overlay-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleOverlayUpload}
              />
            </div>
          )}
        </div>
      </div>
      {isFinalized && <FinalSidebar folders={folders} />}
    </div>
  );
};

// Updated reusable button component for better responsiveness
const Button = ({ label, icon, onClick }) => (
  <motion.button
    className="bg-indigo-500 text-white font-bold py-2 px-3 sm:px-4 rounded flex flex-col sm:flex-row items-center justify-center text-xs sm:text-sm"
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
  >
    <span className="mb-1 sm:mb-0 sm:mr-2">{icon}</span>
    <span className="text-[10px] sm:text-xs md:text-sm">{label}</span>
  </motion.button>
);

export default CameraApp;