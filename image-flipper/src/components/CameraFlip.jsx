import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import {
  FaCamera,
  FaStop,
  FaSyncAlt,
  FaDownload,
  FaUpload,
  FaPlay,
} from "react-icons/fa";
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
  const [isOverlaySaved, setIsOverlaySaved] = useState(false);
  const [overlayFinalPosition, setOverlayFinalPosition] = useState(null);
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
  });
  const [isFinalized, setIsFinalized] = useState(false);
  const [initialThumbnails, setInitialThumbnails] = useState({});
  const [overlayState, setOverlayState] = useState({
    position: { x: 0, y: 0 },
    scaleX: 1,
    scaleY: 1,
  });

  // Functions for Camera and Image Handling
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
    selectRandomImages();
  };

  // Function to select random images from folders for thumbnails
  const selectRandomImages = () => {
    const updatedFolders = { ...folders };

    Object.keys(updatedFolders).forEach((folderName) => {
      const folderImages = updatedFolders[folderName].images;
      if (folderImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * folderImages.length);
        updatedFolders[folderName].thumbnail = folderImages[randomIndex]; // Select random image
      }
    });

    setFolders(updatedFolders);
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

    const absolutePosition = node.getAbsolutePosition();
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

    setOverlayState({
      position: absolutePosition,
      scaleX,
      scaleY,
    });
  };

  const saveOverlay = () => {
    if (overlayRef.current) {
      const node = overlayRef.current;
      const absolutePosition = node.getAbsolutePosition();
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      const rotation = node.rotation();

      setOverlayFinalPosition({
        position: absolutePosition,
        scaleX,
        scaleY,
        rotation,
      });

      node.draggable(false);
      setIsOverlaySaved(true);
    }
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
    console.log("Downloading image...");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
  
    const imgWidth = flippedImageElement.width;
    const imgHeight = flippedImageElement.height;
  
    console.log("Image width:", imgWidth);
    console.log("Image height:", imgHeight);
  
    canvas.width = imgWidth * 2 + 200; // 100px for each sidebar
    canvas.height = imgHeight;
  
    const img1 = new Image();
    img1.crossOrigin = "anonymous";
    img1.src = originalImage;
  
    let thumbnailsLoaded = 0;
    const totalThumbnails = Object.keys(folders).length * 2; // 2 sidebars
  
    img1.onload = () => {
      console.log("Original image loaded");
      context.drawImage(img1, 100, 0, imgWidth, imgHeight); // Left side
      context.drawImage(flippedImageElement, imgWidth+100 , 0, imgWidth, imgHeight); // Right side
  
      if (overlayFinalPosition && overlayImageElement) {
        console.log("Drawing overlay...");
        const { position, scaleX, scaleY, rotation } = overlayFinalPosition;
  
        // Calculate the scaling factor between the displayed (Konva) size and the actual image size
        const scaleFactorX = imgWidth / (parentSize.width);
        const scaleFactorY = imgHeight / (parentSize.height);
  
        // Correct overlay position
        const scaledX = (position.x * scaleFactorX) + imgWidth+100; // Adjust for right-side placement
        const scaledY = position.y * scaleFactorY; // Scale Y position
  
        const scaledWidth = overlayRef.current.width() * scaleX * scaleFactorX;
        const scaledHeight = overlayRef.current.height() * scaleY * scaleFactorY;
  
        // Save the context state before applying transformations
        context.save();
  
        // Move context to the calculated overlay position
        context.translate(scaledX, scaledY);
        context.rotate((rotation * Math.PI) / 180);
  
        // Draw the overlay image at the correct position and size
        context.drawImage(overlayImageElement, 0, 0, scaledWidth, scaledHeight);
  
        // Restore context state after drawing the overlay
        context.restore();
      }
  
      // Function to draw thumbnails on the sidebars
      const drawThumbnails = (side) => {
        return new Promise((resolve) => {
          console.log(`Drawing thumbnails for ${side} sidebar...`);
          const folderCount = Object.keys(folders).length;
          const maxContainerSize = Math.min(80, (imgHeight - 20) / folderCount - 10);
          const containerSize = Math.max(20, maxContainerSize);
          const ySpacing = (imgHeight - containerSize * folderCount) / (folderCount + 1);
  
          Object.keys(folders).forEach((folderName, index) => {
            const thumbnailSrc = side === "left"
              ? initialThumbnails[folderName]
              : folders[folderName].thumbnail;
  
            if (thumbnailSrc) {
              const thumbnailImg = new Image();
              thumbnailImg.crossOrigin = "anonymous";
              thumbnailImg.src = thumbnailSrc;
              thumbnailImg.onload = () => {
                context.save();
                context.beginPath();
                const xPosition = side === "left" ? 50 : canvas.width - 50; // Adjust sidebar position
                const yPosition = ySpacing * (index + 1) + containerSize * index + containerSize / 2;
                context.arc(xPosition, yPosition, containerSize / 2, 0, Math.PI * 2, true);
                context.clip();
                const imgXPosition = side === "left" ? 0 : canvas.width - 100;
                context.drawImage(thumbnailImg, imgXPosition, yPosition - containerSize / 2, containerSize, containerSize);
                context.restore();
  
                if (index === folderCount - 1) resolve(); // Resolve the promise after last thumbnail
              };
            } else if (index === folderCount - 1) {
              resolve();
            }
          });
        });
      };
  
      // Draw thumbnails on both sidebars
      Promise.all([drawThumbnails("left"), drawThumbnails("right")]).then(() => {
        console.log("Thumbnails drawn");
        const combinedImage = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = combinedImage;
        link.download = "final_image.png";
        link.click();
        console.log("Image downloaded");
      });
    };
  };

  useEffect(() => {
    if (showEditor && trRef.current && overlayRef.current) {
      trRef.current.nodes([overlayRef.current]);
      trRef.current.getLayer().batchDraw();
    }

    if (parentRef.current && flippedImageElement) {
      const handleResize = () => {
        const parentWidth = parentRef.current.offsetWidth;
        const aspectRatio =
          flippedImageElement.width / flippedImageElement.height;
        const canvasHeight = parentWidth / aspectRatio;

        setParentSize({
          width: parentWidth,
          height: canvasHeight,
        });
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [showEditor, overlayImageElement, flippedImageElement]);

  return (
    <div className="flex flex-col px-14 sm:px-20 sm:flex-row min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <Sidebar
        folders={folders}
        setFolders={setFolders}
        setIsFinalized={setIsFinalized}
        setInitialThumbnails={setInitialThumbnails}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 sm:mb-6 text-gray-800">
            Camera App
          </h1>
          <div className="w-full max-w-2xl p-4 sm:p-8 bg-white rounded-lg shadow-xl">
            <motion.video
              ref={videoRef}
              className="w-full h-auto rounded-lg shadow-md mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <canvas
              ref={canvasRef}
              width="400"
              height="300"
              className="hidden"
            />
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              <Button label="Start" icon={<FaPlay />} onClick={startCamera} />
              <Button
                label="Capture"
                icon={<FaCamera />}
                onClick={capturePhoto}
              />
              <Button label="Stop" icon={<FaStop />} onClick={stopCamera} />
              <Button
                label="Rotate"
                icon={<FaSyncAlt />}
                onClick={toggleCamera}
              />
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
              {!isOverlaySaved && ( // Only show save button if overlay is not saved yet
                <Button
                  label="Save"
                  icon={<FaDownload />}
                  onClick={saveOverlay}
                />
              )}
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

// Updated reusable button component
const Button = ({ label, icon, onClick }) => (
  <motion.button
    onClick={onClick}
    className="flex items-center bg-indigo-500 text-white font-bold py-2 px-4 rounded hover:bg-indigo-600 transition-colors duration-200 ease-in-out shadow-lg"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {icon}
    <span className="hidden sm:inline-block ml-2">{label}</span>
  </motion.button>
);

export default CameraApp;
