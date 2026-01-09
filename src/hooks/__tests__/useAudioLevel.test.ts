import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAudioLevel } from "../useAudioLevel";

describe("useAudioLevel", () => {
  let mockAudioContext: any;
  let mockAnalyser: any;
  let mockSource: any;

  beforeEach(() => {
    vi.useFakeTimers();
    // Mock Web Audio API
    mockAnalyser = {
      createAnalyser: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      frequencyBinCount: 16,
      getByteFrequencyData: vi.fn((array) => array.fill(128)),
      fftSize: 2048,
    };

    mockSource = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      createMediaStreamSource: vi.fn(() => mockSource),
      createAnalyser: vi.fn(() => mockAnalyser),
      close: vi.fn().mockResolvedValue(undefined),
      state: "running",
    };

    // Simpler mock
    global.AudioContext = vi.fn(() => mockAudioContext) as any;
    global.window.AudioContext = global.AudioContext;

    // Use strict fake rAF
    (window as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16);
    (window as any).cancelAnimationFrame = (id: any) => clearTimeout(id);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with volume 0", () => {
    const { result } = renderHook(() => useAudioLevel(null));
    expect(result.current.volume).toBe(0);
  });

  it("should connect audio context when stream provided", () => {
    const mockStream = { getAudioTracks: () => [{}] } as MediaStream;
    renderHook(() => useAudioLevel(mockStream));

    expect(window.AudioContext).toHaveBeenCalled();
  });
});
