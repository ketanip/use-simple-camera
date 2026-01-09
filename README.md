# 🎥 **Use Simple Camera**

[![NPM Version](https://img.shields.io/npm/v/@ketanip/use-simple-camera.svg?style=flat-square)](https://www.npmjs.com/package/@ketanip/use-simple-camera)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ketanip/use-simple-camera/ci.yml?branch=main&style=flat-square&label=build)](https://github.com/ketanip/use-simple-camera/actions)
[![Minzipped Size](https://img.shields.io/bundlephobia/minzip/@ketanip/use-simple-camera?style=flat-square&label=size)](https://bundlephobia.com/package/@ketanip/use-simple-camera)
[![Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)](https://packagephobia.com/result?p=@ketanip/use-simple-camera)
[![TypeScript](https://img.shields.io/badge/ts-ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Style: Biome](https://img.shields.io/badge/code_style-biome-60a5fa?style=flat-square&logo=biome)](https://biomejs.dev/)
[![Socket Badge](https://socket.dev/api/badge/npm/package/@ketanip/use-simple-camera)](https://socket.dev/npm/package/@ketanip/use-simple-camera)
[![npm downloads](https://img.shields.io/npm/dm/@ketanip/use-simple-camera?style=flat-square&label=downloads)](https://www.npmjs.com/package/@ketanip/use-simple-camera)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fketanip%2Fuse-simple-camera.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fketanip%2Fuse-simple-camera?ref=badge_shield)
[![Snyk](https://snyk.io/test/github/ketanip/use-simple-camera/badge.svg)](https://snyk.io/test/github/ketanip/use-simple-camera)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ketanip/use-simple-camera/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ketanip/use-simple-camera)
[![Gitpod Ready](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod&style=flat-square)](https://gitpod.io/#https://github.com/ketanip/use-simple-camera)
[![semantic-release](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release&style=flat-square)](https://github.com/semantic-release/semantic-release)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg?style=flat-square)](CODE_OF_CONDUCT.md)

**Use Simple Camera** is a production-ready, zero-dependency React hook library for comprehensive camera and media handling. It provides a robust set of hooks for video recording, local/remote storage, computer vision (barcodes, motion detection), and hardware controls (zoom, flash, pan, tilt).

## ✨ Features

- 📸 **Easy Camera Access**: Simple API to get camera stream, switch cameras, and capture images.
- 🎥 **Video Recording**: Record video/audio blobs with `MediaRecorder` API.
- 💾 **Storage**: Save recordings to IndexedDB or upload via XHR/S3.
- 🔍 **Computer Vision**: Built-in hooks for Barcode detection and Motion detection.
- 🛠 **Hardware Controls**: Control Zoom, Flash, Pan, and Tilt if supported.
- 🎙 **Audio Utilities**: Monitor microphone volume levels in real-time.
- 📱 **Orientation**: Detect device orientation for responsive UI.
- 🌲 **Tree Shakeable**: Import only the hooks you need.

---

## 📦 **Installation**

```bash
npm install @ketanip/use-simple-camera
# or
pnpm add @ketanip/use-simple-camera
# or
yarn add @ketanip/use-simple-camera
```

---

## ⚡ **Quick Start**

The `useSimpleCamera` hook is the entry point that composes most features, but you can use individual hooks as standalone primitives.

```tsx
import { useSimpleCamera } from "@ketanip/use-simple-camera";

const App = () => {
  const { stream, ref, error, startCamera, captureImage } = useSimpleCamera();
  
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
       <video ref={ref} autoPlay muted playsInline />
       <button onClick={() => captureImage()}>Take Photo</button>
    </div>
  );
};
```

---

## 📚 **API Documentation**

### 1. `useSimpleCamera`

The main hook for managing camera lifecycle, permissions, and stream state.

| Property | Type | Description |
| :--- | :--- | :--- |
| `stream` | `MediaStream \| null` | The active camera stream. |
| `startCamera` | `(constraints?) => Promise` | Manually starts the camera. |
| `stopCamera` | `() => void` | Stops all tracks and releases camera. |
| `captureImage` | `(options?) => string` | Captures a base64 image. |
| `error` | `CameraError \| null` | Typed error object if something fails. |
| `isCameraActive` | `boolean` | True if stream is active. |
| `switchCamera` | `() => void` | Toggles between front and back cameras. |

### 2. `useRecorder`

Handles video and audio recording with support for separate streams and callbacks.

```tsx
import { useRecorder } from "use-simple-camera";
const { startRecording, stopRecording, isRecording } = useRecorder(stream);
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `startRecording` | `(options?) => void` | Starts recording media. Options: `mode`, `onComplete`. |
| `stopRecording` | `() => void` | Stops recording and triggers `onComplete` with blob. |
| `takeSnapshot` | `() => Promise<Blob>` | Captures a high-res still photo. |

### 3. `useStorage`

Manage local persistence (IndexedDB) and remote uploads (S3/XHR).

```tsx
import { useStorage } from "use-simple-camera";
const { saveToLocal, uploadToRemote } = useStorage();
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `saveToLocal` | `(blob, name, opts) => Promise` | Save blob to IndexedDB with optional retention. |
| `getFromLocal` | `(name) => Promise<Blob>` | Retrieve blob from IndexedDB. |
| `uploadToRemote` | `(blob, opts) => Promise` | Upload to signed URL. Options: headers, timeout, etc. |

### 4. `useCameraControls`

Control hardware features like Zoom, Flash, Pan, and Tilt.

```tsx
import { useCameraControls } from "use-simple-camera";
const { zoom, setZoom, flash, setFlash, supports } = useCameraControls(stream);
```

### 5. `useBarcodeScanner`

Detects QR codes and Barcodes in real-time.

```tsx
const { barcodes, isScanning } = useBarcodeScanner(stream, { formats: ['qr_code'] });
```

### 6. `useMotionDetection`

Detects movement in the video feed using pixel differencing.

```tsx
const { motionDetected } = useMotionDetection(stream, { threshold: 10 });
```

### 7. `useAudioLevel`

Monitors real-time microphone volume.

```tsx
const { volume } = useAudioLevel(stream); // 0-100
```

### 8. `useOrientation`

Tracks device screen orientation.

```tsx
const { orientation, angle } = useOrientation(); // 'portrait' | 'landscape'
```

### 9. `useMediaDevices`

Enumerates available audio and video inputs.

```tsx
const { videoDevices, audioDevices } = useMediaDevices();
```

---

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 **License**

This project is licensed under the MIT License.
