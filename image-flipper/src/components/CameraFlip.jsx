import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Transformer,
  Group,
} from "react-konva";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  FaCamera,
  FaStop,
  FaSyncAlt,
  FaDownload,
  FaUpload,
  FaPlay,
  FaCrop,
  FaSave,
  FaRegSave,
  FaCheck,
  FaTimes,
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
  const [crop, setCrop] = useState({ aspect: 16 / 9 });
  const [isCropping, setIsCropping] = useState(false);
  const [originalOverlayImage, setOriginalOverlayImage] = useState(null); // Store the original overlay image
  const imageRef = useRef(null);
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
    if (overlayRef.current) {
      // Clear existing overlay and transformer if present
      deleteOverlay();
    }

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result;
      img.onload = () => {
        setOverlayImageElement(img);
        setOriginalOverlayImage(img);
        setIsCropping(true);
      };
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleEditCrop = () => {
    if (originalOverlayImage) {
      setOverlayImageElement(originalOverlayImage); // Reset to the original for re-cropping
      setIsCropping(true); // Open cropping UI
    }
  };

  const handleCropComplete = (crop) => {
    if (imageRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(
        imageRef.current,
        crop,
        "croppedImage.jpeg"
      );
      croppedImageUrl.then((url) => {
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          setOverlayImageElement(img);
          setIsCropping(false);
        };
      });
    }
  };

  const handleCropChange = (newCrop) => {
    setCrop(newCrop);
  };

  const handleCropDone = () => {
    // Trigger cropping only when the "Done" button is pressed
    if (imageRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(
        imageRef.current,
        crop,
        "croppedImage.jpeg"
      );
      croppedImageUrl.then((url) => {
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          setOverlayImageElement(img);
          setIsCropping(false); // Close cropping UI
        };
      });
    }
  };

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        blob.name = fileName;
        const croppedImageUrl = window.URL.createObjectURL(blob);
        resolve(croppedImageUrl);
      }, "image/jpeg");
    });
  };

  const deleteOverlay = () => {
    if (overlayRef.current) {
      setOverlayImageElement(null);
      setOverlayState(null);
      setOverlayFinalPosition(null);
      setIsOverlaySaved(false);

      // Reset the transformer reference
      if (trRef.current) {
        trRef.current.nodes([]);
      }
      overlayRef.current = null; // Clear overlayRef to allow new uploads
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
      context.drawImage(
        flippedImageElement,
        imgWidth + 100,
        0,
        imgWidth,
        imgHeight
      ); // Right side

      if (overlayFinalPosition && overlayImageElement) {
        console.log("Drawing overlay...");
        const { position, scaleX, scaleY, rotation } = overlayFinalPosition;

        // Calculate the scaling factor between the displayed (Konva) size and the actual image size
        const scaleFactorX = imgWidth / parentSize.width;
        const scaleFactorY = imgHeight / parentSize.height;

        // Correct overlay position
        const scaledX = position.x * scaleFactorX + imgWidth + 100; // Adjust for right-side placement
        const scaledY = position.y * scaleFactorY; // Scale Y position

        const scaledWidth = overlayRef.current.width() * scaleX * scaleFactorX;
        const scaledHeight =
          overlayRef.current.height() * scaleY * scaleFactorY;

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
          const maxContainerSize = Math.min(
            80,
            (imgHeight - 20) / folderCount - 10
          );
          const containerSize = Math.max(20, maxContainerSize);
          const ySpacing =
            (imgHeight - containerSize * folderCount) / (folderCount + 1);

          Object.keys(folders).forEach((folderName, index) => {
            const thumbnailSrc =
              side === "left"
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
                const yPosition =
                  ySpacing * (index + 1) +
                  containerSize * index +
                  containerSize / 2;
                context.arc(
                  xPosition,
                  yPosition,
                  containerSize / 2,
                  0,
                  Math.PI * 2,
                  true
                );
                context.clip();
                const imgXPosition = side === "left" ? 0 : canvas.width - 100;
                context.drawImage(
                  thumbnailImg,
                  imgXPosition,
                  yPosition - containerSize / 2,
                  containerSize,
                  containerSize
                );
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
      Promise.all([drawThumbnails("left"), drawThumbnails("right")]).then(
        () => {
          console.log("Thumbnails drawn");
          const combinedImage = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = combinedImage;
          link.download = "final_image.png";
          link.click();
          console.log("Image downloaded");
        }
      );
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
                className="w-full h-96 md:w-1/2 rounded-lg shadow-lg overflow-hidden relative"
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
                        <>
                          <KonvaImage
                            ref={overlayRef}
                            image={overlayImageElement}
                            draggable={!isOverlaySaved}
                            onTransformEnd={handleOverlayTransform}
                          />
                          {!isOverlaySaved && (
                            <>
                              <KonvaImage
                                x={
                                  overlayRef.current?.x() +
                                  (overlayRef.current?.width() || 0) -
                                  40
                                } // Position edit icon near the delete icon
                                y={overlayRef.current?.y() + 20}
                                width={20}
                                height={20}
                                onClick={handleEditCrop} // Trigger the edit crop function
                                onTap={handleEditCrop}
                                image={(() => {
                                  const editIcon = new window.Image();
                                  editIcon.src =
                                    "data:image/svg+xml," +
                                    encodeURIComponent(
                                      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>`
                                    );
                                  return editIcon;
                                })()}
                              />
                              <KonvaImage
                                x={
                                  overlayRef.current?.x() +
                                  (overlayRef.current?.width() || 0) -
                                  20
                                }
                                y={overlayRef.current?.y()}
                                width={20}
                                height={20}
                                onClick={deleteOverlay}
                                onTap={deleteOverlay}
                                image={(() => {
                                  const deleteIcon = new window.Image();
                                  deleteIcon.src =
                                    "data:image/svg+xml," +
                                    encodeURIComponent(
                                      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>`
                                    );
                                  return deleteIcon;
                                })()}
                              />
                            </>
                          )}
                        </>
                      )}
                      <Transformer ref={trRef} rotateEnabled resizeEnabled />
                    </Layer>
                  </Stage>
                )}
                {isCropping && overlayImageElement && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-4 rounded-lg">
                      <ReactCrop
                        src={overlayImageElement.src}
                        crop={crop}
                        onChange={handleCropChange}
                      >
                        <img
                          ref={imageRef}
                          src={overlayImageElement.src}
                          alt="Overlay"
                        />
                      </ReactCrop>
                      <div className="mt-4 flex justify-end space-x-2">
                        {/* Add a "Done" button to confirm crop */}
                        <Button
                          label="Done"
                          icon={<FaCheck />}
                          onClick={handleCropDone}
                        />
                        {/* Optional: Add a "Cancel" button to discard changes */}
                        <Button
                          label="Cancel"
                          icon={<FaTimes />}
                          onClick={() => setIsCropping(false)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {showEditor && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {!isOverlaySaved && ( // Only show save button if overlay is not saved yet
                <Button label="Save" icon={<FaSave />} onClick={saveOverlay} />
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
