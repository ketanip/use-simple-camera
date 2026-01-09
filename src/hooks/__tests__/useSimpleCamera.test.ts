import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSimpleCamera } from "../useSimpleCamera";

// --- Mocks ---
const mockStream = {
  getTracks: vi.fn(() => []),
  getVideoTracks: vi.fn(() => []),
  getAudioTracks: vi.fn(() => []),
};

const mockNavigator = {
  mediaDevices: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn().mockResolvedValue([]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
};

describe("useSimpleCamera", () => {
  beforeEach(() => {
    Object.defineProperty(global, "navigator", {
      value: mockNavigator,
      writable: true,
    });
    (window as any).MediaStream = vi.fn().mockImplementation(() => mockStream);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useSimpleCamera());
    expect(result.current.isCameraActive).toBe(false);
    expect(result.current.stream).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it("should start camera successfully", async () => {
    mockNavigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);

    const { result } = renderHook(() => useSimpleCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.isCameraActive).toBe(true);
    expect(result.current.stream).toBe(mockStream);
  });

  it("should handle permission error", async () => {
    const error = new Error("Permission denied");
    error.name = "NotAllowedError";
    mockNavigator.mediaDevices.getUserMedia.mockRejectedValue(error);

    const { result } = renderHook(() => useSimpleCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.type).toBe("PERMISSION_DENIED");
  });
});
