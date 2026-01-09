import { useState, useEffect, useRef } from "react";
import { DecoderOptions } from "../types";

export const useBarcodeScanner = (
    stream: MediaStream | null,
    options: DecoderOptions
) => {
    const { onDetect, formats = ["qr_code"] } = options;
    const [isSupported, setIsSupported] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check support
        if ("BarcodeDetector" in window) {
            // Validate formats
            (window as any).BarcodeDetector.getSupportedFormats()
                .then((supported: string[]) => {
                    const hasSupport = formats.some(f => supported.includes(f));
                    setIsSupported(hasSupport);
                })
                .catch(() => setIsSupported(false));
        } else {
            setIsSupported(false);
        }
    }, [formats]);

    useEffect(() => {
        if (!stream || !isSupported) return;

        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.play().catch(console.error);

        const detector = new (window as any).BarcodeDetector({ formats });

        const scan = async () => {
            if (video.videoWidth === 0) return;
            try {
                const barcodes = await detector.detect(video);
                if (barcodes.length > 0) {
                    barcodes.forEach((b: any) => onDetect(b.rawValue));
                }
            } catch (err) {
                console.warn("Barcode detection failed", err);
            }
        };

        setIsScanning(true);
        intervalRef.current = setInterval(scan, 500); // Check 2x per second

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            video.pause();
            video.srcObject = null;
        };
    }, [stream, isSupported]);

    return { isSupported, isScanning };
};
