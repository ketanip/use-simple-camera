import { useState, useCallback, useEffect } from 'react';

export interface StorageConfig {
    dbName?: string;
    storeName?: string;
    defaultRetentionMs?: number; // Default 7 days
}

export interface UploadOptions {
    url: string; // Presigned URL
    method?: "PUT" | "POST";
    headers?: Record<string, string>;
    withCredentials?: boolean;
    timeout?: number;
    onProgress?: (progress: number) => void;
}

export const useStorage = (config: StorageConfig = {}) => {
    const dbName = config.dbName || 'CameraStore';
    const storeName = config.storeName || 'media';
    const defaultRetentionMs = config.defaultRetentionMs || 7 * 24 * 60 * 60 * 1000; // 1 week
    const [isUploading, setIsUploading] = useState(false);

    // --- Local Storage (IndexedDB) ---

    const initDB = useCallback((): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 2); // Bump version for potential schema changes
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, { keyPath: 'id' });
                    store.createIndex('expiresAt', 'expiresAt', { unique: false });
                } else {
                    // Upgrade existing store if needed
                    const tx = (e.target as IDBOpenDBRequest).transaction!;
                    const store = tx.objectStore(storeName);
                    if (!store.indexNames.contains('expiresAt')) {
                        store.createIndex('expiresAt', 'expiresAt', { unique: false });
                    }
                }
            };
        });
    }, [dbName, storeName]);

    const pruneExpired = useCallback(async () => {
        try {
            const db = await initDB();
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const index = store.index('expiresAt');
            const now = Date.now();
            const range = IDBKeyRange.upperBound(now);

            const req = index.openCursor(range);
            req.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest).result as IDBCursor;
                if (cursor) {
                    console.log(`[useStorage] Auto-deleting expired item: ${cursor.primaryKey}`);
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                }
            };
        } catch (err) {
            console.warn("Failed to prune expired items", err);
        }
    }, [initDB, storeName]);

    // Run prune on mount
    useEffect(() => {
        pruneExpired();
    }, [pruneExpired]);

    const saveToLocal = useCallback(async (blob: Blob, filename: string, options?: { retentionMs?: number }): Promise<void> => {
        try {
            const db = await initDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);

                const retention = options?.retentionMs || defaultRetentionMs;
                const expiresAt = Date.now() + retention;

                const item = {
                    id: filename,
                    blob,
                    date: new Date().toISOString(),
                    type: blob.type,
                    expiresAt
                };
                const req = store.put(item);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        } catch (err) {
            console.error("Save failed", err);
            throw err;
        }
    }, [initDB, storeName, defaultRetentionMs]);

    const getFromLocal = useCallback(async (filename: string): Promise<Blob | null> => {
        try {
            const db = await initDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.get(filename);
                req.onsuccess = () => resolve(req.result ? req.result.blob : null);
                req.onerror = () => reject(req.error);
            });
        } catch (err) {
            return null;
        }
    }, [initDB, storeName]);

    const deleteFromLocal = useCallback(async (filename: string): Promise<void> => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(filename);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }, [initDB, storeName]);

    const downloadFromLocal = useCallback(async (filename: string) => {
        const blob = await getFromLocal(filename);
        if (!blob) throw new Error("File not found");
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [getFromLocal]);

    // --- S3 / Remote Upload ---

    const uploadToRemote = useCallback(async (blob: Blob, options: UploadOptions): Promise<void> => {
        setIsUploading(true);
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(options.method || "PUT", options.url);

            if (options.withCredentials) {
                xhr.withCredentials = true;
            }

            if (options.timeout) {
                xhr.timeout = options.timeout;
            }

            // Add custom headers if any
            if (options.headers) {
                Object.entries(options.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
            }

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && options.onProgress) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    options.onProgress(percent);
                }
            };

            xhr.onload = () => {
                setIsUploading(false);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => {
                setIsUploading(false);
                reject(new Error("Network Error"));
            };

            xhr.ontimeout = () => {
                setIsUploading(false);
                reject(new Error("Upload Timed Out"));
            };

            xhr.send(blob);
        });
    }, []);

    return {
        saveToLocal,
        getFromLocal,
        deleteFromLocal,
        downloadFromLocal,
        uploadToRemote,
        isUploading
    };
};
