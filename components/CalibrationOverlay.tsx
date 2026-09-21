"use client";

import { useEffect, useRef, useState } from "react";
import { CompassIcon, CloseIcon } from "./Icons";

interface CalibrationOverlayProps {
  open: boolean;
  heading?: number;
  onClose: () => void;
}

export function CalibrationOverlay({ open, heading, onClose }: CalibrationOverlayProps) {
  const lastHeading = useRef<number | undefined>(undefined);
  const [travel, setTravel] = useState(0);

  useEffect(() => {
    if (!open || heading === undefined) return;
    if (lastHeading.current !== undefined) {
      const difference = Math.abs(((heading - lastHeading.current + 540) % 360) - 180);
      if (difference < 45) setTravel((value) => Math.min(220, value + difference));
    }
    lastHeading.current = heading;
  }, [heading, open]);

  if (!open) return null;
  const progress = Math.round((travel / 220) * 100);
  const complete = progress >= 100;

  return (
    <div className="calibration-overlay" role="dialog" aria-modal="true" aria-labelledby="calibration-title">
      <button className="calibration-close glass" type="button" onClick={onClose} aria-label="Close calibration">
        <CloseIcon width={20} height={20} />
      </button>
      <div className="calibration-content">
        <div className={`calibration-orbit ${complete ? "calibration-complete" : ""}`}>
          <div className="calibration-compass" style={{ rotate: `${-(heading ?? 0)}deg` }}>
            <CompassIcon width={64} height={64} />
          </div>
        </div>
        <p className="eyebrow">SENSOR CALIBRATION</p>
        <h2 id="calibration-title">{complete ? "Ready to track" : "Slowly rotate your phone"}</h2>
        <p>{complete ? "The compass has seen enough movement for this session." : "Turn through a wide arc while keeping the phone upright."}</p>
        <div className="calibration-progress" aria-label={`Calibration ${progress}% complete`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <button className="primary-button" type="button" onClick={onClose}>
          {complete ? "Return to camera" : "Continue without calibrating"}
        </button>
      </div>
    </div>
  );
}
