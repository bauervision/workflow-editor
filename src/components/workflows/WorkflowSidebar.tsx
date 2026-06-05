import { type DragEvent } from "react";
import { ArrowLeft } from "lucide-react";

import type {
  EditorMode,
  EventKind,
  EventTemplate,
  Workflow,
  WorkflowView,
} from "./workflow-types";

type Props = {
  workflow: Workflow;
  view: WorkflowView;
  editorMode: EditorMode;
  detailKind: EventKind | null;
  templates: EventTemplate[];
  onBack: () => void;
  onRenameWorkflow: (workflowId: string, name: string) => void;
  onToggleWorkflow: (workflowId: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAutoArrange: () => void;
  onTemplateDragStart: (
    event: DragEvent<HTMLButtonElement>,
    template: EventTemplate,
  ) => void;
};

export function WorkflowSidebar({
  workflow,
  view,
  editorMode,
  detailKind,
  templates,
  onBack,
  onRenameWorkflow,
  onToggleWorkflow,
  onEditorModeChange,
  onAutoArrange,
  onTemplateDragStart,
}: Props) {
  return (
    <aside className="side-panel">
      <button className="ghost-button" type="button" onClick={onBack}>
        <ArrowLeft size={16} />
        {view.name === "workflow-overview"
          ? "Back to workflows"
          : "Back to workflow"}
      </button>

      <div className="panel-section">
        <p className="eyebrow">Editing Workflow</p>

        <input
          className="workflow-name-input"
          value={workflow.name}
          onChange={(event) =>
            onRenameWorkflow(workflow.id, event.target.value)
          }
        />

        <button
          className={
            workflow.active
              ? "status-button status-button--active"
              : "status-button"
          }
          type="button"
          onClick={() => onToggleWorkflow(workflow.id)}
        >
          {workflow.active ? "Active" : "Inactive"}
        </button>
      </div>

      <div className="panel-section">
        <h3>Editor Approach</h3>

        <div className="mode-switch">
          <button
            className={
              editorMode === "node-flow"
                ? "mode-switch__button mode-switch__button--active"
                : "mode-switch__button"
            }
            type="button"
            onClick={() => onEditorModeChange("node-flow")}
          >
            Node Flow
          </button>

          <button
            className={
              editorMode === "visible-builder"
                ? "mode-switch__button mode-switch__button--active"
                : "mode-switch__button"
            }
            type="button"
            onClick={() => onEditorModeChange("visible-builder")}
          >
            Visible Builder
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Current Level</h3>
        <p>
          {view.name === "workflow-overview"
            ? "Workflow overview"
            : view.name === "input-events"
              ? "Input events"
              : "Output actions"}
        </p>

        {editorMode === "node-flow" && view.name !== "workflow-overview" ? (
          <button
            type="button"
            onClick={onAutoArrange}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              marginTop: 14,
              border: "1px solid rgba(34, 211, 238, 0.35)",
              borderRadius: 999,
              padding: "10px 14px",
              color: "#e0f2fe",
              background: "rgba(8, 145, 178, 0.16)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Auto Arrange Nodes
          </button>
        ) : null}
      </div>

      {detailKind && editorMode === "node-flow" ? (
        <div className="template-panel">
          <div className="template-panel__title">
            Click the canvas or drag{" "}
            {detailKind === "input" ? "input events" : "output actions"} onto
            the graph
          </div>

          {templates.map((template) => (
            <button
              className="template-card"
              draggable
              key={template.id}
              type="button"
              onDragStart={(event) => onTemplateDragStart(event, template)}
            >
              <strong>{template.label}</strong>
              <span>{template.description}</span>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
