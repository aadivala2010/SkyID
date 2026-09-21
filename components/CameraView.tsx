"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CompassIcon } from "./Icons";
import { PermissionState } from "./PermissionState";

type CameraStatus = "requesting" | "ready" | "denied" | "unavailable";

interface CameraViewProps {
  onStatusChange?: (status: CameraStatus) => void;
}

export function CameraView({ onStatusChange }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("requesting");
  const [dismissed, setDismissed] = useState(false);

  const updateStatus = useCallback(
    (next: CameraStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setDismissed(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      updateStatus("unavailable");
      return;
    }

    updateStatus("requesting");
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      updateStatus("ready");
    } catch (error) {
      const denied = error instanceof DOMException && error.name === "NotAllowedError";
      updateStatus(denied ? "denied" : "unavailable");
    }
  }, [stopCamera, updateStatus]);

  useEffect(() => {
    const initialStart = window.setTimeout(() => void startCamera(), 0);
    const handleVisibility = () => {
      if (document.hidden) stopCamera();
      else void startCamera();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(initialStart);
      document.removeEventListener("visibilitychange", handleVisibility);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <div className={`camera-layer camera-${status}`}>
      <video ref={videoRef} className="camera-video" autoPlay muted playsInline aria-hidden="true" />
      <div className="camera-shade" />
      {status !== "ready" && !dismissed ? (
        <PermissionState
          icon={<CompassIcon width={26} height={26} />}
          eyebrow={status === "requesting" ? "STARTING CAMERA" : "CAMERA ACCESS"}
          title={status === "requesting" ? "Opening the sky view" : "Use SkyID without the camera"}
          message={
            status === "requesting"
              ? "Your rear camera is used only as a local live view."
              : "Camera access is unavailable. Demo traffic and the full matching engine still work."
          }
          primaryLabel={status === "requesting" ? "Please wait" : "Try camera again"}
          onPrimary={() => void startCamera()}
          primaryDisabled={status === "requesting"}
          secondaryLabel={status === "requesting" ? undefined : "Continue in Demo"}
          onSecondary={() => setDismissed(true)}
        />
      ) : null}
    </div>
  );
}
