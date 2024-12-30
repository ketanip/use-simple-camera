# 🎥 **Use Simple Camera**

🛠️ Use Simple Camera is a lightweight React hook that simplifies interacting with browser APIs for capturing audio and video from media devices. It abstracts the complexities of managing permissions, media streams, and recording operations, providing a seamless developer experience for building camera-enabled applications.

Whether you're creating a video conferencing app, a custom video recording tool, or an image capture utility, Use Simple Camera equips you with all the essential functionalities in one easy-to-use package.

_Well life's too short for clunky APIs! Whether you’re building a photo booth, a live streamer, or a casual media app, **Use Simple Camera** is your new BFF._

**Find it on NPM** [https://www.npmjs.com/package/use-simple-camera](https://www.npmjs.com/package/use-simple-camera)

**Find it on Github** [https://github.com/ketanip/use-simple-camera](https://github.com/ketanip/use-simple-camera)

## 🚀 **Features**

That'll Make You Go WOW

1. 🛂 **Ask for Permissions** - No awkward surprises; we ensure users are in the loop.
2. 📸 **Capture Images** - Snap stunning photos like a pro.
3. 🎥 **Record Multiple Videos** - Be Spielberg, minus the camera crew.
4. 💾 **Blob It, Download It, Name It** - Recorded videos come as blobs, URLs, or downloads with custom names. They are stored hassle free in browser memory without you needing to handle all that stuff manually.

## 🤷‍♂️ **Why I Created It?**

I was working extensively once with these APIs for a project and that experience annoyed me a lot, so I decided to write custom code that time.

I was planning once again to work with same APIs so not to feel that same unpleasant experience again I decided to create this library (hook).

## Basic Example

```tsx
import { useSimpleCamera } from "use-simple-camera";
import { useState, useRef } from "react";

const MyComponent = () => {
  const [imageURL, setImageURL] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    acquirePermissions,
    captureImage,
    startCamera,
    stopCamera,
    recordVideo,
    stopVideoRecording,
    downloadRecordedVideo,
  } = useSimpleCamera();

  return (
    <div>
      <button onClick={acquirePermissions}>Permissions</button>
      <button onClick={startCamera}>Start</button>
      <button onClick={stopCamera}>Stop</button>
      <button onClick={() => captureImage().then(setImageURL)}>Capture</button>
      <button onClick={() => recordVideo("vid1")}>Record</button>
      <button onClick={stopVideoRecording}>Stop Recording</button>
      <button onClick={() => downloadRecordedVideo("vid1")}>Download</button>

      {imageURL && <img src={imageURL} alt="Captured" />}
      {videoRef && <video ref={videoRef} controls />}
    </div>
  );
};
```

## 🧩 **How It Works**

This hook packs a punch with intuitive, flexible functions. Here’s the action-packed lineup:

- **acquirePermissions** – Requests user permissions to access camera and microphone.
- **startCamera** – Starts the camera, enabling media streaming.
- **stopCamera** – Stops the camera and releases media resources.
- **captureImage** – Captures an image from the video feed.
- **recordVideo** – Starts recording a video.
- **stopVideoRecording** – Stops video recording.
- **getRecordedVideoURL** – Retrieves the recorded video as a URL.
- **getRecordedVideoBlob** – Retrieves the recorded video as a Blob.
- **downloadRecordedVideo** – Downloads the recorded video.
- **getMediaStream** – Returns a custom media stream based on video/audio tracks.

## 🪄 **Hook Returns**

Here’s the magic you'll have at your fingertips:

### 🟢 **Stateful Goodies**

- `permissionAcquired` – Do we have the green light?
- `isCameraActive` – Is the camera rolling?
- `videoDevices` – All available video sources.
- `audioDevices` – All available audio sources.
- `videoRecordingInProgress` – Are we filming?

### 🔧 **Actions**

- **Core**: `acquirePermissions`, `startCamera`, `stopCamera`, `getMediaStream`
- **Image**: `captureImage`
- **Video**: `recordVideo`, `stopVideoRecording`, `getRecordedVideoURL`, `getRecordedVideoBlob`, `downloadRecordedVideo`

### 🧙 **Pro Tips**

1. 💡 **Permissions First**: Always call `acquirePermissions` before anything else.
2. 🛑 **Stop Camera Gracefully**: Use `stopCamera` to release media devices and avoid leaving them active.
3. 🖼️ **Capture Image**: `captureImage` gives you a Base64 blob of your snapshot.
4. 🎥 **Manage Recorded Videos**:
   - `getRecordedVideoURL`: Get a URL to the video.
   - `getRecordedVideoBlob`: Get the raw blob of the video.
   - `downloadRecordedVideo`: Save the video locally.
5. 🎛️ **Custom Streaming**: Combine `getMediaStream` with React refs for custom video streaming, audio-only and video-only streaming.

## ⚙️ **API Reference**

### 1. `acquirePermissions()`

- **Description**: Asks the user for permission to access the camera and microphone.
- **Returns**: `Promise<void>`
- **Example**:

  ```typescript
  await acquirePermissions();
  ```

### 2. `startCamera(config: object)`

- **Description**: Starts the camera to capture video and audio.
- **Parameters**:
  - `config`: Provide `MediaStreamConstraints` for the media input. (optional)
  - Read more at [MDN Docs about it](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#constraints).
- **Returns**: `Promise<void>`
- **Example**:

  ```typescript
  await startCamera();
  ```

### 3. `stopCamera()`

- **Description**: Stops the camera and releases all media devices.
- **Returns**: `Promise<void>`
- **Example**:

  ```typescript
  await stopCamera();
  ```

### 4. `captureImage(videoTrackID?: string)`

- **Description**: Captures an image from the specified video track. If no `videoTrackID` is provided, it uses the first available video device.
- **Returns**: `Promise<string>` – A Base64-encoded string representing the captured image.
- **Example**:

  ```typescript
  const imageURL = await captureImage();
  <img src={imageURL} alt="Captured" />;
  ```

### 5. `recordVideo(id: string, config?: RecordVideoConfig)`

- **Description**: Starts recording a video.
- **Parameters**:
  - `id`: Unique identifier for the recorded video.
  - `config`: Optional configuration object for custom video settings.
    - `videoStreamID`: The ID of the video stream to record.
    - `audioStreamID`: The ID of the audio stream to record.
    - `customMimeType`: Optional MIME type for the video recording (e.g., `'video/webm'`).
- **Returns**: `Promise<void>`
- **Example**:

  ```typescript
   await recordVideo("submission-1234", {
    videoStreamID: "video-stream-1",
    audioStreamID: "audio-stream-1",
    customMimeType: "video/codec=vp9".
   })
  ```

### 6. `stopVideoRecording()`

- **Description**: Stops the ongoing video recording.
- **Returns**: `Promise<void>`
- **Example**:

  ```typescript
  await stopVideoRecording();
  ```

### 7. `getRecordedVideoURL(videoID: string)`

- **Description**: Retrieves the blob URL of the recorded video by its `videoID`.
- **Returns**: `string` – The blob URL of the recorded video.
- **Example**:

  ```typescript
  const videoURL = getRecordedVideoURL("video1");
  <video src={videoURL} controls />;
  ```

### 8. `getRecordedVideoBlob(videoID: string)`

- **Description**: Retrieves the recorded video as a Blob by its `videoID`.
- **Returns**: `Blob` – The raw Blob of the recorded video.
- **Example**:

  ```typescript
  const videoBlob = getRecordedVideoBlob("video1");
  const url = URL.createObjectURL(videoBlob);
  ```

### 9. `downloadRecordedVideo(videoID: string, filename?: string)`

- **Description**: Downloads the recorded video by its `videoID`, with an optional custom filename. **Include file extension. If you haven't changed codec use webm as file extension.**
- **Returns**: `void`
- **Example**:

  ```typescript
  downloadRecordedVideo("video1", "my-video.webm");
  ```

### 10. `getMediaStream(config: GetMediaStreamConfig)`

- **Description**: Retrieves a media stream based on the provided video and audio track IDs.
- **Parameters**:
  - `config`: The configuration for selecting the media stream, which includes `videoID` and `audioID`.
- **Returns**: `Promise<MediaStream>` – The media stream for custom use.
- **Example**:

  ```typescript
  const mediaStream = await getMediaStream({
    videoID: "camera1",
    audioID: "microphone1",
  });
  videoRef.current.srcObject = mediaStream;
  ```

## 🤝 **Contributing**

We welcome contributions! If you'd like to help improve this project, here’s how you can contribute:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and write tests.
4. Open a pull request with a detailed description of your changes.
5. Ensure that all tests pass before submitting.

## 🛡️ **License**

The License for this project is located in `License` file. This project is licensed under MIT License.

## ❓ **Face some Issues ?**

If you encounter any issues or have questions, please open a GitHub issue, and I'll be happy to assist you!

**This is still first version of this library so please be careful while using it your application, test it extensively for your application.**

**✨ Ready to simplify your media game? Let’s roll!**
