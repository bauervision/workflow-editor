export type EventKind = "input" | "output";
export type ConditionKind = "IF" | "AND" | "OR" | "THEN";
export type EditorMode = "node-flow" | "visible-builder";

export type Workflow = {
  id: string;
  name: string;
  active: boolean;
  inputEvents: WorkflowEvent[];
  outputEvents: WorkflowEvent[];
  inputLinks: WorkflowLink[];
  outputLinks: WorkflowLink[];
};

export type WorkflowEvent = {
  id: string;
  templateId: string;
  label: string;
  condition: string;
  active: boolean;
  position: { x: number; y: number };
};

export type WorkflowLink = {
  id: string;
  sourceId: string;
  targetId: string;
  operator: ConditionKind;
};

export type EventTemplate = {
  id: string;
  label: string;
  description: string;
  kind: EventKind;
};

export type WorkflowView =
  | { name: "workflow-list" }
  | { name: "workflow-overview"; workflowId: string }
  | { name: "input-events"; workflowId: string }
  | { name: "output-events"; workflowId: string };
