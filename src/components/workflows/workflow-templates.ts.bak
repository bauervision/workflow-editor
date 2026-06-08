import type { EventTemplate } from "./workflow-types";

export const inputTemplates: EventTemplate[] = [
  { id: "person-enters-zone", label: "Person enters zone", description: "A person crosses into a geofence.", kind: "input" },
  { id: "vehicle-enters-zone", label: "Vehicle enters zone", description: "A vehicle crosses into a geofence.", kind: "input" },
  { id: "camera-person", label: "Camera detects person", description: "Camera classification returns person.", kind: "input" },
  { id: "camera-vehicle", label: "Camera detects vehicle", description: "Camera classification returns vehicle.", kind: "input" },
  { id: "radar-person", label: "Radar detection - person", description: "Radar track matches person-sized motion.", kind: "input" },
  { id: "radar-vehicle", label: "Radar detection - vehicle", description: "Radar track matches vehicle motion.", kind: "input" },
  { id: "uas-detected", label: "Drone detected", description: "UAS classification appears.", kind: "input" },
];

export const outputTemplates: EventTemplate[] = [
  { id: "send-sms", label: "Send SMS", description: "Notify a configured phone number.", kind: "output" },
  { id: "send-email", label: "Send Email", description: "Notify a configured email group.", kind: "output" },
  { id: "move-camera", label: "Move camera", description: "Move PTZ camera to target.", kind: "output" },
  { id: "start-recording", label: "Start recording", description: "Record nearby camera feeds.", kind: "output" },
  { id: "dispatch-patrol", label: "Dispatch patrol", description: "Send response team.", kind: "output" },
  { id: "trigger-alarm", label: "Trigger alarm", description: "Trigger local alarm or speaker.", kind: "output" },
];
