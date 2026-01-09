import { useCallback, useEffect, useState } from "react";

export const useMediaDevices = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);
      setVideoDevices(allDevices.filter((d) => d.kind === "videoinput"));
      setAudioDevices(allDevices.filter((d) => d.kind === "audioinput"));
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  }, []);

  useEffect(() => {
    enumerateDevices();
    navigator.mediaDevices.addEventListener("devicechange", enumerateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        enumerateDevices,
      );
    };
  }, [enumerateDevices]);

  return { devices, videoDevices, audioDevices, enumerateDevices };
};
