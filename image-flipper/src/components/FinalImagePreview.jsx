const FinalImagePreview = () => {
    return (
      <div className="flex flex-col items-center justify-center mt-8">
        <h2 className="text-xl font-bold mb-4">Final Image Preview</h2>
        {finalImagePreview && (
          <img src={finalImagePreview} alt="Final Image" className="max-w-full h-auto rounded-lg shadow-lg" />
        )}
      </div>
    );
  };

  export default FinalImagePreview;