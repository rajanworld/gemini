import React, { useEffect, useRef, useState } from "react";
import PoseDetection from "./Component/PoseDetection";

const YogaInstructor = () => {
  const [messages, setMessages] = useState([]);
  const [lastPoseData, setLastPoseData] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const ngrokUrl = "https://85f9-2401-4900-1c6f-746b-c515-22c2-4f64-de05.ngrok-free.app"; // Replace with your actual ngrok WebSocket URL
    socketRef.current = new WebSocket(ngrokUrl);

    socketRef.current.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.text) {
        setMessages((prev) => [...prev, data.text]);

        if (ttsEnabled) {
          // Use Speech Synthesis API for TTS
          const utterance = new SpeechSynthesisUtterance(data.text);
          // Optionally, set voice parameters here
          speechSynthesis.speak(utterance);
        }
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, [ttsEnabled]);

  const sendData = (poseLandmarks, userText = "") => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ poseLandmarks, userText }));
    }
  };

  // Automatically request posture feedback every 5 seconds, if pose data is available
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (lastPoseData) {
        // Clear previous messages to see fresh response each time
        setMessages([]);
        // Send pose data and prompt
        sendData(lastPoseData, "Check my posture");
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [lastPoseData]);

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Yoga Instructor</h1>
      <p>
        Capture your posture and receive real-time guidance every 5 seconds.
      </p>

      {/* Button to enable TTS */}
      {!ttsEnabled && (
        <button
          onClick={() => setTtsEnabled(true)}
          style={{
            padding: "10px 20px",
            marginBottom: "20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Enable Voice Feedback
        </button>
      )}

      <PoseDetection
        onPoseData={(landmarks) => {
          setLastPoseData(landmarks);
        }}
      />

      <div
        style={{
          marginTop: "20px",
          whiteSpace: "pre-wrap",
          background: "#f9f9f9",
          padding: "10px",
          borderRadius: "5px",
          height: "200px",
          overflowY: "auto",
        }}
      >
        <h2>Guidance</h2>
        {messages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
    </div>
  );
};

export default YogaInstructor;
