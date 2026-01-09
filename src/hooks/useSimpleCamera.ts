import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CameraError,
  CameraPreset,
  FilterType,
  UseCameraConfig,
} from "../types";
import { useAudioLevel } from "./useAudioLevel";
import { useBarcodeScanner } from "./useBarcodeScanner";
import { useCameraControls } from "./useCameraControls";
import { useMediaDevices } from "./useMediaDevices";
import { useMotionDetection } from "./useMotionDetection";
import { useOrientation } from "./useOrientation";
import { useRecorder } from "./useRecorder";
import { useStorage } from "./useStorage";

export const useSimpleCamera = (config: UseCameraConfig = {}) => {
  const {
    autoStart = false,
    defaultConstraints = { video: true, audio: true },
    mock = false,
    autoRetry = false,
    debug = false,
  } = config;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraError | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [activePreset, setActivePreset] = useState<CameraPreset | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  const retryCountRef = useRef(0);
  const log = useCallback(
    (...args: any[]) => {
      if (debug) console.log("[useSimpleCamera]", ...args);
    },
    [debug],
  );

  const { videoDevices, audioDevices } = useMediaDevices();

  // Sub-hooks
  const controls = useCameraControls(stream);
  const recorder = useRecorder(stream);
  const audioLevel = useAudioLevel(stream);
  const orientation = useOrientation();
  const storage = useStorage();

  // Callbacks for optional features
  const [motionCallback, setMotionCallback] = useState<
    (() => void) | undefined
  >(undefined);
  const [barcodeCallback, setBarcodeCallback] = useState<
    ((code: string) => void) | undefined
  >(undefined);

  const motionDetection = useMotionDetection(stream, {
    onMotion: motionCallback,
  });
  const barcodeScanner = useBarcodeScanner(stream, {
    onDetect: (c) => barcodeCallback?.(c),
  });

  // Internal Helper to format errors
  const handleCameraError = useCallback(
    (err: any) => {
      let type: CameraError["type"] = "UNKNOWN_ERROR";
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      )
        type = "PERMISSION_DENIED";
      else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      )
        type = "NO_DEVICE_FOUND";
      else if (err.name === "OverconstrainedError") type = "CONSTRAINT_ERROR";

      const mappedError: CameraError = {
        type,
        message: err.message || "An unexpected error occurred",
        originalError: err,
      };

      log("Error encountered:", mappedError);
      setError(mappedError);
      setPermissionGranted(false);
      return mappedError;
    },
    [log],
  );

  const acquirePermissions = useCallback(async () => {
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      tempStream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      setPermissionGranted(true);
    } catch (err) {
      handleCameraError(err);
    }
  }, [handleCameraError]);

  const getConstraintsFromPreset = (
    preset: CameraPreset,
  ): MediaTrackConstraints => {
    switch (preset) {
      case "SD":
        return { width: 640, height: 480 };
      case "HD":
        return { width: 1280, height: 720 };
      case "FHD":
        return { width: 1920, height: 1080 };
      case "4K":
        return { width: 3840, height: 2160 };
      case "Instagram":
        return { aspectRatio: 1 / 1 };
      default:
        return {};
    }
  };

  const createMockStream = (): MediaStream => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "white";
      ctx.font = "48px sans-serif";
      ctx.fillText("MOCK CAMERA", 150, 240);
    }
    const stream = canvas.captureStream(30);
    // Add a silent audio track
    const ctxAudio = new AudioContext();
    const dest = ctxAudio.createMediaStreamDestination();
    stream.addTrack(dest.stream.getAudioTracks()[0]);
    return stream;
  };

  const startCamera = useCallback(
    async (
      constraintsOrPreset:
        | MediaStreamConstraints
        | { preset: CameraPreset; deviceId?: string } = defaultConstraints,
    ) => {
      setError(null);
      log("Starting camera...", constraintsOrPreset);

      if (mock) {
        log("Mock mode enabled. Generating synthetic stream.");
        setStream(createMockStream());
        setPermissionGranted(true);
        return;
      }

      try {
        let constraints: MediaStreamConstraints;

        if ("preset" in constraintsOrPreset) {
          const { preset, deviceId } = constraintsOrPreset;
          setActivePreset(preset);
          constraints = {
            video: {
              ...getConstraintsFromPreset(preset),
              deviceId: deviceId ? { exact: deviceId } : undefined,
            },
            audio: true,
          };
        } else {
          constraints = constraintsOrPreset;
        }

        const newStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        setPermissionGranted(true);
        retryCountRef.current = 0; // Reset retry on success

        // Wake Lock
        if ("wakeLock" in navigator) {
          try {
            const lock = await navigator.wakeLock.request("screen");
            setWakeLock(lock);
          } catch (err) {
            console.warn("Wake Lock failed", err);
          }
        }
      } catch (err) {
        const mapped = handleCameraError(err);

        // Auto-Retry Logic
        if (
          autoRetry &&
          retryCountRef.current < 3 &&
          mapped.type !== "PERMISSION_DENIED"
        ) {
          const delay = (retryCountRef.current + 1) * 1000;
          log(
            `Auto-retrying in ${delay}ms... (Attempt ${retryCountRef.current + 1}/3)`,
          );
          retryCountRef.current += 1;
          setTimeout(() => startCamera(constraintsOrPreset), delay);
        }
      }
    },
    [defaultConstraints, mock, autoRetry, handleCameraError, log],
  );

  const startScreenShare = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setStream(newStream);
      setPermissionGranted(true);
    } catch (err) {
      handleCameraError(err);
    }
  }, [handleCameraError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      setStream(null);

      if (wakeLock) {
        wakeLock.release().catch(console.error);
        setWakeLock(null);
      }
    }
  }, [stream, wakeLock]);

  const toggleVideo = useCallback(
    (enabled: boolean) => {
      stream
        ?.getVideoTracks()
        .forEach((t: MediaStreamTrack) => (t.enabled = enabled));
    },
    [stream],
  );

  const toggleAudio = useCallback(
    (enabled: boolean) => {
      stream
        ?.getAudioTracks()
        .forEach((t: MediaStreamTrack) => (t.enabled = enabled));
    },
    [stream],
  );

  const toggleFacingMode = useCallback(async () => {
    if (!stream) return;
    const currentTrack = stream.getVideoTracks()[0];
    const currentSettings = currentTrack.getSettings();
    const currentMode = currentSettings.facingMode;

    stopCamera();

    const nextMode = currentMode === "user" ? "environment" : "user";
    await startCamera({
      video: { facingMode: { exact: nextMode } },
      audio: true,
    });
  }, [stream, stopCamera, startCamera]);

  const togglePiP = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoElement) {
        await videoElement.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP failed", err);
    }
  }, []);

  const captureImage = useCallback(
    async (options?: {
      mirror?: boolean;
      format?: string;
      quality?: number;
      filter?: FilterType;
    }) => {
      if (!stream) throw new Error("No stream");
      const track = stream.getVideoTracks()[0];
      const imageCapture =
        "ImageCapture" in window
          ? new (window as any).ImageCapture(track)
          : null;

      const mirror = options?.mirror || false;
      const format = options?.format || "image/png";
      const quality = options?.quality || 0.92;
      const filter = options?.filter || "none";

      let blob: Blob | null;

      // Helper to process canvas
      const processCanvas = (
        source: ImageBitmap | HTMLVideoElement,
      ): Promise<Blob> => {
        const canvas = document.createElement("canvas");
        const width = "videoWidth" in source ? source.videoWidth : source.width;
        const height =
          "videoHeight" in source ? source.videoHeight : source.height;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("No Canvas Context");

        if (mirror) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }

        if (filter !== "none") {
          ctx.filter =
            filter === "grayscale"
              ? "grayscale(100%)"
              : filter === "sepia"
                ? "sepia(100%)"
                : filter === "contrast"
                  ? "contrast(150%)"
                  : filter === "blur"
                    ? "blur(5px)"
                    : "none";
        }

        ctx.drawImage(source, 0, 0);

        return new Promise((res) =>
          canvas.toBlob((b) => res(b!), format, quality),
        );
      };
      if (imageCapture && !filter && !mirror && format === "image/jpeg") {
        blob = await imageCapture.takePhoto();
      } else if (imageCapture) {
        const bitmap = await imageCapture.grabFrame();
        blob = await processCanvas(bitmap);
        bitmap.close();
      } else {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        blob = await processCanvas(video);
        video.pause();
        video.srcObject = null;
      }

      return blob ? URL.createObjectURL(blob) : "";
    },
    [stream],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto Start
  useEffect(() => {
    if (autoStart && !stream) {
      startCamera();
    }
  }, [autoStart, startCamera]); // stream excluded to prevent loops

  return {
    stream,
    error,
    permissionGranted,
    videoDevices,
    audioDevices,
    activePreset,

    startCamera,
    stopCamera,
    acquirePermissions,
    startScreenShare,

    toggleVideo,
    toggleAudio,
    toggleFacingMode,
    togglePiP,

    captureImage,

    controls,
    recorder,
    audioLevel,
    motionDetection,
    barcodeScanner,
    orientation,
    // Expose Storage Utilities
    storage,

    setMotionCallback,
    setBarcodeCallback,

    isCameraActive: !!stream,
  };
};
