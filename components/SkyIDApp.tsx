"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateAircraftScreenPosition } from "@/lib/ar/projection";
import { getNearbyAircraft } from "@/lib/aircraft/LiveAircraftProvider";
import { getMatchLabel, isPointingAtAircraft, rankAircraftCandidates } from "@/lib/aircraft/matching";
import { watchLocation, type LocationReading } from "@/lib/sensors/location";
import {
  listenToOrientation,
  needsOrientationPermission,
  requestOrientationPermission,
  type OrientationReading,
} from "@/lib/sensors/orientation";
import type { Aircraft, AltitudeUnit, DistanceUnit, ObserverPosition } from "@/types/aircraft";
import { ARAircraftMarker } from "./ARAircraftMarker";
import { AircraftInfoCard } from "./AircraftInfoCard";
import { AircraftList } from "./AircraftList";
import { BottomControls } from "./BottomControls";
import { CalibrationOverlay } from "./CalibrationOverlay";
import { CameraView } from "./CameraView";
import { LocationIcon } from "./Icons";
import { SettingsSheet } from "./SettingsSheet";
import { StatusBar } from "./StatusBar";

type LocationStatus = "locating" | "ready" | "denied" | "unavailable";
type OrientationStatus = "waiting" | "needs-permission" | "ready" | "approximate" | "denied" | "unavailable";
type AircraftDataStatus = "waiting-location" | "loading" | "ready" | "offline";

export function SkyIDApp() {
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("mi");
  const [altitudeUnit, setAltitudeUnit] = useState<AltitudeUnit>("ft");
  const [showAircraftType, setShowAircraftType] = useState(true);
  const [showFlightPath, setShowFlightPath] = useState(true);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("locating");
  const [location, setLocation] = useState<LocationReading>();
  const [orientationStatus, setOrientationStatus] = useState<OrientationStatus>("waiting");
  const [orientation, setOrientation] = useState<OrientationReading>();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [aircraftDataStatus, setAircraftDataStatus] = useState<AircraftDataStatus>("waiting-location");
  const [selectedIcao, setSelectedIcao] = useState<string>();
  const [manualSelection, setManualSelection] = useState(false);
  const [aircraftListOpen, setAircraftListOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [locationRetryKey, setLocationRetryKey] = useState(0);
  const [dataRetryKey, setDataRetryKey] = useState(0);
  const [viewport, setViewport] = useState({ width: 390, height: 844 });
  const orientationCleanup = useRef<() => void>(() => undefined);

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    updateViewport();
    window.addEventListener("resize", updateViewport);
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    return watchLocation(
      (reading) => {
        setLocation(reading);
        setLocationStatus("ready");
        setAircraftDataStatus((status) => status === "waiting-location" ? "loading" : status);
      },
      (error) => {
        setLocation(undefined);
        setAircraft([]);
        setAircraftDataStatus("waiting-location");
        setLocationStatus("code" in error && error.code === 1 ? "denied" : "unavailable");
      },
    );
  }, [locationRetryKey]);

  const startOrientation = useCallback(() => {
    orientationCleanup.current();
    setOrientationStatus("waiting");
    orientationCleanup.current = listenToOrientation((reading) => {
      setOrientation(reading);
      setOrientationStatus(reading.absolute ? "ready" : "approximate");
    });
  }, []);

  useEffect(() => {
    const initialStart = window.setTimeout(() => {
      if (needsOrientationPermission()) setOrientationStatus("needs-permission");
      else startOrientation();
    }, 0);

    const timeout = window.setTimeout(() => {
      setOrientationStatus((status) => status === "waiting" ? "unavailable" : status);
    }, 4_000);
    return () => {
      window.clearTimeout(initialStart);
      window.clearTimeout(timeout);
      orientationCleanup.current();
    };
  }, [startOrientation]);

  const enableOrientation = useCallback(async () => {
    if (orientationStatus === "approximate" || orientationStatus === "ready") {
      setCalibrationOpen(true);
      return;
    }
    try {
      if (await requestOrientationPermission()) startOrientation();
      else setOrientationStatus("denied");
    } catch {
      setOrientationStatus("denied");
    }
  }, [orientationStatus, startOrientation]);

  const observer: ObserverPosition | undefined = location;
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const heading = orientation?.heading;
  const pitch = orientation?.pitch ?? 0;

  useEffect(() => {
    if (locationStatus !== "ready" || latitude === undefined || longitude === undefined) return;

    let active = true;

    const refresh = async () => {
      try {
        const nearby = await getNearbyAircraft(latitude, longitude);
        if (!active) return;
        setAircraft(nearby);
        setAircraftDataStatus("ready");
      } catch {
        if (!active) return;
        setAircraft([]);
        setAircraftDataStatus("offline");
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, 12_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [dataRetryKey, latitude, longitude, locationStatus]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(undefined), 4_500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const closeOverlay = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAircraftListOpen(false);
      setSettingsOpen(false);
      setCalibrationOpen(false);
    };
    window.addEventListener("keydown", closeOverlay);
    return () => window.removeEventListener("keydown", closeOverlay);
  }, []);

  const ranked = useMemo(
    () => observer ? rankAircraftCandidates(aircraft, observer, heading, pitch) : [],
    [aircraft, heading, observer, pitch],
  );

  const selected = manualSelection
    ? ranked.find((candidate) => candidate.icao24 === selectedIcao)
    : ranked.find((candidate) => isPointingAtAircraft(candidate));
  const matchLabel = getMatchLabel(selected, ranked.find((candidate) => candidate.icao24 !== selected?.icao24));
  const positioned = useMemo(
    () => heading === undefined
      ? []
      : ranked.map((candidate) => ({
          aircraft: candidate,
          position: calculateAircraftScreenPosition(
            candidate.bearing,
            candidate.elevation,
            heading,
            pitch,
            viewport.width,
            viewport.height,
          ),
        })),
    [heading, pitch, ranked, viewport.height, viewport.width],
  );
  const selectedPosition = positioned.find((item) => item.aircraft.icao24 === selected?.icao24)?.position;

  const selectAircraft = (icao24: string) => {
    setSelectedIcao(icao24);
    setManualSelection(true);
    setAircraftListOpen(false);
  };

  const recenter = () => {
    setManualSelection(false);
    setNotice("Tracking recentered on the best geometry.");
  };

  const gpsLabel = locationStatus === "ready" && location
    ? `GPS ±${Math.round(location.accuracy)}m`
    : locationStatus === "denied"
      ? "GPS DENIED"
      : "GPS SEARCHING";
  const liveStatus = aircraftDataStatus === "ready"
    ? "live"
    : aircraftDataStatus === "offline"
      ? "offline"
      : "connecting";
  const needsLocation = locationStatus !== "ready";
  const emptyCardCopy = needsLocation
    ? { eyebrow: "LIVE LOCATION", title: "Waiting for your location" }
    : aircraftDataStatus === "loading"
      ? { eyebrow: "LIVE DATA", title: "Loading nearby aircraft" }
      : aircraftDataStatus === "offline"
        ? { eyebrow: "LIVE DATA", title: "Aircraft data unavailable" }
        : heading === undefined
          ? { eyebrow: "MOTION REQUIRED", title: "Enable motion to identify" }
          : ranked.length > 0
            ? { eyebrow: "POINT TO IDENTIFY", title: "Aim at an aircraft in the sky" }
            : { eyebrow: "SCANNING SKY", title: "No live aircraft nearby" };

  return (
    <main className="app-shell">
      <CameraView />
      <div className="camera-frame" aria-hidden="true" />
      <StatusBar
        liveStatus={liveStatus}
        gpsLabel={gpsLabel}
        heading={heading}
        preciseOrientation={orientationStatus === "ready"}
        onEnableMotion={() => void enableOrientation()}
      />

      <div className="ar-stage" role="region" aria-label="Aircraft augmented-reality view">
        {positioned.map(({ aircraft: candidate, position }) => (
          <ARAircraftMarker
            key={candidate.icao24}
            aircraft={candidate}
            position={position}
            selected={candidate.icao24 === selected?.icao24}
            showFlightPath={showFlightPath}
            onSelect={() => selectAircraft(candidate.icao24)}
          />
        ))}
        {selected && selectedPosition?.insideView ? (
          <svg className="connection-layer" viewBox={`0 0 ${viewport.width} ${viewport.height}`} preserveAspectRatio="none" aria-hidden="true">
            <line x1={selectedPosition.x} y1={selectedPosition.y + 34} x2={viewport.width / 2} y2={viewport.height - 214} />
          </svg>
        ) : null}
        {needsLocation ? (
          <section className="live-state glass-strong" role={locationStatus === "denied" ? "alert" : "status"} aria-live="polite">
            <span className="live-state-icon"><LocationIcon width={24} height={24} /></span>
            <p className="eyebrow">LIVE LOCATION</p>
            <strong>{locationStatus === "locating" ? "Finding your location" : "Location is required"}</strong>
            <small>
              {locationStatus === "locating"
                ? "SkyID needs your position to find aircraft nearby."
                : "Allow location access in your browser settings, then try again."}
            </small>
            <button type="button" onClick={() => {
              setLocationStatus("locating");
              setLocationRetryKey((key) => key + 1);
            }}>
              {locationStatus === "locating" ? "Retry location" : "Try location again"}
            </button>
          </section>
        ) : aircraftDataStatus === "offline" ? (
          <section className="live-state glass-strong" role="alert" aria-live="assertive">
            <span className="live-state-icon live-state-error"><LocationIcon width={24} height={24} /></span>
            <p className="eyebrow">LIVE DATA</p>
            <strong>Aircraft service unavailable</strong>
            <small>Your location is ready, but live aircraft positions could not be loaded.</small>
            <button type="button" onClick={() => {
              setAircraftDataStatus("loading");
              setDataRetryKey((key) => key + 1);
            }}>Try live data again</button>
          </section>
        ) : heading === undefined ? (
          <button className="orientation-empty glass" type="button" onClick={() => void enableOrientation()}>
            <span className="orientation-reticle" />
            <strong>Motion tracking is off</strong>
            <small>Enable compass access to position aircraft in the camera view.</small>
          </button>
        ) : null}
      </div>

      <div className="lower-hud">
        <AircraftInfoCard
          aircraft={selected}
          matchLabel={heading === undefined ? "NEARBY" : matchLabel}
          distanceUnit={distanceUnit}
          altitudeUnit={altitudeUnit}
          showAircraftType={showAircraftType}
          candidateCount={ranked.length}
          onOpenList={() => setAircraftListOpen(true)}
          emptyEyebrow={emptyCardCopy.eyebrow}
          emptyTitle={emptyCardCopy.title}
        />
        <BottomControls
          aircraftCount={ranked.length}
          onRecenter={recenter}
          onAircraft={() => setAircraftListOpen(true)}
          onSettings={() => setSettingsOpen(true)}
        />
      </div>

      {notice ? <div className="notice glass" role="status">{notice}</div> : null}
      <AircraftList
        open={aircraftListOpen}
        aircraft={ranked}
        selectedIcao={selected?.icao24}
        distanceUnit={distanceUnit}
        onSelect={selectAircraft}
        onClose={() => setAircraftListOpen(false)}
      />
      <SettingsSheet
        open={settingsOpen}
        distanceUnit={distanceUnit}
        altitudeUnit={altitudeUnit}
        showAircraftType={showAircraftType}
        showFlightPath={showFlightPath}
        onDistanceUnitChange={setDistanceUnit}
        onAltitudeUnitChange={setAltitudeUnit}
        onShowAircraftTypeChange={setShowAircraftType}
        onShowFlightPathChange={setShowFlightPath}
        onCalibrate={() => {
          setSettingsOpen(false);
          setCalibrationOpen(true);
        }}
        onClose={() => setSettingsOpen(false)}
      />
      <CalibrationOverlay
        key={calibrationOpen ? "calibration-open" : "calibration-closed"}
        open={calibrationOpen}
        heading={heading}
        onClose={() => setCalibrationOpen(false)}
      />
    </main>
  );
}
