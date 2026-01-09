import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMotionDetection } from "../useMotionDetection";

describe("useMotionDetection", () => {
  it("should initialize with false state", () => {
    const { result } = renderHook(() => useMotionDetection(null));
    expect(result.current.motionDetected).toBe(false);
  });

  // Motion detection relies heavily on canvas and pixel manipulation which is hard to mock in JSDOM.
  // We verify the hook structure primarily.
});
