// features/settings/SettingsPanel.jsx
// Control strip (stream / record / tunnel) + quality side panel.

import { useState } from "react";
import { C, inputSx, btnSx } from "../../shared/theme.js";
import { Btn, Divider, SLabel, StateBadge, Chip, CloseBtn } from "../../shared/ui.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// QPanel — resolution & bitrate (slides left of the settings strip)
// ─────────────────────────────────────────────────────────────────────────────
function QPanel({ cameraRes, onStreamRes, onRecordRes, onStreamBitrate, onRecordBitrate, onClose }) {
  const cameras    = cameraRes?.cameras
    ?? (cameraRes?.resolutions ? [{ cameraId: "0", normal: cameraRes.resolutions }] : []);

  const [camIdx,  setCamIdx]  = useState(0);
  const [w,       setW]       = useState(1280);
  const [h,       setH]       = useState(720);
  const [fpsList, setFpsList] = useState([30]);
  const [fps,     setFps]     = useState(30);
  const [sBps,    setSBps]    = useState(2000);
  const [rBps,    setRBps]    = useState(8000);

  const resolutions = cameras[camIdx]?.normal ?? [];

  const pickPreset = (res) => {
    setW(res.width); setH(res.height);
    const maxes = [...new Set(res.fpsRanges?.map(r => r.max) ?? [30])].sort((a, b) => a - b);
    setFpsList(maxes);
    setFps(maxes[maxes.length - 1]);
  };

  const pickCamera = (idx) => {
    setCamIdx(idx);
    const first = cameras[idx]?.normal?.[0];
    if (first) pickPreset(first);
  };

  return (
    <div className="panel-slide-up" style={{
      background: C.surface, border: `1px solid ${C.line}`,
      borderRadius: C.rL, display: "flex", alignSelf: "flex-end",
      boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
    }}>
      {/* Left: resolution presets */}
      <div style={{ width: 188, borderRight: `1px solid ${C.line}`, padding: "11px 10px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <SLabel>Presets</SLabel>
          <CloseBtn onClick={onClose}/>
        </div>

        {cameras.length > 1 && (
          <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
            {cameras.map((cam, idx) => (
              <Chip key={cam.cameraId} active={camIdx === idx} onClick={() => pickCamera(idx)}>
                Cam {cam.cameraId}
              </Chip>
            ))}
          </div>
        )}

        {resolutions.length === 0
          ? <p style={{ color: C.t3, fontSize: 10, fontStyle: "italic" }}>Waiting for device…</p>
          : (
            <div style={{ overflowY: "auto", maxHeight: 240, display: "flex", flexDirection: "column", gap: 2 }}>
              {resolutions.map(res => {
                const active = res.width === w && res.height === h;
                return (
                  <button key={`${res.width}x${res.height}`} onClick={() => pickPreset(res)} style={{
                    ...btnSx, padding: "4px 7px", textAlign: "left",
                    background: active ? "#0d1f3a" : "transparent",
                    border:     `1px solid ${active ? C.blue + "55" : C.line}`,
                    color:      active ? C.blue : C.t1,
                    fontSize:   10,
                  }}>
                    {res.width}×{res.height}
                  </button>
                );
              })}
            </div>
          )}

        {/* FPS row */}
        <div style={{ marginTop: 9 }}>
          <SLabel>FPS</SLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {fpsList.map(f => (
              <Chip key={f} active={fps === f} onClick={() => setFps(f)}>{f}</Chip>
            ))}
          </div>
        </div>

        {/* Apply buttons */}
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 10, color: C.t2, marginBottom: 5 }}>
            Apply <span style={{ color: C.t0 }}>{w}×{h} @{fps}fps</span>
          </p>
          <div style={{ display: "flex", gap: 4 }}>
            <AccentBtn color={C.green} onClick={() => onStreamRes(w, h, fps)}>Stream</AccentBtn>
            <AccentBtn color={C.amber} onClick={() => onRecordRes(w, h, fps)}>Record</AccentBtn>
          </div>
        </div>
      </div>

      {/* Right: bitrate */}
      <div style={{ width: 155, padding: "11px 10px" }}>
        <SLabel>Bitrate</SLabel>

        <p style={{ fontSize: 10, color: C.green, marginBottom: 3 }}>Stream (KBps)</p>
        <div style={{ display: "flex", gap: 4, marginBottom: 11 }}>
          <input type="number" value={sBps} min={100} step={100}
            onChange={e => setSBps(+e.target.value)} style={{ ...inputSx, flex: 1 }}/>
          <AccentBtn color={C.green} onClick={() => onStreamBitrate(sBps)}>↵</AccentBtn>
        </div>

        <p style={{ fontSize: 10, color: C.amber, marginBottom: 3 }}>Record (KBps)</p>
        <div style={{ display: "flex", gap: 4 }}>
          <input type="number" value={rBps} min={100} step={500}
            onChange={e => setRBps(+e.target.value)} style={{ ...inputSx, flex: 1 }}/>
          <AccentBtn color={C.amber} onClick={() => onRecordBitrate(rBps)}>↵</AccentBtn>
        </div>

        <p style={{ fontSize: 9, color: C.t3, marginTop: 10, lineHeight: 1.5 }}>
          Bitrate is independent of resolution.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SettingsPanel — right-side control strip
// ─────────────────────────────────────────────────────────────────────────────
export function SettingsPanel({
  open, cameraRes, tunnelMode, tunnelNames, uiState,
  onChangeSetup,
  onStreamRes, onRecordRes, onStreamBitrate, onRecordBitrate,
  onStartRecord, onStartStream, onStopStream,
  onStartTunnel, onStopTunnel,
}) {
  const [qOpen, setQOpen] = useState(false);
  if (!open) return null;

  const streamState  = uiState?.actions?.stream ?? "IDLE";
  const recordState  = uiState?.actions?.record ?? "IDLE";
  const isStreaming   = streamState === "ACTIVE" || streamState === "PROCESSING";
  const isRecording   = recordState === "ACTIVE" || recordState === "PROCESSING";
  const tunnelOff     = !tunnelMode || tunnelMode === "null" || tunnelMode === "none";

  return (
    <div style={{
      position: "absolute", bottom: 50, right: 0,
      display: "flex", flexDirection: "row-reverse",
      alignItems: "flex-end", gap: 5, zIndex: 30,
    }}>
      {/* Control strip */}
      <div className="panel-slide-up" style={{
        background: C.surface, border: `1px solid ${C.line}`,
        borderRadius: C.rL, padding: "12px 11px", width: 210,
        fontSize: 11, boxShadow: "0 8px 28px rgba(0,0,0,0.55)",
      }}>

        {/* Stream mode */}
        <Btn onClick={onChangeSetup} style={{ width: "100%", flex: "none" }}>⇄ Stream Mode</Btn>

        <Divider/>

        {/* Quality toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <SLabel>Quality</SLabel>
          <button onClick={() => setQOpen(v => !v)} style={{
            ...btnSx, padding: "2px 7px", fontSize: 10,
            background: qOpen ? "#0d1f3a" : "transparent",
            border: `1px solid ${qOpen ? C.blue + "55" : C.line}`,
            color: qOpen ? C.blue : C.t2,
          }}>{qOpen ? "← Hide" : "Configure →"}</button>
        </div>

        <Divider/>

        {/* Stream */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <SLabel>Stream</SLabel>
          <StateBadge state={streamState}/>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <Btn onClick={onStartStream} accent={C.green}>
            {isStreaming ? "↺ Restart" : "▶ Start"}
          </Btn>
          <Btn onClick={onStopStream} accent={C.red}>■ Stop</Btn>
        </div>

        <Divider/>

        {/* Recording */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <SLabel>Recording</SLabel>
          <StateBadge state={recordState}/>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          <Btn onClick={onStartRecord} disabled={isRecording} accent={isRecording ? C.red : undefined}>
            {isRecording ? "● REC" : "▶ Start"}
          </Btn>
        </div>

        <Divider/>

        {/* Tunnel */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <SLabel>Tunnel</SLabel>
          {tunnelMode === "bt"  && <Tag color={C.blue}>BT</Tag>}
          {tunnelMode === "usb" && <Tag color={C.green}>USB</Tag>}
          {tunnelOff            && <Tag color={C.red}>none</Tag>}
        </div>

        {tunnelNames?.length > 0 && (
          <div style={{ marginBottom: 7 }}>
            {tunnelNames.map(name => {
              const s = uiState?.tunnels?.[name] ?? "IDLE";
              const color = s === "ACTIVE" ? C.green : s === "ERROR" ? C.red : C.t3;
              return (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2, fontSize: 10 }}>
                  <span style={{ color: C.t2 }}>{name}</span>
                  <span style={{ color, fontWeight: 600 }}>{s}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 4 }}>
          <Btn disabled={tunnelOff} onClick={onStartTunnel} accent={C.green}>▶ Start</Btn>
          <Btn disabled={tunnelOff} onClick={onStopTunnel}  accent={C.red}>■ Stop</Btn>
        </div>
      </div>

      {/* QPanel — slides left */}
      {qOpen && (
        <QPanel
          cameraRes={cameraRes}
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

// ── Local helpers ─────────────────────────────────────────────────────────────
function Tag({ children, color }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: 0.8 }}>{children}</span>
  );
}

function AccentBtn({ children, onClick, color }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} style={{
      ...btnSx, padding: "4px 9px", flexShrink: 0,
      border: `1px solid ${color}44`,
      color: color,
      background: hov ? C.raised : "transparent",
      fontSize: 10,
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >{children}</button>
  );
}
