import React, { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const TextGenerator = () => {
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY); 
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    try {
      const request = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      };

      const streamingResult = await model.generateContentStream(request);
      console.log("Streaming responses:");
      setStreamingContent(""); // Clear previous content

      for await (const item of streamingResult.stream) {
        if (
          item &&
          item.candidates &&
          item.candidates[0] &&
          item.candidates[0].content &&
          item.candidates[0].content.parts
        ) {
          item.candidates[0].content.parts.forEach((part) => {
            setStreamingContent((prev) => prev + part.text);
          });
        } else {
          console.warn("Unexpected stream item structure:", item);
        }
      }

      console.log("\n\nFinished processing streaming responses.");
    } catch (error) {
      console.error("An error occurred:", error);
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Google Generative AI Streaming</h1>
      <div className="w-full  bg-white shadow-md rounded-lg p-8">
        <input
          type="text"
          className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
        />
        <button
          className="w-full bg-blue-500 text-white py-3 rounded-md text-lg hover:bg-blue-600 transition"
          onClick={handleGenerate}
        >
          Generate
        </button>
      </div>
      {error ? (
        <p className="mt-6 text-red-500 text-lg">Error: {error}</p>
      ) : (
        <pre className="mt-6 bg-gray-200 p-6 rounded-md w-full text-base overflow-x-auto">
          {streamingContent || "Enter a prompt and click Generate."}
        </pre>
      )}
    </div>
  );
};

export default TextGenerator;