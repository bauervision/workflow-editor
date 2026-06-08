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
  {
    id: "display-monitor",
    kind: "output",
    label: "Display in Monitor",
    description: "Display one or more cameras in a monitor view.",
  },
  {
    id: "go-to-preset",
    kind: "output",
    label: "Go to preset",
    description: "Move one or more cameras to a saved preset.",
  },
  {
    id: "move-coordinates",
    kind: "output",
    label: "Move to coordinates",
    description: "Move a camera to latitude and longitude coordinates.",
  },
  {
    id: "move-smart-target",
    kind: "output",
    label: "Move to smart target",
    description: "Move a camera to track the detected target.",
  },
  {
    id: "send-email",
    kind: "output",
    label: "Send Email",
    description: "Notify one or more recipients by email.",
  },
  {
    id: "send-text",
    kind: "output",
    label: "Send Text",
    description: "Notify one or more recipients by SMS.",
  },
  {
    id: "send-call",
    kind: "output",
    label: "Send Call",
    description: "Place an automated voice call.",
  },
  {
    id: "send-alert",
    kind: "output",
    label: "Push Alert",
    description: "Send a push alert notification.",
  },
  {
    id: "start-recording",
    kind: "output",
    label: "Start recording",
    description: "Start recording selected cameras.",
  },
];
