import { useCallback, useEffect, useState } from "react";
import type { CameraControls } from "../types";

export const useCameraControls = (
  stream: MediaStream | null,
): CameraControls => {
  const [capabilities, setCapabilities] =
    useState<MediaTrackCapabilities | null>(null);
  const [settings, setSettings] = useState<MediaTrackSettings | null>(null);

  // States
  const [zoom, setZoomState] = useState<number>(1);
  const [flash, setFlashState] = useState<boolean>(false);
  const [pan, setPanState] = useState<number>(0);
  const [tilt, setTiltState] = useState<number>(0);
  const [focusMode, setFocusModeState] = useState<
    "auto" | "manual" | "continuous" | "none"
  >("none");
  const [focusDistance, setFocusDistanceState] = useState<number>(0);

  // Updates capabilities when stream changes
  useEffect(() => {
    if (!stream) {
      setCapabilities(null);
      setSettings(null);
      return;
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const cap = videoTrack.getCapabilities?.() || {};
    const set = videoTrack.getSettings?.() || {};

    setCapabilities(cap);
    setSettings(set);

    if ((set as any).zoom) setZoomState((set as any).zoom);

    // Type assertion for properties not yet in standard TS dom lib
    const s = set as any;
    if (s.pan) setPanState(s.pan);
    if (s.tilt) setTiltState(s.tilt);
    if (s.focusMode) setFocusModeState(s.focusMode);
    if (s.focusDistance) setFocusDistanceState(s.focusDistance);
  }, [stream]);

  const applyConstraint = useCallback(
    async (constraints: MediaTrackConstraints) => {
      if (!stream) return;
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) return;

      try {
        await videoTrack.applyConstraints({ advanced: [constraints] });
        const newSettings = videoTrack.getSettings();
        setSettings(newSettings);
      } catch (err) {
        console.error("Failed to apply constraints:", err);
      }
    },
    [stream],
  );

  const setZoom = useCallback(
    async (value: number) => {
      await applyConstraint({ zoom: value } as any);
      setZoomState(value);
    },
    [applyConstraint],
  );

  const setFlash = useCallback(
    async (enable: boolean) => {
      await applyConstraint({ torch: enable } as any);
      setFlashState(enable);
    },
    [applyConstraint],
  );

  const setPan = useCallback(
    async (value: number) => {
      await applyConstraint({ pan: value } as any);
      setPanState(value);
    },
    [applyConstraint],
  );

  const setTilt = useCallback(
    async (value: number) => {
      await applyConstraint({ tilt: value } as any);
      setTiltState(value);
    },
    [applyConstraint],
  );

  const setFocusMode = useCallback(
    async (mode: "auto" | "manual" | "continuous") => {
      await applyConstraint({ focusMode: mode } as any);
      setFocusModeState(mode);
    },
    [applyConstraint],
  );

  const setFocusDistance = useCallback(
    async (value: number) => {
      await applyConstraint({ focusDistance: value } as any);
      setFocusDistanceState(value);
    },
    [applyConstraint],
  );

  return {
    // Current Values
    zoom,
    minZoom: (capabilities as any)?.zoom?.min || 1,
    maxZoom: (capabilities as any)?.zoom?.max || 1,
    flash,
    hasFlash: !!(capabilities as any)?.torch,
    pan,
    tilt,
    focusMode,
    focusDistance,

    // Setters
    setZoom,
    setFlash,
    setPan,
    setTilt,
    setFocusMode,
    setFocusDistance,

    // Support flags
    supports: {
      zoom: !!(capabilities as any)?.zoom,
      flash: !!(capabilities as any)?.torch,
      pan: !!(capabilities as any)?.pan,
      tilt: !!(capabilities as any)?.tilt,
      focusMode: !!(capabilities as any)?.focusMode,
      focusDistance: !!(capabilities as any)?.focusDistance,
    },
  };
};
