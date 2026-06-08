import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { WorkflowEvent } from "./workflow-types";

type Props = {
  kind: "input" | "orInput" | "output";
  event: WorkflowEvent;
  draftLabel: string;
  draftCondition: string;
  draftActive: boolean;
  availableRecordingCameras?: string[];
  onDraftLabelChange: (value: string) => void;
  onDraftConditionChange: (value: string) => void;
  onDraftActiveChange: (value: boolean) => void;
  onClose: () => void;
  onSave: () => void;
};

const CAMERA_PLACEHOLDER = "Select camera to add to action";
const PRESET_PLACEHOLDER = "Select preset";
const MONITOR_PLACEHOLDER = "Select monitor";

const cameraOptions = [
  "Gate 1 PTZ camera",
  "Gate 2 PTZ camera",
  "Warehouse entrance camera",
  "Perimeter east camera",
  "Loading dock camera",
];

const presetOptions = [
  "Preset 1 - Main gate",
  "Preset 2 - Fence line",
  "Preset 3 - Loading dock",
  "Preset 4 - Parking lot",
  "Preset 5 - Lobby entrance",
];

const monitorOptions = [
  "Security Operations Center",
  "Monitor Wall 1",
  "Monitor Wall 2",
  "Guard Station",
  "Supervisor Desk",
];

function formatUsPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function parseItems(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(
      (item) =>
        item &&
        item !== "__none__" &&
        !item.toLowerCase().startsWith("single active"),
    );
}


function cleanConfigValue(value: string) {
  return value.toLowerCase().startsWith("single active") ? "" : value;
}

function parsePushAlertConfig(value: string) {
  const [titleMessage = "", bodyMessage = "", imagePath = "", audioPath = ""] =
    value.split("||");

  return {
    titleMessage: cleanConfigValue(titleMessage),
    bodyMessage: cleanConfigValue(bodyMessage),
    imagePath: cleanConfigValue(imagePath),
    audioPath: cleanConfigValue(audioPath),
  };
}

function formatPushAlertConfig(config: {
  titleMessage: string;
  bodyMessage: string;
  imagePath: string;
  audioPath: string;
}) {
  return [
    config.titleMessage,
    config.bodyMessage,
    config.imagePath,
    config.audioPath,
  ].join("||");
}

export function WorkflowEventEditModal({
  kind,
  event,
  draftLabel,
  draftCondition,
  draftActive,
  availableRecordingCameras = [],
  onDraftLabelChange,
  onDraftConditionChange,
  onDraftActiveChange,
  onClose,
  onSave,
}: Props) {
  const [newItem, setNewItem] = useState("");
  const [selectedCamera, setSelectedCamera] = useState(CAMERA_PLACEHOLDER);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_PLACEHOLDER);
  const [selectedMonitor, setSelectedMonitor] = useState(MONITOR_PLACEHOLDER);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [confirmingCameraRemoval, setConfirmingCameraRemoval] = useState<
    string | null
  >(null);

  const isSendEmail = event.templateId === "send-email";
  const isSendSms =
    event.templateId === "send-sms" || event.templateId === "send-text";
  const isSendCall = event.templateId === "send-call";
  const isDisplayMonitor = event.templateId === "display-monitor";
  const isGoToPreset = event.templateId === "go-to-preset";
  const isMoveToCoordinates = event.templateId === "move-coordinates";
  const isMoveCamera =
    event.templateId === "move-camera" ||
    event.templateId === "move-ptz-camera" ||
    event.templateId === "move-smart-target";
  const isStartRecording = event.templateId === "start-recording";
  const isPushAlert = event.templateId === "send-alert";

  const pushAlertConfig = parsePushAlertConfig(draftCondition);

  function updatePushAlertConfig(
    key: keyof typeof pushAlertConfig,
    value: string,
  ) {
    onDraftConditionChange(
      formatPushAlertConfig({
        ...pushAlertConfig,
        [key]: value,
      }),
    );
  }

  const selectedItems = parseItems(draftCondition);
  const recordingItems =
    isStartRecording && draftCondition.trim() === "__none__"
      ? []
      : isStartRecording && selectedItems.length === 0
        ? availableRecordingCameras
        : selectedItems;

  function addItem(value?: string) {
    const nextItem = (value ?? newItem).trim();

    if (
      !nextItem ||
      nextItem === CAMERA_PLACEHOLDER ||
      nextItem === PRESET_PLACEHOLDER ||
      nextItem === MONITOR_PLACEHOLDER ||
      selectedItems.includes(nextItem)
    ) {
      setNewItem("");
      return;
    }

    onDraftConditionChange(
      [...(isStartRecording ? recordingItems : selectedItems), nextItem].join(
        ", ",
      ),
    );
    setNewItem("");
    setSelectedCamera(CAMERA_PLACEHOLDER);
    setSelectedPreset(PRESET_PLACEHOLDER);
    setSelectedMonitor(MONITOR_PLACEHOLDER);
  }

  function addPresetPair() {
    if (
      selectedCamera === CAMERA_PLACEHOLDER ||
      selectedPreset === PRESET_PLACEHOLDER
    ) {
      return;
    }

    addItem(`${selectedCamera} to ${selectedPreset}`);
  }

  function addMonitorAssignment() {
    if (
      selectedCamera === CAMERA_PLACEHOLDER ||
      selectedMonitor === MONITOR_PLACEHOLDER
    ) {
      return;
    }

    addItem(`${selectedCamera} to ${selectedMonitor}`);
  }

  function addCoordinateTarget() {
    const nextLatitude = latitude.trim();
    const nextLongitude = longitude.trim();

    if (
      selectedCamera === CAMERA_PLACEHOLDER ||
      !nextLatitude ||
      !nextLongitude
    ) {
      return;
    }

    addItem(`${selectedCamera} to ${nextLatitude} / ${nextLongitude}`);
    setLatitude("");
    setLongitude("");
  }

  function removeItem(item: string) {
    onDraftConditionChange(
      selectedItems.filter((selectedItem) => selectedItem !== item).join(", "),
    );
  }

  function toggleRecordingCamera(camera: string) {
    const nextItems = recordingItems.includes(camera)
      ? recordingItems.filter((item) => item !== camera)
      : [...recordingItems, camera];

    onDraftConditionChange(nextItems.join(", "));
  }

  function removeRecordingCamera(camera: string) {
    const nextItems = recordingItems.filter((item) => item !== camera);

    onDraftConditionChange(
      nextItems.length > 0 ? nextItems.join(", ") : "__none__",
    );
    setConfirmingCameraRemoval(null);
  }

  function renderItemPills(emptyLabel: string) {
    return (
      <div className="event-modal__pills">
        {selectedItems.length > 0 ? (
          selectedItems.map((item) => (
            <span className="event-modal__pill" key={item}>
              {item}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => removeItem(item)}
              >
                <X size={12} />
              </button>
            </span>
          ))
        ) : (
          <span className="event-modal__empty-pill">{emptyLabel}</span>
        )}
      </div>
    );
  }

  return (
    <div className="event-modal-backdrop" role="presentation">
      <section
        className="event-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit workflow event"
      >
        <div className="event-modal__header">
          <div>
            <p className="eyebrow">
              Edit {kind === "output" ? "Action" : "Event"}
            </p>
            <h2>{event.label}</h2>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Close edit modal"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        <label className="event-modal__field">
          <span>Display label</span>
          <input
            value={draftLabel}
            onChange={(changeEvent) =>
              onDraftLabelChange(changeEvent.target.value)
            }
            placeholder="Enter display label"
          />
        </label>

        {isSendEmail ? (
          <>
            <div className="event-modal__field">
              <span>Email recipients</span>
              <div className="event-modal__inline-add">
                <input
                  value={newItem}
                  onChange={(changeEvent) => setNewItem(changeEvent.target.value)}
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.key === "Enter") {
                      keyEvent.preventDefault();
                      addItem();
                    }
                  }}
                  placeholder="security@lexso.ai"
                />
                <button type="button" onClick={() => addItem()}>
                  <Plus size={14} />
                  Add
                </button>
              </div>
              {renderItemPills("No recipients added")}
            </div>

            <label className="event-modal__field">
              <span>Email message</span>
              <textarea
                placeholder="Person detected near restricted perimeter."
                rows={4}
              />
            </label>
          </>
        ) : isSendSms || isSendCall ? (
          <>
            <div className="event-modal__field">
              <span>{isSendCall ? "Call recipients" : "SMS recipients"}</span>
              <div className="event-modal__inline-add">
                <input
                  value={newItem}
                  onChange={(changeEvent) =>
                    setNewItem(formatUsPhoneNumber(changeEvent.target.value))
                  }
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.key === "Enter") {
                      keyEvent.preventDefault();
                      addItem();
                    }
                  }}
                  placeholder="757-555-0123"
                />
                <button type="button" onClick={() => addItem()}>
                  <Plus size={14} />
                  Add
                </button>
              </div>
              {renderItemPills(
                isSendCall ? "No call recipients added" : "No SMS recipients added",
              )}
            </div>

            <label className="event-modal__field">
              <span>{isSendCall ? "Call message" : "SMS message"}</span>
              <textarea
                placeholder={
                  isSendCall
                    ? "This is an automated security call."
                    : "Alert: person detected near perimeter."
                }
                rows={3}
              />
            </label>
          </>
        ) : isDisplayMonitor ? (
          <div className="event-modal__field">
            <span>Monitor assignments</span>

            <div className="event-modal__preset-grid">
              <select
                value={selectedCamera}
                onChange={(changeEvent) =>
                  setSelectedCamera(changeEvent.target.value)
                }
              >
                <option disabled value={CAMERA_PLACEHOLDER}>
                  Select camera
                </option>
                {cameraOptions.map((camera) => (
                  <option key={camera} value={camera}>
                    {camera}
                  </option>
                ))}
              </select>

              <select
                value={selectedMonitor}
                onChange={(changeEvent) =>
                  setSelectedMonitor(changeEvent.target.value)
                }
              >
                <option disabled value={MONITOR_PLACEHOLDER}>
                  Select monitor
                </option>
                {monitorOptions.map((monitor) => (
                  <option key={monitor} value={monitor}>
                    {monitor}
                  </option>
                ))}
              </select>

              <button type="button" onClick={addMonitorAssignment}>
                <Plus size={14} />
                Add
              </button>
            </div>

            {renderItemPills("No monitor assignments added")}
          </div>
        ) : isGoToPreset ? (
          <div className="event-modal__field">
            <span>Camera preset assignments</span>

            <div className="event-modal__preset-grid">
              <select
                value={selectedCamera}
                onChange={(changeEvent) =>
                  setSelectedCamera(changeEvent.target.value)
                }
              >
                <option disabled value={CAMERA_PLACEHOLDER}>
                  Select camera
                </option>
                {cameraOptions.map((camera) => (
                  <option key={camera} value={camera}>
                    {camera}
                  </option>
                ))}
              </select>

              <select
                value={selectedPreset}
                onChange={(changeEvent) =>
                  setSelectedPreset(changeEvent.target.value)
                }
              >
                <option disabled value={PRESET_PLACEHOLDER}>
                  Select preset
                </option>
                {presetOptions.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>

              <button type="button" onClick={addPresetPair}>
                <Plus size={14} />
                Add
              </button>
            </div>

            {renderItemPills("No camera presets assigned")}
          </div>
        ) : isMoveToCoordinates ? (
          <div className="event-modal__field">
            <span>Coordinate assignments</span>

            <div className="event-modal__coordinate-row-grid">
              <select
                value={selectedCamera}
                onChange={(changeEvent) =>
                  setSelectedCamera(changeEvent.target.value)
                }
              >
                <option disabled value={CAMERA_PLACEHOLDER}>
                  Select camera
                </option>
                {cameraOptions.map((camera) => (
                  <option key={camera} value={camera}>
                    {camera}
                  </option>
                ))}
              </select>

              <input
                value={latitude}
                onChange={(changeEvent) => setLatitude(changeEvent.target.value)}
                placeholder="Lat"
              />

              <input
                value={longitude}
                onChange={(changeEvent) => setLongitude(changeEvent.target.value)}
                placeholder="Long"
              />

              <button type="button" onClick={addCoordinateTarget}>
                <Plus size={14} />
                Add
              </button>
            </div>

            {renderItemPills("No coordinate targets assigned")}
          </div>
        ) : isMoveCamera ? (
          <div className="event-modal__field">
            <span>Move Cameras</span>
            <div className="event-modal__inline-add">
              <select
                value={selectedCamera}
                onChange={(changeEvent) =>
                  setSelectedCamera(changeEvent.target.value)
                }
              >
                <option disabled value={CAMERA_PLACEHOLDER}>
                  {CAMERA_PLACEHOLDER}
                </option>
                {cameraOptions.map((camera) => (
                  <option key={camera} value={camera}>
                    {camera}
                  </option>
                ))}
              </select>

              <button type="button" onClick={() => addItem(selectedCamera)}>
                <Plus size={14} />
                Add
              </button>
            </div>
            {renderItemPills("No cameras selected")}
          </div>
        ) : isStartRecording ? (
          <div className="event-modal__field">
            <span>Record Cameras</span>

            <div className="event-modal__inline-add">
              <select
                value={selectedCamera}
                onChange={(changeEvent) =>
                  setSelectedCamera(changeEvent.target.value)
                }
              >
                <option disabled value={CAMERA_PLACEHOLDER}>
                  Select additional camera to record
                </option>
                {cameraOptions.map((camera) => (
                  <option key={camera} value={camera}>
                    {camera}
                  </option>
                ))}
              </select>

              <button type="button" onClick={() => addItem(selectedCamera)}>
                <Plus size={14} />
                Add
              </button>
            </div>

            {recordingItems.length > 0 ? (
              <div className="event-modal__camera-toggle-list">
                {recordingItems.map((camera) => {
                  const isRecording = recordingItems.includes(camera);

                  return (
                    <div className="event-modal__camera-toggle-row" key={camera}>
                      <button
                        className={
                          isRecording
                            ? "event-modal__camera-toggle event-modal__camera-toggle--active"
                            : "event-modal__camera-toggle"
                        }
                        type="button"
                        onClick={() => toggleRecordingCamera(camera)}
                      >
                        <span>{camera}</span>
                        <strong>{isRecording ? "Recording" : "Off"}</strong>
                      </button>

                      {confirmingCameraRemoval === camera ? (
                        <span className="event-modal__camera-confirm">
                          <button
                            type="button"
                            onClick={() => removeRecordingCamera(camera)}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingCameraRemoval(null)}
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          className="event-modal__camera-remove"
                          type="button"
                          aria-label={`Remove ${camera}`}
                          onClick={() => setConfirmingCameraRemoval(camera)}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="event-modal__empty-card">
                Add cameras to record for this action.
              </div>
            )}
          </div>
        ) : isPushAlert ? (
          <div className="event-modal__field">
            <span>Push Alert Fields</span>

            <div className="event-modal__push-grid">
              <label>
                <span>Title message</span>
                <input
                  value={pushAlertConfig.titleMessage}
                  onChange={(changeEvent) =>
                    updatePushAlertConfig("titleMessage", changeEvent.target.value)
                  }
                  placeholder="Perimeter Alert"
                />
              </label>

              <label>
                <span>Image path</span>
                <input
                  value={pushAlertConfig.imagePath}
                  onChange={(changeEvent) =>
                    updatePushAlertConfig("imagePath", changeEvent.target.value)
                  }
                  placeholder="/alerts/perimeter.jpg"
                />
              </label>
            </div>

            <label className="event-modal__field event-modal__field--nested">
              <span>Body message</span>
              <textarea
                value={pushAlertConfig.bodyMessage}
                onChange={(changeEvent) =>
                  updatePushAlertConfig("bodyMessage", changeEvent.target.value)
                }
                placeholder="Person detected near restricted perimeter."
                rows={3}
              />
            </label>

            <label className="event-modal__field event-modal__field--nested">
              <span>Audio path</span>
              <input
                value={pushAlertConfig.audioPath}
                onChange={(changeEvent) =>
                  updatePushAlertConfig("audioPath", changeEvent.target.value)
                }
                placeholder="/alerts/perimeter-warning.mp3"
              />
            </label>
          </div>
        ) : (
          <label className="event-modal__field">
            <span>Condition / details</span>
            <textarea
              value={draftCondition}
              onChange={(changeEvent) =>
                onDraftConditionChange(changeEvent.target.value)
              }
              placeholder="Describe action details"
              rows={4}
            />
          </label>
        )}

        <label className="event-modal__toggle">
          <input
            type="checkbox"
            checked={draftActive}
            onChange={(changeEvent) =>
              onDraftActiveChange(changeEvent.target.checked)
            }
          />
          <span>Enabled</span>
        </label>

        <div className="event-modal__actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" type="button" onClick={onSave}>
            Save Changes
          </button>
        </div>
      </section>
    </div>
  );
}
