import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useStorage } from "../useStorage";

// --- Mocks ---

// Mock IndexedDB
const mockIDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
};

const mockTransaction = {
    objectStore: vi.fn(),
};

const mockStore = {
    put: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    index: vi.fn(),
};

const mockRequest = {
    result: {},
    onerror: null as any,
    onsuccess: null as any,
    onupgradeneeded: null as any,
    transaction: mockTransaction
};

// Mock XMLHttpRequest
const mockXHR = {
    open: vi.fn(),
    send: vi.fn(),
    setRequestHeader: vi.fn(),
    upload: {
        onprogress: null as any
    },
    onload: null as any,
    onerror: null as any,
    ontimeout: null as any,
    status: 200,
    statusText: "OK",
    withCredentials: false,
    timeout: 0
};

describe("useStorage", () => {
    beforeEach(() => {
        // Setup IDB Mock
        (window as any).indexedDB = mockIDB;
        mockIDB.open.mockReturnValue(mockRequest);
        mockTransaction.objectStore.mockReturnValue(mockStore);
        mockStore.index.mockReturnValue({
            getAllKeys: vi.fn(),
            openCursor: vi.fn(),
        });

        // Setup XHR Mock
        (window as any).XMLHttpRequest = vi.fn(() => mockXHR);

        // Reset spies
        vi.clearAllMocks();

        // Ensure successful DB open triggers "onsuccess" with a valid DB object
        // The hook (useStorage) likely calls initDB in useEffect.
        // We simulate the DB opening logic when 'open' is called.
        mockIDB.open.mockImplementation(() => {
            const req = { ...mockRequest, onsuccess: null };
            setTimeout(() => {
                if (req.onsuccess) {
                    // Create a DB mock that has transaction method
                    const db = {
                        transaction: vi.fn(() => mockTransaction),
                        objectStoreNames: { contains: () => true },
                        close: vi.fn()
                    };
                    (req as any).result = db;
                    (req.onsuccess as any)({ target: { result: db } });
                }
            }, 0);
            return req;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should initialize and expose methods", () => {
        const { result } = renderHook(() => useStorage());
        expect(result.current.saveToLocal).toBeDefined();
        expect(result.current.uploadToRemote).toBeDefined();
    });

    describe("uploadToRemote", () => {
        it("should upload with correct headers and credentials", async () => {
            const { result } = renderHook(() => useStorage());
            const blob = new Blob(["test"], { type: "text/plain" });

            const promise = result.current.uploadToRemote(blob, {
                url: "https://example.com/upload",
                method: "PUT",
                headers: { "Content-Type": "video/webm" },
                withCredentials: true,
                timeout: 5000
            });

            expect(mockXHR.open).toHaveBeenCalledWith("PUT", "https://example.com/upload");
            expect(mockXHR.setRequestHeader).toHaveBeenCalledWith("Content-Type", "video/webm");
            expect(mockXHR.withCredentials).toBe(true);
            expect(mockXHR.timeout).toBe(5000);

            // Simulate Network Success
            act(() => {
                mockXHR.onload();
            });

            await expect(promise).resolves.toBeUndefined();
        });

        it("should report progress", async () => {
            const { result } = renderHook(() => useStorage());
            const blob = new Blob(["test"], { type: "text/plain" });
            const onProgress = vi.fn();

            result.current.uploadToRemote(blob, {
                url: "https://example.com",
                onProgress
            });

            act(() => {
                if (mockXHR.upload.onprogress) {
                    mockXHR.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 } as any);
                }
            });

            expect(onProgress).toHaveBeenCalledWith(50);
        });

        it("should handle error", async () => {
            const { result } = renderHook(() => useStorage());
            const blob = new Blob(["test"]);

            const promise = result.current.uploadToRemote(blob, { url: "https://fail.com" });

            act(() => {
                mockXHR.onerror();
            });

            await expect(promise).rejects.toThrow("Network Error");
        });
    });
});
