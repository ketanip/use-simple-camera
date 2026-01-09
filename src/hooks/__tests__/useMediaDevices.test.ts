import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMediaDevices } from "../useMediaDevices";

describe("useMediaDevices", () => {
  beforeEach(() => {
    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        enumerateDevices: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      writable: true,
    });
  });

  it("should return empty devices initially", () => {
    (navigator.mediaDevices.enumerateDevices as any).mockResolvedValue([]);
    const { result } = renderHook(() => useMediaDevices());
    expect(result.current.devices).toEqual([]);
  });

  it("should enumerate devices on mount", async () => {
    const mockDevices = [
      { kind: "videoinput", deviceId: "v1", label: "Cam 1" },
      { kind: "audioinput", deviceId: "a1", label: "Mic 1" },
    ];
    (navigator.mediaDevices.enumerateDevices as any).mockResolvedValue(
      mockDevices,
    );

    const { result } = renderHook(() => useMediaDevices());

    await waitFor(() => {
      expect(result.current.devices).toHaveLength(2);
      expect(result.current.videoDevices).toHaveLength(1);
      expect(result.current.audioDevices).toHaveLength(1);
    });
  });
});
