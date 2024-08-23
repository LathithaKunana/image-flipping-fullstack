import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { FaCamera, FaStop, FaSyncAlt, FaDownload, FaUpload } from "react-icons/fa";

const CameraApp = () => {
  const videoRef = useRef(null);  // Ref for the video element to access the camera feed
  const canvasRef = useRef(null); // Ref for the canvas element used for capturing photos
  const [stream, setStream] = useState(null);  // State to hold the media stream from the camera
  const [originalImage, setOriginalImage] = useState(null);  // State for the captured original image
  const [flippedImage, setFlippedImage] = useState(null);    // State for the captured flipped image
  const [showEditor, setShowEditor] = useState(false);  // State to toggle the image editor view
  const [cameraMode, setCameraMode] = useState("user"); // State to track the camera mode (front or back)
  const [overlayImageElement, setOverlayImageElement] = useState(null); // State for the overlay image element
  const [flippedImageElement, setFlippedImageElement] = useState(null); // State for the flipped image element
  const overlayRef = useRef(null);  // Ref for the overlay image in the Konva stage
  const trRef = useRef(null);       // Ref for the Konva Transformer component
  const [parentSize, setParentSize] = useState({ width: 0, height: 0 }); // State to track the parent container size
  const parentRef = useRef(null);   // Ref for the parent container

  // Function to start the camera and access the video stream
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

  // Function to capture a photo and generate the original and flipped images
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

  // Function to stop the camera and clear the stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Function to toggle between front and back cameras
  const toggleCamera = () => {
    setCameraMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    stopCamera();
    startCamera();
  };

  // Function to handle transformations applied to the overlay image
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

  // Function to handle uploading an overlay image
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

  // Function to download the combined image (original, flipped, and overlay)
  const downloadImage = () => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const imgWidth = flippedImageElement.width;
    const imgHeight = flippedImageElement.height;

    // Set canvas size to accommodate both images side by side
    canvas.width = imgWidth * 2;
    canvas.height = imgHeight;

    const img1 = new Image();
    img1.onload = () => {
      // Draw the original image on the left
      context.drawImage(img1, 0, 0, imgWidth, imgHeight);
      // Draw the flipped image on the right
      context.drawImage(flippedImageElement, imgWidth, 0, imgWidth, imgHeight);

      const overlayNode = overlayRef.current;
      if (overlayNode) {
        // Get the absolute position of the overlay in the Konva stage
        const absolutePosition = overlayNode.getAbsolutePosition();

        // Get the scale of the overlay image
        const scaleX = overlayNode.scaleX();
        const scaleY = overlayNode.scaleY();

        // Draw the overlay image with the correct position and scaling
        context.drawImage(
          overlayImageElement,
          imgWidth + absolutePosition.x,
          absolutePosition.y,
          overlayNode.width() * scaleX,
          overlayNode.height() * scaleY
        );
      }

      // Create the final image from the canvas
      const combinedImage = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = combinedImage;
      link.download = "combined_image.png";
      link.click();
    };

    img1.src = originalImage;
  };

  // Effect to handle resizing and editor setup
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

      // Initial size
      handleResize();

      // Handle resize event
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [showEditor, overlayImageElement]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
      <h1 className="text-5xl font-extrabold mb-6 text-gray-800">Camera App</h1>
      <div className="flex flex-col items-center w-full max-w-2xl p-8 bg-white rounded-lg shadow-xl">
        <motion.video
          ref={videoRef}
          className="w-full h-auto rounded-lg shadow-md mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <canvas ref={canvasRef} width="400" height="300" className="hidden" />
        <div className="flex flex-wrap justify-center space-x-2 space-y-2 mt-4">
          <Button label="Start" icon={<FaCamera />} onClick={startCamera} />
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
        <div className="flex flex-wrap justify-center space-x-2 space-y-2 mt-4">
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
            Upload Overlay
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
  );
};

// Reusable button component for consistency
const Button = ({ label, icon, onClick }) => (
  <motion.button
    className="bg-indigo-500 text-white font-bold py-2 px-4 rounded inline-flex items-center"
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </motion.button>
);

export default CameraApp;
