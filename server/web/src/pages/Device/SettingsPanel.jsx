// features/settings/SettingsPanel.jsx

import { C, inputSx, btnSx } from "../../shared/theme.js";
import { useEffect, useState, useRef } from "react";
import {
  SLabel as SLabelLocal,
  Chip as ChipLocal,
  CloseBtn as CloseBtnLocal,
} from "../../shared/ui.jsx";

const QUALITY_STORAGE_KEY = "gcs.ussoi.device.quality.v1";

const DEFAULT_QUALITY_STATE = {
  normal: {
    camIdx: 0,
    w: 1280,
    h: 720,
    fps: 30,
    fpsList: [30],
    streamKbps: 60,
    recordKbps: 2000,
  },
  high_speed: {
    camIdx: 0,
    w: 1280,
    h: 720,
    fps: 30,
    fpsList: [30],
    streamKbps: 60,
    recordKbps: 2000,
  },
};

let QUALITY_STATE_CACHE = loadQualityState();

function cloneDefaultQualityState() {
  return JSON.parse(JSON.stringify(DEFAULT_QUALITY_STATE));
}

function loadQualityState() {
  if (typeof window === "undefined") return cloneDefaultQualityState();
  try {
    const raw = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    if (!raw) return cloneDefaultQualityState();
    const parsed = JSON.parse(raw);
    return {
      normal: { ...DEFAULT_QUALITY_STATE.normal, ...(parsed.normal ?? {}) },
      high_speed: { ...DEFAULT_QUALITY_STATE.high_speed, ...(parsed.high_speed ?? {}) },
    };
  } catch {
    return cloneDefaultQualityState();
  }
}

function persistQualityState(nextState) {
  QUALITY_STATE_CACHE = nextState;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // Ignore storage failures and keep the in-memory cache.
  }
}

function cloneQualityState() {
  return {
    normal: { ...QUALITY_STATE_CACHE.normal },
    high_speed: { ...QUALITY_STATE_CACHE.high_speed },
  };
}

function clampIndex(value, max) {
  if (max < 0) return 0;
  return Math.min(Math.max(Number(value) || 0, 0), max);
}

function normalizeFpsList(res) {
  return [...new Set(res.fpsRanges?.map((r) => r.max) ?? [30])].sort((a, b) => a - b);
}

function isHighSpeedQualityMode(streamMode, highFpsMode) {
  if (highFpsMode === true) return true;
  const mode = String(streamMode ?? "").toLowerCase();
  return mode === "hfh264" || mode === "hf_h264" || mode === "hspeed" || mode === "high_speed" || mode === "highspeed";
}

// ─── PresetScroll ─────────────────────────────────────────────────────────────
// Horizontal preset strip with:
//   • mouse-wheel scrolling (wheel event, no edge-hover)
//   • ‹ › arrow buttons for keyboard/touch navigation

function PresetScroll({ resolutions, w, h, onPick }) {
  const scrollRef = useRef(null);
  const STEP = 120;

  const scroll = (delta) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += delta;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    scroll(e.deltaY !== 0 ? e.deltaY : e.deltaX);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const arrowSx = {
    ...btnSx,
    flexShrink: 0,
    width: 24,
    height: 26,
    borderRadius: 7,
    border: `1px solid ${C.line}`,
    background: "transparent",
    color: C.t2,
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button style={arrowSx} onClick={() => scroll(-STEP)} aria-label="Scroll presets left">‹</button>

      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: 4,
          flex: 1,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          paddingBottom: 1,
        }}
      >
        {resolutions.map((res) => {
          const active = res.width === w && res.height === h;
          return (
            <button
              key={`${res.width}x${res.height}`}
              onClick={() => onPick(res)}
              style={{
                ...btnSx,
                flexShrink: 0,
                padding: "4px 9px",
                borderRadius: 8,
                fontSize: 11,
                color: active ? C.t0 : C.t2,
                background: active ? C.raised : "transparent",
                border: `1px solid ${active ? C.lineMd : C.line}`,
                whiteSpace: "nowrap",
              }}
            >
              {res.width}×{res.height}
            </button>
          );
        })}
      </div>

      <button style={arrowSx} onClick={() => scroll(STEP)} aria-label="Scroll presets right">›</button>
    </div>
  );
}

// ─── QPanel ──────────────────────────────────────────────────────────────────

function QPanel({
  cameraRes,
  isHighFpsMode,
  onStreamRes,
  onRecordRes,
  onStreamBitrate,
  onRecordBitrate,
  onClose,
}) {
  const cameras =
    cameraRes?.cameras ??
    (cameraRes?.resolutions ? [{ cameraId: "0", normal: cameraRes.resolutions }] : []);
  const isLoadingPresets = cameraRes == null;
  const qualityBucket = isHighFpsMode ? "high_speed" : "normal";

  const [camIdx, setCamIdx] = useState(0);
  const [w, setW] = useState(DEFAULT_QUALITY_STATE.normal.w);
  const [h, setH] = useState(DEFAULT_QUALITY_STATE.normal.h);
  const [fpsList, setFpsList] = useState([30]);
  const [fps, setFps] = useState(DEFAULT_QUALITY_STATE.normal.fps);
  const [sKBps, setSKBps] = useState(DEFAULT_QUALITY_STATE.normal.streamKbps);
  const [rKBps, setRKBps] = useState(DEFAULT_QUALITY_STATE.normal.recordKbps);

  const currentCamera = cameras[camIdx] ?? null;
  const allResolutions = isHighFpsMode
    ? (currentCamera?.high_speed ?? [])
    : (currentCamera?.normal ?? []);
  const resolutions = allResolutions;

  const commitBucket = (updater) => {
    const nextState = cloneQualityState();
    nextState[qualityBucket] = updater(nextState[qualityBucket]);
    persistQualityState(nextState);
  };

  const applyPreset = (res, nextFps, streamKbps = sKBps, recordKbps = rKBps, nextCamIdx = camIdx) => {
    const fpsOptions = normalizeFpsList(res);
    const resolvedFps = fpsOptions.includes(nextFps) ? nextFps : fpsOptions[fpsOptions.length - 1];

    setCamIdx(nextCamIdx);
    setW(res.width);
    setH(res.height);
    setFpsList(fpsOptions);
    setFps(resolvedFps);
    setSKBps(streamKbps);
    setRKBps(recordKbps);

    commitBucket((bucketState) => ({
      ...bucketState,
      camIdx: nextCamIdx,
      w: res.width,
      h: res.height,
      fps: resolvedFps,
      fpsList: fpsOptions,
      streamKbps,
      recordKbps,
    }));
  };

  useEffect(() => {
    if (isLoadingPresets || cameras.length === 0) return;

    const saved = QUALITY_STATE_CACHE[qualityBucket] ?? DEFAULT_QUALITY_STATE[qualityBucket];
    const nextCamIdx = clampIndex(saved.camIdx, cameras.length - 1);

    const targetList = isHighFpsMode
      ? (cameras[nextCamIdx]?.high_speed ?? [])
      : (cameras[nextCamIdx]?.normal ?? []);
    if (targetList.length === 0) return;

    const target =
      targetList.find((res) => res.width === saved.w && res.height === saved.h) ?? targetList[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyPreset(target, saved.fps, saved.streamKbps, saved.recordKbps, nextCamIdx);
  }, [cameraRes, camIdx, isHighFpsMode, isLoadingPresets, qualityBucket]);

  const pickPreset = (res) => applyPreset(res, fps, sKBps, rKBps, camIdx);

  const pickCamera = (idx) => {
    const nextCamIdx = clampIndex(idx, cameras.length - 1);
    const first = (
      isHighFpsMode
        ? (cameras[nextCamIdx]?.high_speed ?? [])
        : (cameras[nextCamIdx]?.normal ?? [])
    )[0];
    if (first) applyPreset(first, fps, sKBps, rKBps, nextCamIdx);
  };

  return (
    <div
      className="panel-slide-up"
      style={{
        background: C.surface,
        border: `1px solid ${C.lineMd}`,
        boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        alignSelf: "flex-end",
        overflow: "hidden",
        width: 300,
        color: C.t0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 10px",
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: C.t1, letterSpacing: 0.4 }}>
          Quality
        </span>
        <CloseBtnLocal onClick={onClose} />
      </div>

      <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Camera tabs */}
        {cameras.length > 1 && (
          <div style={{ display: "flex", gap: 4 }}>
            {cameras.map((cam, idx) => (
              <ChipLocal key={cam.cameraId} active={camIdx === idx} onClick={() => pickCamera(idx)}>
                Cam {cam.cameraId}
              </ChipLocal>
            ))}
          </div>
        )}

        {/* Presets */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <SLabelLocal>Presets</SLabelLocal>
          {isLoadingPresets ? (
            <span style={{ color: C.t2, fontSize: 10, fontStyle: "italic" }}>Loading…</span>
          ) : resolutions.length === 0 ? (
            <span style={{ color: C.t2, fontSize: 10, fontStyle: "italic" }}>No presets available.</span>
          ) : (
            <PresetScroll resolutions={resolutions} w={w} h={h} onPick={pickPreset} />
          )}
        </div>

        {/* FPS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <SLabelLocal>FPS</SLabelLocal>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {fpsList.map((f) => (
              <ChipLocal
                key={f}
                active={fps === f}
                onClick={() => {
                  setFps(f);
                  commitBucket((s) => ({ ...s, fps: f }));
                }}
              >
                {f}
              </ChipLocal>
            ))}
          </div>
        </div>

        {/* Stream / Record apply */}
        <div style={{ display: "flex", gap: 5 }}>
          <SubtleBtn
            onClick={() => {
              onStreamRes(w, h, fps);
              commitBucket((s) => ({ ...s, w, h, fps }));
            }}
          >
            Apply stream
          </SubtleBtn>
          <SubtleBtn
            onClick={() => {
              onRecordRes(w, h, fps);
              commitBucket((s) => ({ ...s, w, h, fps }));
            }}
          >
            Apply record
          </SubtleBtn>
        </div>

        {/* Bitrate */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 7 }}>
          <SLabelLocal>Bitrate</SLabelLocal>

          <BitrateRow
            label="Stream"
            value={sKBps}
            min={5}
            step={20}
            onChange={(v) => {
              setSKBps(v);
              commitBucket((s) => ({ ...s, streamKbps: v }));
            }}
            onApply={() => {
              onStreamBitrate(sKBps * 8);
              commitBucket((s) => ({ ...s, streamKbps: sKBps }));
            }}
          />

          <BitrateRow
            label="Record"
            value={rKBps}
            min={100}
            step={500}
            onChange={(v) => {
              setRKBps(v);
              commitBucket((s) => ({ ...s, recordKbps: v }));
            }}
            onApply={() => {
              onRecordBitrate(rKBps * 8);
              commitBucket((s) => ({ ...s, recordKbps: rKBps }));
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── SettingsPanel ────────────────────────────────────────────────────────────

export function SettingsPanel({
  open,
  cameraRes,
  streamMode,
  highFpsMode,
  uiState,
  onChangeSetup,
  onStreamRes,
  onRecordRes,
  onStreamBitrate,
  onRecordBitrate,
  onStartRecord,
  onStopRecord,
  onStartStream,
  onStopStream,
}) {
  const [qOpen, setQOpen] = useState(false);

  if (!open) return null;

  const recordState = uiState?.actions?.record ?? "IDLE";
  const isRecording = recordState === "ACTIVE" || recordState === "PROCESSING";
  const useHighSpeedQuality = isHighSpeedQualityMode(streamMode, highFpsMode);

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 68px)",
        right: 16,
        zIndex: 100,
        display: "flex",
        flexDirection: "row-reverse",
        gap: 8,
        alignItems: "flex-end",
      }}
    >
      {/* Main panel */}
      <div
        className="panel-slide-up"
        style={{
          background: C.surface,
          border: `1px solid ${C.lineMd}`,
          boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
          width: 210,
          padding: 8,
          borderRadius: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          onClick={onChangeSetup}
          style={{
            ...btnSx,
            height: 32,
            width: "100%",
            borderRadius: 10,
            background: C.raised,
            border: `1px solid ${C.line}`,
            color: C.t0,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            padding: "0 10px",
            textAlign: "left",
          }}
        >
          Stream mode
        </button>

        {/* Quality */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <PanelLabel>Quality</PanelLabel>
            <button
              onClick={() => setQOpen((v) => !v)}
              style={{
                ...btnSx,
                border: `1px solid ${C.line}`,
                height: 22,
                padding: "0 9px",
                borderRadius: 8,
                background: qOpen ? C.raised : "transparent",
                color: C.t1,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Configure
            </button>
          </div>
        </div>

        {/* Stream */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 7, display: "flex", flexDirection: "column", gap: 6 }}>
          <PanelLabel>Stream</PanelLabel>
          <div style={{ display: "flex", gap: 5 }}>
            <button
              onClick={onStartStream}
              style={{
                ...btnSx,
                flex: 1,
                height: 30,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.raised,
                color: C.t0,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ON
            </button>
            <button
              onClick={onStopStream}
              style={{
                ...btnSx,
                flex: 1,
                height: 30,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.raised,
                color: C.t1,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              OFF
            </button>
          </div>
        </div>

        {/* Record */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 7, display: "flex", flexDirection: "column", gap: 6 }}>
          <PanelLabel>Record</PanelLabel>
          <div style={{ display: "flex", gap: 5 }}>
            <button
              onClick={onStartRecord}
              style={{
                ...btnSx,
                flex: 1,
                height: 30,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.raised,
                color: isRecording ? C.t2 : C.t0,
                fontSize: 12,
                cursor: isRecording ? "default" : "pointer",
                opacity: isRecording ? 0.6 : 1,
              }}
            >
              Start
            </button>
            <button
              onClick={onStopRecord}
              style={{
                ...btnSx,
                flex: 1,
                height: 30,
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                background: C.raised,
                color: isRecording ? C.t0 : C.t2,
                fontSize: 12,
                cursor: isRecording ? "pointer" : "default",
                opacity: isRecording ? 1 : 0.6,
              }}
            >
              Stop
            </button>
          </div>
        </div>
      </div>

      {/* Quality panel */}
      {qOpen && (
        <QPanel
          cameraRes={cameraRes}
          isHighFpsMode={useHighSpeedQuality}
          onStreamRes={onStreamRes}
          onRecordRes={onRecordRes}
          onStreamBitrate={onStreamBitrate}
          onRecordBitrate={onRecordBitrate}
          onClose={() => setQOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function PanelLabel({ children }) {
  return (
    <span
      style={{
        fontSize: 10,
        letterSpacing: 1.4,
        color: C.t2,
        fontWeight: 600,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function SubtleBtn({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...btnSx,
        flex: 1,
        height: 26,
        borderRadius: 8,
        border: `1px solid ${C.line}`,
        background: hov ? C.raised : "transparent",
        color: C.t1,
        fontSize: 11,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function BitrateRow({ label, value, min, step, onChange, onApply }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: C.t2, fontWeight: 500, width: 42, flexShrink: 0 }}>
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        style={{
          ...inputSx,
          flex: 1,
          height: 26,
          fontSize: 11,
        }}
      />
      <span style={{ fontSize: 10, color: C.t2, flexShrink: 0 }}>kbps</span>
      <button
        onClick={onApply}
        style={{
          ...btnSx,
          height: 26,
          padding: "0 8px",
          borderRadius: 8,
          border: `1px solid ${C.line}`,
          background: "transparent",
          color: C.t1,
          fontSize: 11,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Apply
      </button>
    </div>
  );
}
