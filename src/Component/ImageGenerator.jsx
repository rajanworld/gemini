import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const ImageGenerator = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY); // Replace with your actual API key
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const base64Image = image.split(",")[1]; // Extract Base64 data
      const request = [
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/jpeg", // Adjust based on your image type
          },
        },
        "Caption this image.",
      ];

      const response = await model.generateContent(request);
      setResult(response.response.text());
    } catch (err) {
      console.error("Error generating content:", err);
      setError("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Image Caption Generator</h1>
      <div className="w-full max-w-4xl bg-white shadow-md rounded-lg p-8">
        <input
          type="file"
          accept="image/*"
          className="w-full mb-4"
          onChange={handleImageChange}
        />
        {image && <img src={image} alt="Preview" className="mb-4 rounded-md shadow" />}
        <button
          className="w-full bg-blue-500 text-white py-3 rounded-md text-lg hover:bg-blue-600 transition"
          onClick={handleGenerate}
          disabled={loading || !image}
        >
          {loading ? "Generating..." : "Generate Caption"}
        </button>
      </div>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {result && (
        <div className="mt-6 bg-gray-200 p-6 rounded-md text-base">
          <strong>Result:</strong> {result}
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
