import { useState, useRef, useCallback } from "react";
import { VideoRecorderOptions } from "../types";

export const useRecorder = (stream: MediaStream | null) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = useCallback((options?: VideoRecorderOptions & { onComplete?: (blob: Blob) => void, mode?: 'video-only' | 'audio-only' | 'both' }) => {
        if (!stream) throw new Error("No stream available to record");
        if (isRecording) return;

        try {
            // Filter tracks based on mode
            let recordStream = stream;
            const mode = options?.mode || 'both';

            if (mode === 'video-only') {
                const videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0) recordStream = new MediaStream(videoTracks);
            } else if (mode === 'audio-only') {
                const audioTracks = stream.getAudioTracks();
                if (audioTracks.length > 0) recordStream = new MediaStream(audioTracks);
            }

            const mimeType = options?.mimeType || (mode === 'audio-only' ? 'audio/webm' : 'video/webm');

            const recorder = new MediaRecorder(recordStream, { mimeType });

            mediaRecorderRef.current = recorder;
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                setIsRecording(false);
                setIsPaused(false);
                setRecordedChunks(chunks); // Legacy support
                if (timerRef.current) clearTimeout(timerRef.current);

                // Trigger Callback
                if (options?.onComplete) {
                    options.onComplete(blob);
                }
            };

            recorder.start(1000);
            setIsRecording(true);
            setIsPaused(false);

            if (options?.timeLimitMs) {
                timerRef.current = setTimeout(() => {
                    stopRecording();
                }, options.timeLimitMs);
            }
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    }, [stream, isRecording]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    }, []);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        }
    }, []);

    const takeSnapshot = useCallback(async (): Promise<Blob | null> => {
        if (!stream) return null;

        // Grab frame from video track
        const track = stream.getVideoTracks()[0];
        if (!track) return null;

        const imageCapture = new (window as any).ImageCapture(track);
        try {
            return await imageCapture.takePhoto();
        } catch {
            // Fallback logic could go here if needed
            return null;
        }
    }, [stream]);

    const getBlob = useCallback(() => {
        return new Blob(recordedChunks, { type: 'video/webm' });
    }, [recordedChunks]);

    return {
        isRecording,
        isPaused,
        recordedBlob: recordedChunks.length > 0 ? getBlob() : null,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        takeSnapshot,
        clearRecordings: () => setRecordedChunks([])
    };
};
