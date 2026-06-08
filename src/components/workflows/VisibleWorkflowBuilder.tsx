///src/components/workflows/VisibleWorkflowBuilder.tsx
import { type DragEvent, useState } from "react";
import {
  ArrowRight,
  GitBranch,
  GripVertical,
  Pencil,
  Plus,
  Power,
  Split,
  Trash2,
  X,
} from "lucide-react";

import { inputTemplates, outputTemplates } from "./workflow-templates";
import type { EventKind, Workflow, WorkflowEvent } from "./workflow-types";

type BuilderEventKind = EventKind | "orInput";

type EditingEvent = {
  kind: BuilderEventKind;
  event: WorkflowEvent;
};

type ConfirmingDelete = {
  kind: BuilderEventKind;
  eventId: string;
};

type DraggingRow = {
  kind: BuilderEventKind;
  index: number;
};

type Props = {
  workflow: Workflow & {
    orInputEvents?: WorkflowEvent[];
  };
  onAddVisibleEvent: (kind: BuilderEventKind, workflowId: string) => void;
  onUpdateEventTemplate: (
    kind: BuilderEventKind,
    workflowId: string,
    eventId: string,
    templateId: string,
  ) => void;
  onUpdateEventDetails: (
    kind: BuilderEventKind,
    workflowId: string,
    eventId: string,
    updates: { label: string; condition: string; active: boolean },
  ) => void;
  onReorderEvents: (
    kind: BuilderEventKind,
    workflowId: string,
    sourceIndex: number,
    targetIndex: number,
  ) => void;
  onDeleteEvent: (
    kind: BuilderEventKind,
    workflowId: string,
    eventId: string,
  ) => void;
  onToggleEvent: (
    kind: BuilderEventKind,
    workflowId: string,
    eventId: string,
  ) => void;
};

export function VisibleWorkflowBuilder({
  workflow,
  onAddVisibleEvent,
  onUpdateEventTemplate,
  onUpdateEventDetails,
  onReorderEvents,
  onDeleteEvent,
  onToggleEvent,
}: Props) {
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null);
  const [confirmingDelete, setConfirmingDelete] =
    useState<ConfirmingDelete | null>(null);
  const [draggingRow, setDraggingRow] = useState<DraggingRow | null>(null);
  const [dropTarget, setDropTarget] = useState<DraggingRow | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftCondition, setDraftCondition] = useState("");
  const [draftActive, setDraftActive] = useState(true);

  const [outputMode, setOutputMode] = useState<"sequential" | "parallel">(
    "sequential",
  );

  const orInputEvents = workflow.orInputEvents ?? [];

  function openEditModal(kind: BuilderEventKind, event: WorkflowEvent) {
    setEditingEvent({ kind, event });
    setDraftLabel(event.label);
    setDraftCondition(event.condition);
    setDraftActive(event.active);
  }

  function closeEditModal() {
    setEditingEvent(null);
    setDraftLabel("");
    setDraftCondition("");
    setDraftActive(true);
  }

  function saveEditModal() {
    if (!editingEvent) {
      return;
    }

    onUpdateEventDetails(
      editingEvent.kind,
      workflow.id,
      editingEvent.event.id,
      {
        label: draftLabel.trim() || editingEvent.event.label,
        condition: draftCondition.trim() || editingEvent.event.condition,
        active: draftActive,
      },
    );

    closeEditModal();
  }

  function beginRowDrag(
    event: DragEvent<HTMLButtonElement>,
    kind: BuilderEventKind,
    index: number,
  ) {
    setDraggingRow({ kind, index });
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "application/workflow-visible-row",
      JSON.stringify({ kind, index }),
    );
  }

  function allowRowDrop(
    event: DragEvent<HTMLDivElement>,
    kind: BuilderEventKind,
    index: number,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (draggingRow?.kind === kind && draggingRow.index !== index) {
      setDropTarget({ kind, index });
    }
  }

  function dropRow(
    event: DragEvent<HTMLDivElement>,
    targetKind: BuilderEventKind,
    targetIndex: number,
  ) {
    event.preventDefault();

    const rawDragData = event.dataTransfer.getData(
      "application/workflow-visible-row",
    );

    const parsedDragData = rawDragData
      ? (JSON.parse(rawDragData) as DraggingRow)
      : draggingRow;

    if (!parsedDragData || parsedDragData.kind !== targetKind) {
      setDraggingRow(null);
      setDropTarget(null);
      return;
    }

    onReorderEvents(targetKind, workflow.id, parsedDragData.index, targetIndex);
    setDraggingRow(null);
    setDropTarget(null);
  }

  function confirmDelete(kind: BuilderEventKind, eventId: string) {
    setConfirmingDelete({ kind, eventId });
  }

  function cancelDelete() {
    setConfirmingDelete(null);
  }

  function completeDelete(kind: BuilderEventKind, eventId: string) {
    onDeleteEvent(kind, workflow.id, eventId);
    setConfirmingDelete(null);
  }

  function isConfirmingDelete(kind: BuilderEventKind, eventId: string) {
    return (
      confirmingDelete?.kind === kind && confirmingDelete.eventId === eventId
    );
  }

  function getTemplates(kind: BuilderEventKind) {
    return kind === "output" ? outputTemplates : inputTemplates;
  }

  function renderRows(kind: BuilderEventKind, events: WorkflowEvent[]) {
    const templates = getTemplates(kind);

    return events.map((event, index) => {
      const confirming = isConfirmingDelete(kind, event.id);
      const isDragging =
        draggingRow?.kind === kind && draggingRow.index === index;
      const isDropTarget =
        dropTarget?.kind === kind && dropTarget.index === index;

      return (
        <div
          className={[
            "builder-row",
            isDragging ? "builder-row--dragging" : "",
            isDropTarget ? "builder-row--drop-target" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={event.id}
          onDragOver={(dragEvent) => allowRowDrop(dragEvent, kind, index)}
          onDragLeave={() => {
            if (dropTarget?.kind === kind && dropTarget.index === index) {
              setDropTarget(null);
            }
          }}
          onDrop={(dropEvent) => dropRow(dropEvent, kind, index)}
        >
          {kind === "output" && outputMode === "parallel" ? (
            <ArrowRight size={13} />
          ) : (
            `${index + 1})`
          )}
          <select
            value={event.templateId}
            onChange={(changeEvent) =>
              onUpdateEventTemplate(
                kind,
                workflow.id,
                event.id,
                changeEvent.target.value,
              )
            }
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>

          <button
            className={
              event.active ? "icon-button icon-button--active" : "icon-button"
            }
            type="button"
            onClick={() => onToggleEvent(kind, workflow.id, event.id)}
            aria-label={event.active ? "Disable item" : "Enable item"}
          >
            <Power size={14} />
          </button>

          <button
            className="icon-button"
            type="button"
            aria-label="Edit item"
            onClick={() => openEditModal(kind, event)}
          >
            <Pencil size={14} />
          </button>

          {confirming ? (
            <span className="builder-delete-confirm">
              <button
                type="button"
                onClick={() => completeDelete(kind, event.id)}
              >
                Yes
              </button>
              <button type="button" onClick={cancelDelete}>
                No
              </button>
            </span>
          ) : (
            <button
              className="icon-button"
              type="button"
              aria-label="Delete item"
              onClick={() => confirmDelete(kind, event.id)}
            >
              <Trash2 size={14} />
            </button>
          )}

          <button
            className="builder-row__grip-button"
            type="button"
            draggable
            aria-label="Drag to reorder"
            onDragStart={(dragEvent) => beginRowDrag(dragEvent, kind, index)}
            onDragEnd={() => {
              setDraggingRow(null);
              setDropTarget(null);
            }}
          >
            <GripVertical size={15} />
          </button>
        </div>
      );
    });
  }

  return (
    <div className="visible-builder">
      <section className="builder-card builder-card--input">
        <div className="builder-card__header">
          <div>
            <p className="eyebrow">When</p>
            <h2>Trigger Events</h2>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Edit trigger events"
          >
            <Pencil size={15} />
          </button>
        </div>

        <div className="builder-rule">
          <span className="builder-rule__pill">AND</span>
          <span>All listed events must be true</span>
        </div>

        <div className="builder-list">
          {renderRows("input", workflow.inputEvents)}
        </div>

        <button
          className="builder-add-button"
          type="button"
          onClick={() => onAddVisibleEvent("input", workflow.id)}
        >
          <Plus size={14} />
          Add Event
        </button>

        <div className="builder-or-section">
          <div className="builder-or-section__divider" />

          <div className="builder-rule">
            <span className="builder-rule__pill builder-rule__pill--or">
              OR
            </span>
            <span>Any listed event may also trigger</span>
          </div>

          <div className="builder-list">
            {renderRows("orInput", orInputEvents)}
          </div>

          <button
            className="builder-add-button"
            type="button"
            onClick={() => onAddVisibleEvent("orInput", workflow.id)}
          >
            <Plus size={14} />
            Add OR Event
          </button>
        </div>
      </section>

      <div className="builder-connector">
        <span />
      </div>

      <section className="builder-card builder-card--output">
        <div className="builder-card__header">
          <div>
            <p className="eyebrow">Do</p>
            <h2>Output Actions</h2>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="Edit output actions"
          >
            <Pencil size={15} />
          </button>
        </div>

        <div className="builder-list">
          {renderRows("output", workflow.outputEvents)}
        </div>

        <div className="builder-output-footer">
          <button
            className="builder-add-button"
            type="button"
            onClick={() => onAddVisibleEvent("output", workflow.id)}
          >
            <Plus size={14} />
            Add Action
          </button>

          <div className="builder-mode-row">
            <div
              className="builder-mode-toggle"
              aria-label="Output action mode"
            >
              <button
                className={
                  outputMode === "sequential"
                    ? "builder-mode-toggle__button builder-mode-toggle__button--active"
                    : "builder-mode-toggle__button"
                }
                type="button"
                onClick={() => setOutputMode("sequential")}
              >
                Sequential
              </button>

              <button
                className={
                  outputMode === "parallel"
                    ? "builder-mode-toggle__button builder-mode-toggle__button--active"
                    : "builder-mode-toggle__button"
                }
                type="button"
                onClick={() => setOutputMode("parallel")}
              >
                Parallel
              </button>
            </div>
          </div>
        </div>
      </section>

      {editingEvent ? (
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
                  Edit {editingEvent.kind === "output" ? "Action" : "Event"}
                </p>
                <h2>{editingEvent.event.label}</h2>
              </div>

              <button
                className="icon-button"
                type="button"
                aria-label="Close edit modal"
                onClick={closeEditModal}
              >
                <X size={15} />
              </button>
            </div>

            <label className="event-modal__field">
              <span>Display label</span>
              <input
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                placeholder="Enter display label"
              />
            </label>

            <label className="event-modal__field">
              <span>Condition / details</span>
              <textarea
                value={draftCondition}
                onChange={(event) => setDraftCondition(event.target.value)}
                placeholder="Describe when this event is active"
                rows={4}
              />
            </label>

            <label className="event-modal__toggle">
              <input
                type="checkbox"
                checked={draftActive}
                onChange={(event) => setDraftActive(event.target.checked)}
              />
              <span>Enabled</span>
            </label>

            <div className="event-modal__actions">
              <button
                className="ghost-button"
                type="button"
                onClick={closeEditModal}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={saveEditModal}
              >
                Save Changes
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
