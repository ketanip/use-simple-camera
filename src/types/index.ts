// Custom Error Types for better DX
export type CameraErrorType =
    | "PERMISSION_DENIED"
    | "NO_DEVICE_FOUND"
    | "CONSTRAINT_ERROR"
    | "UNKNOWN_ERROR"
    | "BROWSER_NOT_SUPPORTED";

export interface CameraError {
    type: CameraErrorType;
    message: string;
    originalError?: Error;
}

export type CameraFacingMode = "user" | "environment";
export type CameraPreset = "SD" | "HD" | "FHD" | "4K" | "Instagram";

// Main Configuration Interface
export interface UseCameraConfig {
    autoStart?: boolean;
    defaultConstraints?: MediaStreamConstraints;
    mock?: boolean; // Developer Feature: Mock stream if no camera
    autoRetry?: boolean; // Developer Feature: Auto-retry on failure
    debug?: boolean; // Developer Feature: Logging
}

export interface CameraState {
    isStreaming: boolean;
    error: CameraError | null;
    stream: MediaStream | null;
}

export interface CameraControls {
    zoom: number;
    minZoom: number;
    maxZoom: number;
    setZoom: (value: number) => Promise<void>;

    flash: boolean;
    hasFlash: boolean;
    setFlash: (enabled: boolean) => Promise<void>;

    // Advanced Controls
    pan: number;
    tilt: number;
    setPan: (value: number) => Promise<void>;
    setTilt: (value: number) => Promise<void>;

    // Focus & Exposure
    focusMode: 'auto' | 'manual' | 'continuous' | 'none';
    setFocusMode: (mode: 'auto' | 'manual' | 'continuous') => Promise<void>;
    focusDistance: number; // 0.0 - 1.0
    setFocusDistance: (value: number) => Promise<void>;

    supports: {
        zoom: boolean;
        flash: boolean;
        pan: boolean;
        tilt: boolean;
        focusMode: boolean;
        focusDistance: boolean;
    };
}

export interface VideoRecorderOptions {
    mimeType?: string;
    timeLimitMs?: number;
    onRecordingStart?: () => void;
    onRecordingStop?: (blob: Blob) => void;
}

export interface DecoderOptions {
    onDetect: (code: string) => void;
    formats?: string[];
}

export interface MotionDetectionOptions {
    sensitivity?: number;
    intervalMs?: number;
    onMotion?: () => void;
}

export type FilterType = "none" | "grayscale" | "sepia" | "contrast" | "blur";
