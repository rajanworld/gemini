import React, { useEffect, useRef, useState } from "react";
import PoseDetection from "./Component/PoseDetection";

const YogaInstructor = () => {
  const [messages, setMessages] = useState([]);
  const [lastPoseData, setLastPoseData] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const wsUrl = "ws://192.168.1.3:8765";//https://fc54-2401-4900-1c6f-746b-c515-22c2-4f64-de05.ngrok-free.app";//"ws://localhost:8765"; // Change to your machine IP if testing on mobile
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("WebSocket connection opened");
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Append the streamed text to the messages
      setMessages((prev) => [...prev, data.text]);
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

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
    <div style={{ padding: "20px" }}>
      <h1>Yoga Instructor</h1>
      <p>Every 5 seconds, we'll request posture feedback from the model based on your current pose.</p>

      <PoseDetection
        onPoseData={(landmarks) => {
          setLastPoseData(landmarks);
        }}
      />

      <div style={{ marginTop: "20px", whiteSpace: "pre-wrap", background: "#f9f9f9", padding: "10px", borderRadius: "5px" }}>
        <h2>Guidance</h2>
        {messages.map((m, i) => (
          <p key={i}>{m}</p>
        ))}
      </div>
    </div>
  );
};

export default YogaInstructor;
