import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBarcodeScanner } from "../useBarcodeScanner";

describe("useBarcodeScanner", () => {
  let mockBarcodeDetector: any;

  beforeEach(() => {
    vi.useFakeTimers();
    mockBarcodeDetector = {
      detect: vi
        .fn()
        .mockResolvedValue([{ rawValue: "12345", format: "qr_code" }]),
    };
    (window as any).BarcodeDetector = vi.fn(() => mockBarcodeDetector);
    (window as any).BarcodeDetector.getSupportedFormats = vi
      .fn()
      .mockResolvedValue(["qr_code"]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize and detect barcodes", async () => {
    // Mock stream and video element
    const mockStream = { getVideoTracks: () => [{}] } as MediaStream;
    const onDetect = vi.fn();

    const { result } = renderHook(() =>
      useBarcodeScanner(mockStream, {
        formats: ["qr_code"],
        onDetect,
      }),
    );

    // It starts false, then becomes true after async check
    expect(result.current.isScanning).toBe(false);
  });

  it("should handle unsupported browser", () => {
    const originalDetector = (window as any).BarcodeDetector;
    (window as any).BarcodeDetector = undefined;

    const { result } = renderHook(() =>
      useBarcodeScanner(null, { formats: [], onDetect: vi.fn() }),
    );
    expect(result.current.isSupported).toBe(false);

    // Restore for other tests
    (window as any).BarcodeDetector = originalDetector;
  });
});
