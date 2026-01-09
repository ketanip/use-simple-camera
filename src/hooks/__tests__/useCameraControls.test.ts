import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useCameraControls } from "../useCameraControls";

describe("useCameraControls", () => {
    const mockTrack = {
        getCapabilities: vi.fn(() => ({ zoom: { min: 1, max: 10 }, torch: true })),
        getSettings: vi.fn(() => ({ zoom: 1 })),
        applyConstraints: vi.fn(),
        getVideoTracks: () => [mockTrack]
    };

    // Mock MediaStream
    const mockStream = {
        getVideoTracks: () => [mockTrack],
    } as unknown as MediaStream;

    it("should initialize with capabilities", () => {
        const { result } = renderHook(() => useCameraControls(mockStream));

        expect(result.current.supports.zoom).toBe(true);
        expect(result.current.minZoom).toBe(1);
        expect(result.current.maxZoom).toBe(10);
    });

    it("should call applyConstraints when setting zoom", async () => {
        const { result } = renderHook(() => useCameraControls(mockStream));

        await act(async () => {
            await result.current.setZoom(2);
        });

        expect(mockTrack.applyConstraints).toHaveBeenCalledWith({
            advanced: [{ zoom: 2 }]
        });
    });
});
