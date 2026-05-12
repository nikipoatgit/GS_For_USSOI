// features/settings/SettingsPanel.jsx

import { useState } from "react";
import { C, inputSx, btnSx } from "../../shared/theme.js";
import {
  Btn as BtnLocal,
  Divider as DividerShared,
  SLabel as SLabelLocal,
  StateBadge as StateBadgeLocal,
  Chip as ChipLocal,
  CloseBtn as CloseBtnLocal
} from "../../shared/ui.jsx";

function QPanel({
                  cameraRes,
                  onStreamRes,
                  onRecordRes,
                  onStreamBitrate,
                  onRecordBitrate,
                  onClose
                }) {
  const cameras =
      cameraRes?.cameras ??
      (cameraRes?.resolutions
          ? [{ cameraId: "0", normal: cameraRes.resolutions }]
          : []);

  const [camIdx, setCamIdx] = useState(0);
  const [w, setW] = useState(1280);
  const [h, setH] = useState(720);
  const [fpsList, setFpsList] = useState([30]);
  const [fps, setFps] = useState(30);
  const [sBps, setSBps] = useState(2000);
  const [rBps, setRBps] = useState(8000);

  const resolutions = cameras[camIdx]?.normal ?? [];

  const pickPreset = (res) => {
    setW(res.width);
    setH(res.height);

    const maxes = [
      ...new Set(res.fpsRanges?.map((r) => r.max) ?? [30]),
    ].sort((a, b) => a - b);

    setFpsList(maxes);
    setFps(maxes[maxes.length - 1]);
  };

  const pickCamera = (idx) => {
    setCamIdx(idx);
    const first = cameras[idx]?.normal?.[0];
    if (first) pickPreset(first);
  };

  return (
      <div
          className="panel-slide-up"
          style={{
            background: C.surface,
            border: `1px solid ${C.lineMd}`,
            boxShadow: "0 18px 48px rgba(0,0,0,0.42)",
            borderRadius: 16,
            display: "flex",
            alignSelf: "flex-start",
            overflow: "hidden",
          }}
      >
        {/* LEFT */}
        <div
            style={{
              width: 150,
              borderRight: `1px solid ${C.line}`,
              padding: 10,
              display: "flex",
              flexDirection: "column",
            }}
        >
          <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
          >
            <SLabelLocal>Presets</SLabelLocal>
            <CloseBtnLocal onClick={onClose} />
          </div>

          {cameras.length > 1 && (
              <div
                  style={{
                    display: "flex",
                    gap: 5,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
              >
                {cameras.map((cam, idx) => (
                    <ChipLocal
                        key={cam.cameraId}
                        active={camIdx === idx}
                        onClick={() => pickCamera(idx)}
                    >
                      Cam {cam.cameraId}
                    </ChipLocal>
                ))}
              </div>
          )}

          {resolutions.length === 0 ? (
              <p
                  style={{
                    color: C.t2,
                    fontSize: 10,
                    fontStyle: "italic",
                  }}
              >
                Waiting...
              </p>
          ) : (
              <div
                  style={{
                    overflowY: "auto",
                    maxHeight: 180,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
              >
                {resolutions.map((res) => {
                  const active = res.width === w && res.height === h;

                  return (
                      <button
                          key={`${res.width}x${res.height}`}
                          onClick={() => pickPreset(res)}
                          style={{
                            ...btnSx,
                            padding: "5px 7px",
                            textAlign: "left",
                            borderRadius: 12,
                            background: active
                                ? "#0d1f3a"
                                : "transparent",
                            border: `1px solid ${
                                active
                                    ? C.blue + "60"
                                    : C.line
                            }`,
                            color: active ? C.blue : C.t1,
                            fontSize: 11,
                          }}
                      >
                        {res.width}×{res.height}
                      </button>
                  );
                })}
              </div>
          )}

          <div style={{ marginTop: 8 }}>
            <SLabelLocal>FPS</SLabelLocal>

            <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 5,
                }}
            >
              {fpsList.map((f) => (
                  <ChipLocal
                      key={f}
                      active={fps === f}
                      onClick={() => setFps(f)}
                  >
                    {f}
                  </ChipLocal>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <AccentBtn
                  color={"#22c55e"}
                  onClick={() => onStreamRes(w, h, fps)}
              >
                Stream
              </AccentBtn>

              <AccentBtn
                  color={"#d4870f"}
                  onClick={() => onRecordRes(w, h, fps)}
              >
                Record
              </AccentBtn>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div
            style={{
              width: 145,
              padding: 10,
            }}
        >
          <SLabelLocal>Bitrate</SLabelLocal>

          <p
              style={{
                fontSize: 11,
                color: "#22c55e",
                marginBottom: 5,
              }}
          >
            Stream
          </p>

          <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 10,
              }}
          >
            <input
                type="number"
                value={sBps}
                min={100}
                step={100}
                onChange={(e) => setSBps(+e.target.value)}
                style={{
                  ...inputSx,
                  flex: 1,
                  height: 30,
                  fontSize: 11,
                }}
            />

            <AccentBtn
                color={"#22c55e"}
                onClick={() => onStreamBitrate(sBps)}
            >
              OK
            </AccentBtn>
          </div>

          <p
              style={{
                fontSize: 11,
                color: "#d4870f",
                marginBottom: 5,
              }}
          >
            Record
          </p>

          <div
              style={{
                display: "flex",
                gap: 6,
              }}
          >
            <input
                type="number"
                value={rBps}
                min={100}
                step={500}
                onChange={(e) => setRBps(+e.target.value)}
                style={{
                  ...inputSx,
                  flex: 1,
                  height: 30,
                  fontSize: 11,
                }}
            />

            <AccentBtn
                color={"#d4870f"}
                onClick={() => onRecordBitrate(rBps)}
            >
              OK
            </AccentBtn>
          </div>
        </div>
      </div>
  );
}

export function SettingsPanel({
                                open,
                                cameraRes,
                                uiState,
                                onChangeSetup,
                                onStreamRes,
                                onRecordRes,
                                onStreamBitrate,
                                onRecordBitrate,
                                onStartRecord,
                                onStartStream,
                                onStopStream,
                              }) {
  const [qOpen, setQOpen] = useState(false);

  if (!open) return null;

  const recordState = uiState?.actions?.record ?? "IDLE";

  const isRecording =
      recordState === "ACTIVE" ||
      recordState === "PROCESSING";

  return (
      <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 30,
            display: "flex",
            flexDirection: "row-reverse",
            gap: 6,
            alignItems: "flex-start",
          }}
      >
        {/* MAIN PANEL */}
        <div
            className="panel-slide-up"
            style={{
              background: C.surface,
              border: `1px solid ${C.lineMd}`,
              boxShadow: "0 18px 48px rgba(0,0,0,0.42)",
              width: 190,
              padding: 10,
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
        >
          {/* STREAM MODE */}
          <button
              onClick={onChangeSetup}
              style={{
                height: 34,
                width: "100%",
                border: "none",
                outline: "none",
                borderRadius: 12,
                background: C.raised,
                color: C.t0,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                padding: "0 10px",
                textAlign: "left",
              }}
          >
            Stream Mode
          </button>

          {/* QUALITY */}
          <div
              style={{
                borderTop: `1px solid ${C.line}`,
                paddingTop: 8,
              }}
          >
            <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
            >
            <span
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: C.t2,
                  fontWeight: 600,
                }}
            >
              QUALITY
            </span>

              <button
                  onClick={() => setQOpen((v) => !v)}
                  style={{
                    border: "none",
                    height: 26,
                    padding: "0 10px",
                    borderRadius: 12,
                    background: C.raised,
                    color: C.t1,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
              >
                Configure
              </button>
            </div>
          </div>

          {/* STREAM */}
          <div
              style={{
                borderTop: `1px solid ${C.line}`,
                paddingTop: 8,
              }}
          >
            <div style={{ marginBottom: 8 }}>
            <span
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: C.t2,
                  fontWeight: 600,
                }}
            >
              STREAM
            </span>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                  onClick={onStartStream}
                  style={{
                    flex: 1,
                    height: 34,
                    border: "none",
                    borderRadius: 12,
                    background: "rgba(18,90,58,0.75)",
                    color: "#63ffa7",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
              >
                ON
              </button>

              <button
                  onClick={onStopStream}
                  style={{
                    flex: 1,
                    height: 34,
                    border: "none",
                    borderRadius: 12,
                    background: "rgba(92,32,45,0.76)",
                    color: "#ff7b90",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
              >
                OFF
              </button>
            </div>
          </div>

          {/* RECORD */}
          <div
              style={{
                borderTop: `1px solid ${C.line}`,
                paddingTop: 8,
              }}
          >
            <div style={{ marginBottom: 8 }}>
            <span
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: C.t2,
                  fontWeight: 600,
                }}
            >
              RECORD
            </span>
            </div>

            <button
                onClick={onStartRecord}
                disabled={isRecording}
                style={{
                  width: "100%",
                  height: 34,
                  border: "none",
                  borderRadius: 12,
                  background: C.raised,
                  color: C.t0,
                  fontSize: 12,
                  cursor: "pointer",
                  opacity: isRecording ? 0.7 : 1,
                }}
            >
              {isRecording ? "Recording" : "Start"}
            </button>
          </div>
        </div>

        {/* QUALITY PANEL */}
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

function AccentBtn({ children, onClick, color }) {
  const [hov, setHov] = useState(false);

  return (
      <button
          onClick={onClick}
          style={{
            ...btnSx,
            padding: "5px 8px",
            flexShrink: 0,
            borderRadius: 12,
            border: `1px solid ${color}44`,
            color,
            background: hov
                ? C.raised
                : "transparent",
            fontSize: 11,
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
      >
        {children}
      </button>
  );
}
