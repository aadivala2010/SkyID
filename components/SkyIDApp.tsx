"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateAircraftScreenPosition } from "@/lib/ar/projection";
import { LiveAircraftProvider } from "@/lib/aircraft/LiveAircraftProvider";
import { MockAircraftProvider } from "@/lib/aircraft/MockAircraftProvider";
import { getMatchLabel, rankAircraftCandidates } from "@/lib/aircraft/matching";
import { watchLocation, type LocationReading } from "@/lib/sensors/location";
import {
  listenToOrientation,
  needsOrientationPermission,
  requestOrientationPermission,
  type OrientationReading,
} from "@/lib/sensors/orientation";
import type { Aircraft, AltitudeUnit, DataMode, DistanceUnit, ObserverPosition } from "@/types/aircraft";
import { ARAircraftMarker } from "./ARAircraftMarker";
import { AircraftInfoCard } from "./AircraftInfoCard";
import { AircraftList } from "./AircraftList";
import { BottomControls } from "./BottomControls";
import { CalibrationOverlay } from "./CalibrationOverlay";
import { CameraView } from "./CameraView";
import { DesktopSimulator } from "./DesktopSimulator";
import { SettingsSheet } from "./SettingsSheet";
import { StatusBar } from "./StatusBar";

const DEFAULT_LOCATION: ObserverPosition = {
  latitude: 40.7128,
  longitude: -74.006,
  altitude: 10,
};

type LocationStatus = "locating" | "ready" | "denied" | "unavailable";
type OrientationStatus = "waiting" | "needs-permission" | "ready" | "approximate" | "denied" | "unavailable";

export function SkyIDApp() {
  const [mode, setMode] = useState<DataMode>("demo");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("mi");
  const [altitudeUnit, setAltitudeUnit] = useState<AltitudeUnit>("ft");
  const [showAircraftType, setShowAircraftType] = useState(true);
  const [showFlightPath, setShowFlightPath] = useState(true);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("locating");
  const [location, setLocation] = useState<LocationReading>();
  const [orientationStatus, setOrientationStatus] = useState<OrientationStatus>("waiting");
  const [orientation, setOrientation] = useState<OrientationReading>();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [selectedIcao, setSelectedIcao] = useState<string>();
  const [manualSelection, setManualSelection] = useState(false);
  const [aircraftListOpen, setAircraftListOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [desktopSimulation, setDesktopSimulation] = useState(false);
  const [manualHeading, setManualHeading] = useState(182);
  const [manualPitch, setManualPitch] = useState(12);
  const [manualLocation, setManualLocation] = useState<ObserverPosition>(DEFAULT_LOCATION);
  const [trafficOffset, setTrafficOffset] = useState(0);
  const [viewport, setViewport] = useState({ width: 390, height: 844 });
  const orientationCleanup = useRef<() => void>(() => undefined);

  useEffect(() => {
    const updateViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    const query = window.matchMedia("(pointer: fine) and (min-width: 800px)");
    const updateDesktop = () => setDesktopSimulation(query.matches);
    updateViewport();
    updateDesktop();
    window.addEventListener("resize", updateViewport);
    query.addEventListener("change", updateDesktop);
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("resize", updateViewport);
      query.removeEventListener("change", updateDesktop);
    };
  }, []);

  useEffect(() =>
    watchLocation(
      (reading) => {
        setLocation(reading);
        setLocationStatus("ready");
      },
      (error) => setLocationStatus("code" in error && error.code === 1 ? "denied" : "unavailable"),
    ), []);

  const startOrientation = useCallback(() => {
    orientationCleanup.current();
    setOrientationStatus("waiting");
    orientationCleanup.current = listenToOrientation((reading) => {
      setOrientation(reading);
      setOrientationStatus(reading.absolute ? "ready" : "approximate");
    });
  }, []);

  useEffect(() => {
    if (desktopSimulation) return;
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
  }, [desktopSimulation, startOrientation]);

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

  const observer = desktopSimulation ? manualLocation : location ?? DEFAULT_LOCATION;
  const heading = desktopSimulation ? manualHeading : orientation?.heading;
  const pitch = desktopSimulation ? manualPitch : orientation?.pitch ?? 0;

  useEffect(() => {
    let active = true;
    const provider = mode === "demo"
      ? new MockAircraftProvider(trafficOffset)
      : new LiveAircraftProvider();

    const refresh = async () => {
      if (mode === "live" && locationStatus !== "ready") return;
      try {
        const nearby = await provider.getNearbyAircraft(observer.latitude, observer.longitude);
        if (active) setAircraft(nearby);
      } catch {
        if (!active) return;
        setMode("demo");
        setNotice("Live data is unavailable. Demo traffic is active.");
      }
    };

    void refresh();
    const interval = window.setInterval(refresh, mode === "demo" ? 1_200 : 12_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [locationStatus, mode, observer.latitude, observer.longitude, trafficOffset]);

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
    () => rankAircraftCandidates(aircraft, observer, heading, pitch),
    [aircraft, heading, observer, pitch],
  );

  const selected = manualSelection
    ? ranked.find((candidate) => candidate.icao24 === selectedIcao) ?? ranked[0]
    : ranked[0];
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
    if (desktopSimulation && ranked[0]) {
      setManualHeading(ranked[0].bearing);
      setManualPitch(ranked[0].elevation);
    }
    setNotice("Tracking recentered on the best geometry.");
  };

  const changeMode = (nextMode: DataMode) => {
    if (nextMode === "live" && locationStatus !== "ready") {
      setMode("demo");
      setNotice("Live mode needs precise location. Demo remains active.");
      return;
    }
    setMode(nextMode);
    setNotice(nextMode === "live" ? "Connecting to live OpenSky traffic…" : "Demo traffic is active.");
  };

  const gpsLabel = locationStatus === "ready" && location
    ? `GPS ±${Math.round(location.accuracy)}m`
    : mode === "demo"
      ? "SIM LOCATION"
      : locationStatus === "denied"
        ? "GPS DENIED"
        : "GPS SEARCHING";

  return (
    <main className="app-shell">
      <CameraView />
      <div className="camera-frame" aria-hidden="true" />
      <StatusBar
        mode={mode}
        gpsLabel={gpsLabel}
        heading={heading}
        preciseOrientation={desktopSimulation || orientationStatus === "ready"}
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
        {heading === undefined ? (
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
        />
        <BottomControls
          aircraftCount={ranked.length}
          onRecenter={recenter}
          onAircraft={() => setAircraftListOpen(true)}
          onSettings={() => setSettingsOpen(true)}
        />
      </div>

      {notice ? <div className="notice glass" role="status">{notice}</div> : null}
      <DesktopSimulator
        heading={manualHeading}
        pitch={manualPitch}
        location={manualLocation}
        trafficOffset={trafficOffset}
        onHeadingChange={setManualHeading}
        onPitchChange={setManualPitch}
        onLocationChange={setManualLocation}
        onTrafficOffsetChange={setTrafficOffset}
      />
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
        mode={mode}
        distanceUnit={distanceUnit}
        altitudeUnit={altitudeUnit}
        showAircraftType={showAircraftType}
        showFlightPath={showFlightPath}
        onModeChange={changeMode}
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
