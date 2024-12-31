import { useState, useEffect } from "react";

interface RecordVideoConfig {
    videoStreamID: string;
    audioStreamID: string;
    customMimeType?: string;
}

interface GetMediaStreamConfig {
    videoID: "none" | "default" | string;
    audioID: "none" | "default" | string;
}

export const useSimpleCamera = () => {
    // Permissions
    const [permissionAcquired, setPermissionAcquired] = useState<boolean>(false);

    // Core
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    // Device IDs
    const [videoDevicesIDs, setVideoDevicesID] = useState<MediaStreamTrack[]>([]);
    const [audioDevicesIDs, setAudioDevicesID] = useState<MediaStreamTrack[]>([]);

    // Video Recoding
    const [videoRecodingInProgress, setVideoRecodingInProgress] =
        useState<boolean>(false);
    const [activeMediaRecorder, setActiveMediaRecorder] =
        useState<MediaRecorder | null>(null);

    // Video Storage
    const [videos, setVideos] = useState<
        { id: string; data: Blob; processed: boolean }[]
    >([]);

    // Recorded video statuses
    const [videoProcessingStatus, setVideoProcessingStatus] = useState<{ id: string, status: "processing" | "ready" }[]>([]);

    // Use effect to check if permissions are already granted.
    useEffect(() => {
        const checkPermissions = async () => {
            try {
                if (!navigator.permissions) {
                    console.warn(
                        "Permissions API not supported. Falling back to media device check."
                    );
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true,
                    });
                    stream.getTracks().forEach((track) => track.stop());
                    setPermissionAcquired(true);
                    return;
                }

                const permissions = ["camera", "microphone"];
                const results = await Promise.all(
                    permissions.map(async (name) => {
                        const status = await navigator.permissions.query({
                            name: name as PermissionName,
                        });
                        return status.state === "granted";
                    })
                );

                setPermissionAcquired(results.every(Boolean));
            } catch {
                setPermissionAcquired(false);
            }
        };

        checkPermissions();
    }, []);

    // This use effect check and updated the status of the videos and how they are processed.
    useEffect(() => {
        const updateVideoProcessingStatus = () => {
            setVideoProcessingStatus(videos.map(item => ({ id: item.id, status: item.processed ? "ready" : "processing" })));
        };
        updateVideoProcessingStatus();
    }, [videos]);

    /**
     * This function asks user for permission to access cameras and microphone.
     * It will throw and error if it fails to acquire permissions.
     * @returns {Promise<void>}
     */
    const acquirePermissions = async (): Promise<void> => {
        try {
            if (permissionAcquired) return;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            stream.getTracks().forEach((track) => track.stop());
            setPermissionAcquired(true);
        } catch (error) {
            console.error("Error acquiring permissions:", error);
            setPermissionAcquired(false);
            throw new Error("Failed to acquire permissions.");
        }
    };

    /**
     * This function will start camera for further use. You must start camera to capture video and audio
     * and to perform actions such as to capture video and images.
     * @param config
     * @returns {Promise<void>}
     */
    const startCamera = async (
        config?: MediaStreamConstraints
    ): Promise<void> => {
        try {
            // Checking if permissions are granted.
            if (!acquirePermissions)
                throw new Error("Failed to acquire permission for media device usage.");

            // Setting up flexible media stream constraints.
            const mediaStreamConstraints: MediaStreamConstraints = config
                ? config
                : {
                    video: true,
                    audio: true,
                };

            // Getting media stream.
            const mediaStream = await navigator.mediaDevices.getUserMedia(
                mediaStreamConstraints
            );

            // Saving video and audio devices.
            setVideoDevicesID(mediaStream.getVideoTracks());
            setAudioDevicesID(mediaStream.getAudioTracks());

            // Setting up media stream.
            setMediaStream(mediaStream);
            setIsCameraActive(true);
        } catch (error: any) {
            if (error.name == "NotAllowedError") {
                setPermissionAcquired(false);
                throw new Error("Failed to acquire permission for media device usage.");
            }
            throw error;
        }
    };

    /**
     * This function will stop camera and all the other media devices and release them.
     * @returns {Promise<void>}
     */
    const stopCamera = async (): Promise<void> => {
        mediaStream?.getTracks().forEach((item) => item.stop());
        setAudioDevicesID([]);
        setVideoDevicesID([]);
        setIsCameraActive(false);
    };

    /**
     * This function will capture image from the specified videoTrackID, if it not specified it will use the fist video device as provided by media stream.
     * @param {string} [videoTrackID]  ID of video track from which you want to capture image.
     * @returns {Promise<string>} URL to image.
     */
    const captureImage = async (videoTrackID?: string): Promise<string> => {
        try {
            // Checking permissions.
            if (!permissionAcquired) {
                setPermissionAcquired(false);
                throw new Error("Failed to acquire permission for media device usage.");
            }

            // Checking media streams.
            if (!mediaStream) throw new Error("Camera not active, start camera.");

            // Getting the appropriate video stream track.
            const videoStreamTrack = videoTrackID
                ? mediaStream.getTracks().find((item) => item.id === videoTrackID)
                : mediaStream.getVideoTracks()[0];

            // Checking for video stream track.
            if (!videoStreamTrack) throw new Error("No video track available.");

            // Checking if Image Capture API is supported.
            if ((window as any).ImageCapture) {
                const imageCapture = new (window as any).ImageCapture(videoStreamTrack);
                const blob = await imageCapture.takePhoto();
                const imageURL = URL.createObjectURL(blob);
                return imageURL;
            }

            // Defaulting to creating a canvas and then rendering photo and then using it to capture image.

            // Create a canvas for capturing images.
            const videoElement = document.createElement("video");
            videoElement.srcObject = new MediaStream([videoStreamTrack]);

            // Wait for the video to load its metadata and start playing video.
            await new Promise<void>((resolve, reject) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play().then(resolve).catch(reject);
                };
            });

            // Create a canvas with the correct dimensions.
            const canvas = document.createElement("canvas");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Failed to create canvas context.");

            // Draw the current frame onto the canvas.
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Convert the canvas content to a data URL.
            const imageURL = canvas.toDataURL("image/png");

            // Clean up resources.
            videoElement.pause();
            if (videoElement.srcObject) videoElement.srcObject = null;
            canvas.remove();
            videoElement.remove();

            return imageURL;
        } catch (error: any) {
            throw new Error(
                `Failed to capture image. Original error: ${error.message || error}`
            );
        }
    };

    /**
     * This function start the recoding of video. To terminate / complete the recoding of video call `stopVideoRecoding` function.
     * @param {string} id This is the unique identifier use to identify the recorded videos.
     * @param {RecordVideoConfig} config This is configuration for recoding videos with custom parameters.
     * @returns {Promise<void>}
     */
    const recordVideo = async (
        id: string,
        config?: RecordVideoConfig
    ): Promise<void> => {
        if (videoRecodingInProgress)
            throw new Error("Video recording is already in progress.");

        if (!mediaStream) throw new Error("Media stream is not available.");

        setVideos((previousVideos) => [
            ...previousVideos.filter((item) => item.id != id),
            {
                id,
                data: new Blob(),
                processed: false,
            },
        ]);

        let customMediaStream: MediaStream = mediaStream;

        if (config) {
            const customVideoStreamTrack = mediaStream.getTrackById(
                config.videoStreamID
            );
            const customAudioStreamTrack = mediaStream.getTrackById(
                config.audioStreamID
            );
            if (customVideoStreamTrack && customAudioStreamTrack) {
                customMediaStream = new MediaStream([
                    customVideoStreamTrack,
                    customAudioStreamTrack,
                ]);
            }
        }

        const mediaRecorder = new MediaRecorder(customMediaStream, {
            mimeType: config?.customMimeType ? config.customMimeType : "video/webm",
        });

        setActiveMediaRecorder(mediaRecorder);

        const videoBlobsRecorded: Blob[] = [];
        mediaRecorder.addEventListener("dataavailable", (e) =>
            videoBlobsRecorded.push(e.data)
        );

        mediaRecorder.addEventListener("stop", (_e) => {
            setVideos((previousVideos) => [
                ...previousVideos.filter((item) => item.id != id),
                {
                    id,
                    data: new Blob(videoBlobsRecorded, {
                        type: config?.customMimeType ? config.customMimeType : "video/webm",
                    }),
                    processed: true,
                },
            ]);
            setActiveMediaRecorder(null);
            setVideoRecodingInProgress(false);
        });

        setVideoRecodingInProgress(true);
        mediaRecorder.start(1000);
    };

    /**
     * This function stop any ongoing video recoding.
     * @returns {Promise<void>}
     */
    const stopVideoRecording = async (): Promise<void> => {
        if (!videoRecodingInProgress || !activeMediaRecorder)
            throw new Error("Video recording is not in progress.");

        activeMediaRecorder.stop();
    };

    /**
     * Retrieves the URL for a recorded video blob if it exists.
     * @param {string} videoID - The unique identifier used to locate the recorded video.
     * @returns {string} A `blob:` URL pointing to the recorded video data.
     * @throws {Error} If no video with the provided `videoID` exists.
     */
    const getRecordedVideoURL = (videoID: string): string => {
        const existingVideo = videos.find((item) => item.id === videoID);
        if (!existingVideo) throw new Error(`No video with ${videoID} exists.`);
        if (!existingVideo.processed)
            throw new Error(`Video ${videoID} still processing.`);
        return URL.createObjectURL(existingVideo.data);
    };

    /**
     * Retrieves the recorded video blob if it exists.
     * @param {string} videoID - The unique identifier used to locate the recorded video.
     * @returns {Blob} The blob data of the recorded video.
     * @throws {Error} If no video with the provided `videoID` exists.
     */
    const getRecordedVideoBlob = (videoID: string): Blob => {
        const existingVideo = videos.find((item) => item.id === videoID);
        if (!existingVideo) throw new Error(`No video with ${videoID} exists.`);
        if (!existingVideo.processed)
            throw new Error(`Video ${videoID} still processing.`);

        return existingVideo.data;
    };

    /**
     * Downloads a recorded video as a file.
     * @param {string} videoID - The unique identifier of the video to be downloaded.
     * @param {string} [filename] - Optional custom filename for the downloaded file. Defaults to the video ID with a `.webm` extension.
     * @throws {Error} If no video with the specified `videoID` exists.
     */
    const downloadRecordedVideo = (videoID: string, filename?: string) => {
        const existingVideo = videos.find((item) => item.id === videoID);
        if (!existingVideo) throw new Error(`No video with ${videoID} exists.`);
        if (!existingVideo.processed)
            throw new Error(`Video ${videoID} still processing.`);

        const tempDownload = document.createElement("a");
        const blobURL = URL.createObjectURL(existingVideo.data);
        tempDownload.href = blobURL;
        tempDownload.download = filename || `${videoID}.webm`;
        tempDownload.click();

        URL.revokeObjectURL(blobURL);
    };


    /**
     * Retrieves a media stream with specified video and audio tracks.
     * @param {GetMediaStreamConfig} config - Configuration object containing video and audio track IDs.
     * @returns {Promise<MediaStream>} A promise that resolves to a new MediaStream containing the selected tracks.
     * @throws {Error} If the specified video or audio track cannot be found.
     */
    const getMediaStream = async (
        config: GetMediaStreamConfig
    ): Promise<MediaStream> => {
        if (!mediaStream) throw new Error("Failed to initialize media stream.");

        const tracks: MediaStreamTrack[] = [];

        if (config.videoID !== "none") {
            console.log(config);

            const videoTrack =
                config.videoID === "default"
                    ? mediaStream.getVideoTracks()[0]
                    : mediaStream
                        .getTracks()
                        .find((track) => track.id === config.videoID);

            if (!videoTrack) throw new Error("Invalid video source ID.");

            tracks.push(videoTrack);
        }

        if (config.audioID !== "none") {
            const audioTrack =
                config.audioID === "default"
                    ? mediaStream.getAudioTracks()[0]
                    : mediaStream
                        .getTracks()
                        .find((track) => track.id === config.audioID);

            if (!audioTrack) throw new Error("Invalid audio source ID.");

            tracks.push(audioTrack);
        }

        return new MediaStream(tracks);
    };

    return {
        // States
        permissionAcquired,
        isCameraActive,
        videoDevicesIDs,
        audioDevicesIDs,
        videoProcessingStatus,
        videoRecodingInProgress,

        // Actions
        acquirePermissions,

        // Core
        startCamera,
        stopCamera,
        getMediaStream,

        // Image
        captureImage,

        // Video
        recordVideo,
        stopVideoRecording,
        getRecordedVideoURL,
        downloadRecordedVideo,
        getRecordedVideoBlob,
    };
};
