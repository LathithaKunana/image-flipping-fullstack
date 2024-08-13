import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800">Camera App</h1>
      <div className="flex flex-col items-center w-full max-w-2xl p-8 bg-white rounded-lg shadow-xl">
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
          <Button label="Rotate Camera" onClick={toggleCamera} />
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
                    x={0}
                    y={0}
                    width={parentSize.width} // Example: adjust width relative to parent size
                    height={parentSize.height}
                  />
                  {overlayImageElement && (
                    <>
                      <KonvaImage
                        ref={overlayRef}
                        image={overlayImageElement}
                        draggable
                        onTransformEnd={handleOverlayTransform}
                        onClick={() => {
                          trRef.current.nodes([overlayRef.current]);
                          trRef.current.getLayer().batchDraw();
                        }}
                        onTap={() => {
                          trRef.current.nodes([overlayRef.current]);
                          trRef.current.getLayer().batchDraw();
                        }}
                      />
                      <Transformer
                        ref={trRef}
                        rotateEnabled={true}
                        resizeEnabled={true}
                        keepRatio={false}
                      />
                    </>
                  )}
                </Layer>
              </Stage>
            )}
          </div>
        </div>
      )}
      {originalImage && overlayImageElement && (
        <motion.div
          className="mt-8 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            label="Download Image"
            onClick={downloadImage}
            className="mt-1"
          />
        </motion.div>
      )}
      {showEditor && (
        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleOverlayUpload}
            className="p-2 border-2 mb-4 border-blue-300 rounded-md"
          />
        </div>
      )}
    </div>
  );
};

const Button = ({ label, onClick, className }) => (
  <motion.button
    onClick={onClick}
    className={`px-4 py-2 text-gray-700 rounded-md bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition duration-200 ease-in-out ${className}`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {label}
  </motion.button>
);

export default CameraApp;
