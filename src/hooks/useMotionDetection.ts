import { useState, useEffect, useRef } from "react";
import { MotionDetectionOptions } from "../types";

export const useMotionDetection = (
    stream: MediaStream | null,
    options: MotionDetectionOptions = {}
) => {
    const { sensitivity = 0.2, intervalMs = 100, onMotion } = options;
    const [motionDetected, setMotionDetected] = useState(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

    useEffect(() => {
        if (!stream) return;

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) return;

        // Hidden video element to play stream for analysis
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.play().catch(console.error);

        const canvas = document.createElement("canvas");
        // Low res for performance
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvasRef.current = canvas;

        const checkMotion = () => {
            if (!ctx || video.videoWidth === 0) return;

            // Draw current frame to low-res canvas
            ctx.drawImage(video, 0, 0, 100, 100);
            const frameData = ctx.getImageData(0, 0, 100, 100).data;

            if (prevFrameRef.current) {
                let diff = 0;
                // Simple pixel diff
                for (let i = 0; i < frameData.length; i += 4) {
                    // Check luminance diff
                    const r = Math.abs(frameData[i] - prevFrameRef.current[i]);
                    const g = Math.abs(frameData[i + 1] - prevFrameRef.current[i + 1]);
                    const b = Math.abs(frameData[i + 2] - prevFrameRef.current[i + 2]);

                    if (r + g + b > 100) { // Threshold for pixel change
                        diff++;
                    }
                }

                const totalPixels = 100 * 100;
                const changeRatio = diff / totalPixels;

                const isMoving = changeRatio > sensitivity;

                if (isMoving) {
                    setMotionDetected(true);
                    onMotion?.();
                } else {
                    setMotionDetected(false);
                }
            }

            prevFrameRef.current = frameData;
        };

        intervalRef.current = setInterval(checkMotion, intervalMs);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            video.pause();
            video.srcObject = null;
        };
    }, [stream, sensitivity, intervalMs]);

    return { motionDetected };
};
