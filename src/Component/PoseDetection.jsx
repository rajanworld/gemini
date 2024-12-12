import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { Pose } from "@mediapipe/pose";

const PoseDetection = (props) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState("");
  const [facingMode, setFacingMode] = useState("user");

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  useEffect(() => {
    const pose = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    // Increase model complexity and thresholds for more accurate detection
    pose.setOptions({
      modelComplexity: 2, // more accurate model
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.7, // higher confidence threshold
      minTrackingConfidence: 0.7,  // higher tracking confidence
    });

    pose.onResults(onResults);

    const videoElement = webcamRef.current?.video;
    if (videoElement) {
      const startCamera = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputDevices = devices.filter((device) => device.kind === "videoinput");

          if (videoInputDevices.length === 0) {
            console.error("No webcam devices found.");
            alert("No webcam found. Please connect a webcam.");
            return;
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          videoElement.srcObject = stream;
          videoElement.onloadedmetadata = () => {
            videoElement.play();

            const processFrame = async () => {
              await pose.send({ image: videoElement });
              requestAnimationFrame(processFrame);
            };
            processFrame();
          };
        } catch (error) {
          console.error("Error accessing webcam:", error);
          alert("Error accessing webcam. Please check permissions.");
        }
      };

      startCamera();
    }
  }, [facingMode]);

  const onResults = (results) => {
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    canvasElement.width = webcamRef.current.video.videoWidth;
    canvasElement.height = webcamRef.current.video.videoHeight;

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.poseLandmarks) {
      drawLandmarks(canvasCtx, results.poseLandmarks);
      provideFeedback(results.poseLandmarks);

      if (props.onPoseData) {
        props.onPoseData(results.poseLandmarks);
      }
    }
  };

  const drawLandmarks = (ctx, landmarks) => {
    ctx.fillStyle = "red";
    for (let landmark of landmarks) {
      ctx.beginPath();
      ctx.arc(
        landmark.x * canvasRef.current.width,
        landmark.y * canvasRef.current.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  };

  const provideFeedback = (landmarks) => {
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);

    if (shoulderWidth > 0.4) {
      setFeedback("You're too close to the camera. Please step back.");
    } else if (shoulderWidth < 0.1) {
      setFeedback("You're too far from the camera. Please step closer.");
    } else if (
      Math.abs(leftShoulder.y - leftHip.y) < 0.1 &&
      Math.abs(rightShoulder.y - rightHip.y) < 0.1
    ) {
      setFeedback("Good posture!");
    } else {
      setFeedback("Straighten your back. Align your shoulders and hips.");
    }
  };

  return (
    <div style={{
      width: "640px", 
      margin: "0 auto", 
      background: "#eee", 
      padding: "10px", 
      borderRadius: "5px"
    }}>
      <h2>Your Pose</h2>
      <button onClick={toggleCamera} style={{ marginBottom: "10px" }}>
        Switch Camera
      </button>
      <div style={{ position: "relative", display: "block", width: "640px", height: "360px", overflow: "hidden" }}>
        <Webcam
          ref={webcamRef}
          videoConstraints={{ facingMode }}
          style={{
            width: "640px",
            height: "360px",
            objectFit: "cover",
            display: "block"
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "640px",
            height: "360px",
            pointerEvents: "none"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "640px",
            height: "360px",
            boxSizing: "border-box",
            pointerEvents: "none",
            border: feedback === "Good posture!" ? "5px solid green" : "5px solid red",
            color: "#000",
            padding: "10px",
            backgroundColor: "rgba(255,255,255,0.4)"
          }}
        >
          {feedback}
        </div>
      </div>
    </div>
  );
};

export default PoseDetection;
