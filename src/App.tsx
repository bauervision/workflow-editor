//src/App.tsx
import { type DragEvent, useCallback, useState } from "react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Plus } from "lucide-react";

import { WorkflowSidebar } from "./components/workflows/WorkflowSidebar";

import { NodeFlowWorkflowEditor } from "./components/workflows/NodeFlowWorkflowEditor";
import { VisibleWorkflowBuilder } from "./components/workflows/VisibleWorkflowBuilder";
import {
  inputTemplates,
  outputTemplates,
} from "./components/workflows/workflow-templates";
import type {
  ConditionKind,
  EditorMode,
  EventKind,
  EventTemplate,
  Workflow,
  WorkflowView,
} from "./components/workflows/workflow-types";

const conditionKinds: ConditionKind[] = ["IF", "AND", "OR", "THEN"];

const initialWorkflows: Workflow[] = [
  {
    id: "perimeter-intrusion",
    name: "Perimeter Intrusion Response",
    active: true,
    inputLinks: [],
    outputLinks: [],
    orInputEvents: [],
    inputEvents: [
      {
        id: "input-1",
        templateId: "person-enters-zone",
        label: "Person enters geofence",
        condition: "Single active input event",
        active: true,
        position: { x: 130, y: 120 },
      },
      {
        id: "input-2",
        templateId: "camera-person",
        label: "Camera confirms person",
        condition: "Single active input event",
        active: true,
        position: { x: 560, y: 120 },
      },
    ],
    outputEvents: [
      {
        id: "output-1",
        templateId: "move-camera",
        label: "Move PTZ camera",
        condition: "Single active output action",
        active: true,
        position: { x: 130, y: 120 },
      },
    ],
  },
];

function createBlankWorkflow(): Workflow {
  const id = `workflow-${Date.now()}`;

  return {
    id,
    name: "New Workflow",
    active: false,

    inputEvents: [],
    orInputEvents: [],
    outputEvents: [],

    inputLinks: [],
    outputLinks: [],
  };
}

function findTemplate(kind: EventKind, templateId: string) {
  const templates = kind === "output" ? outputTemplates : inputTemplates;
  return (
    templates.find((template) => template.id === templateId) ?? templates[0]
  );
}

function getEventKey(kind: EventKind) {
  switch (kind) {
    case "input":
      return "inputEvents";

    case "orInput":
      return "orInputEvents";

    case "output":
      return "outputEvents";
  }
}

export default function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [view, setView] = useState<WorkflowView>({ name: "workflow-list" });
  const [editorMode, setEditorMode] = useState<EditorMode>("node-flow");

  const selectedWorkflow =
    view.name === "workflow-list"
      ? null
      : (workflows.find((workflow) => workflow.id === view.workflowId) ?? null);

  const detailKind =
    view.name === "input-events"
      ? "input"
      : view.name === "or-input-events"
        ? "orInput"
        : view.name === "output-events"
          ? "output"
          : null;

  const templates = detailKind === "output" ? outputTemplates : inputTemplates;

  const openOrInputEvents = useCallback(() => {
    if (!selectedWorkflow) {
      return;
    }

    setView({ name: "or-input-events", workflowId: selectedWorkflow.id });
  }, [selectedWorkflow]);

  function updateWorkflow(
    workflowId: string,
    updater: (workflow: Workflow) => Workflow,
  ) {
    setWorkflows((current) =>
      current.map((workflow) =>
        workflow.id === workflowId ? updater(workflow) : workflow,
      ),
    );
  }

  function createWorkflow() {
    const workflow = createBlankWorkflow();
    setWorkflows((current) => [workflow, ...current]);
    setView({ name: "workflow-overview", workflowId: workflow.id });
  }

  function toggleWorkflow(workflowId: string) {
    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      active: !workflow.active,
    }));
  }

  function renameWorkflow(workflowId: string, name: string) {
    updateWorkflow(workflowId, (workflow) => ({ ...workflow, name }));
  }

  function toggleEvent(kind: EventKind, workflowId: string, eventId: string) {
    updateWorkflow(workflowId, (workflow) => {
      const key = getEventKey(kind);

      return {
        ...workflow,
        [key]: workflow[key].map((event) =>
          event.id === eventId ? { ...event, active: !event.active } : event,
        ),
      };
    });
  }

  function deleteEvent(kind: EventKind, workflowId: string, eventId: string) {
    updateWorkflow(workflowId, (workflow) => {
      const eventKey = getEventKey(kind);
      const linkKey = kind === "input" ? "inputLinks" : "outputLinks";

      return {
        ...workflow,
        [eventKey]: workflow[eventKey].filter((event) => event.id !== eventId),
        [linkKey]: workflow[linkKey].filter(
          (link) => link.sourceId !== eventId && link.targetId !== eventId,
        ),
      };
    });
  }

  function addEventFromTemplate(
    kind: EventKind,
    workflowId: string,
    template: EventTemplate,
    position: { x: number; y: number },
    forcedId?: string,
  ): string {
    const id = forcedId ?? `${kind}-${Date.now()}`;

    updateWorkflow(workflowId, (workflow) => {
      const key = getEventKey(kind);

      return {
        ...workflow,
        [key]: [
          ...workflow[key],
          {
            id,
            templateId: template.id,
            label: template.label,
            condition:
              kind === "input" ? "Single active event" : "Single active action",
            active: true,
            position,
          },
        ],
      };
    });

    return id;
  }

  function addVisibleEvent(kind: EventKind, workflowId: string) {
    const templates = kind === "input" ? inputTemplates : outputTemplates;
    const currentEvents =
      kind === "input"
        ? (selectedWorkflow?.inputEvents ?? [])
        : kind === "orInput"
          ? (selectedWorkflow?.orInputEvents ?? [])
          : (selectedWorkflow?.outputEvents ?? []);

    const nextTemplateIndex = Math.min(
      currentEvents.length,
      templates.length - 1,
    );
    const template = templates[nextTemplateIndex];

    addEventFromTemplate(kind, workflowId, template, {
      x: 140,
      y: 120 + currentEvents.length * 80,
    });
  }

  function updateEventTemplate(
    kind: EventKind,
    workflowId: string,
    eventId: string,
    templateId: string,
  ) {
    const template = findTemplate(kind, templateId);

    updateWorkflow(workflowId, (workflow) => {
      const key = getEventKey(kind);

      return {
        ...workflow,
        [key]: workflow[key].map((event) =>
          event.id === eventId
            ? {
                ...event,
                templateId: template.id,
                label: template.label,
              }
            : event,
        ),
      };
    });
  }

  function updateEventDetails(
    kind: EventKind,
    workflowId: string,
    eventId: string,
    updates: { label: string; condition: string; active: boolean },
  ) {
    updateWorkflow(workflowId, (workflow) => {
      const key = getEventKey(kind);

      return {
        ...workflow,
        [key]: workflow[key].map((event) =>
          event.id === eventId
            ? {
                ...event,
                label: updates.label,
                condition: updates.condition,
                active: updates.active,
              }
            : event,
        ),
      };
    });
  }

  function addLink(
    kind: EventKind,
    workflowId: string,
    sourceId: string,
    targetId: string,
    operator: ConditionKind,
  ) {
    updateWorkflow(workflowId, (workflow) => {
      const key = kind === "input" ? "inputLinks" : "outputLinks";

      return {
        ...workflow,
        [key]: [
          ...workflow[key].filter(
            (link) =>
              !(link.sourceId === sourceId && link.targetId === targetId),
          ),
          {
            id: `link-${sourceId}-${targetId}`,
            sourceId,
            targetId,
            operator,
          },
        ],
      };
    });
  }

  function addConnectedEventFromTemplate(
    kind: EventKind,
    workflowId: string,
    sourceId: string,
    template: EventTemplate,
    position: { x: number; y: number },
    operator: ConditionKind,
  ): string {
    const eventId = `${kind}-${Date.now()}`;
    const eventKey = getEventKey(kind);
    const linkKey = kind === "input" ? "inputLinks" : "outputLinks";

    updateWorkflow(workflowId, (workflow) => ({
      ...workflow,
      [eventKey]: [
        ...workflow[eventKey],
        {
          id: eventId,
          templateId: template.id,
          label: template.label,
          condition:
            kind === "input" ? "Single active event" : "Single active action",
          active: true,
          position,
        },
      ],
      [linkKey]: [
        ...workflow[linkKey].filter(
          (link) => !(link.sourceId === sourceId && link.targetId === eventId),
        ),
        {
          id: `link-${sourceId}-${eventId}`,
          sourceId,
          targetId: eventId,
          operator,
        },
      ],
    }));

    return eventId;
  }

  function updateEventPosition(
    kind: EventKind,
    workflowId: string,
    eventId: string,
    position: { x: number; y: number },
  ) {
    updateWorkflow(workflowId, (workflow) => {
      const key = getEventKey(kind);

      return {
        ...workflow,
        [key]: workflow[key].map((event) =>
          event.id === eventId ? { ...event, position } : event,
        ),
      };
    });
  }

  function reorderEvents(
    kind: EventKind,
    workflowId: string,
    sourceIndex: number,
    targetIndex: number,
  ) {
    if (sourceIndex === targetIndex) {
      return;
    }

    updateWorkflow(workflowId, (workflow) => {
      const key = getEventKey(kind);
      const nextEvents = [...workflow[key]];
      const [movedEvent] = nextEvents.splice(sourceIndex, 1);

      if (!movedEvent) {
        return workflow;
      }

      nextEvents.splice(targetIndex, 0, movedEvent);

      return {
        ...workflow,
        [key]: nextEvents,
      };
    });
  }

  function autoArrangeNodes() {
    if (!selectedWorkflow || !detailKind) {
      return;
    }

    updateWorkflow(selectedWorkflow.id, (workflow) => {
      const key =
        detailKind === "input"
          ? "inputEvents"
          : detailKind === "orInput"
            ? "orInputEvents"
            : "outputEvents";

      const columns = 2;
      const columnGap = 420;
      const rowGap = 150;
      const startX = 120;
      const startY = 120;

      return {
        ...workflow,
        [key]: workflow[key].map((event, index) => ({
          ...event,
          position: {
            x: startX + (index % columns) * columnGap,
            y: startY + Math.floor(index / columns) * rowGap,
          },
        })),
      };
    });
  }

  function onTemplateDragStart(
    event: DragEvent<HTMLButtonElement>,
    template: EventTemplate,
  ) {
    event.dataTransfer.setData(
      "application/workflow-template",
      JSON.stringify(template),
    );
    event.dataTransfer.effectAllowed = "move";
  }

  const openInputEvents = useCallback(() => {
    if (!selectedWorkflow) {
      return;
    }

    setView({ name: "input-events", workflowId: selectedWorkflow.id });
  }, [selectedWorkflow]);

  const openOutputEvents = useCallback(() => {
    if (!selectedWorkflow) {
      return;
    }

    setView({ name: "output-events", workflowId: selectedWorkflow.id });
  }, [selectedWorkflow]);

  if (view.name === "workflow-list") {
    return (
      <main className="app-shell">
        <header className="app-header">
          <div>
            <p className="eyebrow">Lexso Prototype</p>
            <h1>Workflow Editor</h1>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={createWorkflow}
          >
            <Plus size={16} />
            New Workflow
          </button>
        </header>

        <section className="workflow-list">
          {workflows.map((workflow) => (
            <article className="workflow-card" key={workflow.id}>
              <div>
                <div className="workflow-card__title">{workflow.name}</div>
                <div className="workflow-card__meta">
                  {workflow.inputEvents.length} inputs ·{" "}
                  {workflow.outputEvents.length} outputs
                </div>
              </div>

              <div className="workflow-card__actions">
                <button
                  className={
                    workflow.active
                      ? "status-button status-button--active"
                      : "status-button"
                  }
                  type="button"
                  onClick={() => toggleWorkflow(workflow.id)}
                >
                  {workflow.active ? "Active" : "Inactive"}
                </button>

                <button
                  className="primary-button"
                  type="button"
                  onClick={() =>
                    setView({
                      name: "workflow-overview",
                      workflowId: workflow.id,
                    })
                  }
                >
                  Edit
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    );
  }

  if (!selectedWorkflow) {
    return (
      <main className="app-shell">
        <button
          className="ghost-button"
          type="button"
          onClick={() => setView({ name: "workflow-list" })}
        >
          <ArrowLeft size={16} />
          Back to workflows
        </button>
      </main>
    );
  }

  return (
    <main className="editor-shell">
      <WorkflowSidebar
        workflow={selectedWorkflow}
        view={view}
        editorMode={editorMode}
        detailKind={detailKind}
        templates={templates}
        onBack={() =>
          view.name === "workflow-overview"
            ? setView({ name: "workflow-list" })
            : setView({
                name: "workflow-overview",
                workflowId: selectedWorkflow.id,
              })
        }
        onRenameWorkflow={renameWorkflow}
        onToggleWorkflow={toggleWorkflow}
        onEditorModeChange={setEditorMode}
        onAutoArrange={autoArrangeNodes}
        onTemplateDragStart={onTemplateDragStart}
      />

      <section className="flow-panel">
        {editorMode === "visible-builder" ? (
          <VisibleWorkflowBuilder
            workflow={selectedWorkflow}
            onAddVisibleEvent={addVisibleEvent}
            onUpdateEventTemplate={updateEventTemplate}
            onUpdateEventDetails={updateEventDetails}
            onReorderEvents={reorderEvents}
            onDeleteEvent={deleteEvent}
            onToggleEvent={toggleEvent}
          />
        ) : (
          <NodeFlowWorkflowEditor
            workflow={selectedWorkflow}
            viewName={view.name}
            detailKind={detailKind}
            templates={templates}
            conditionKinds={conditionKinds}
            onOpenInputEvents={openInputEvents}
            onOpenOutputEvents={openOutputEvents}
            onToggleEvent={toggleEvent}
            onDeleteEvent={deleteEvent}
            onAddEventFromTemplate={addEventFromTemplate}
            onAddLink={addLink}
            onAddConnectedEventFromTemplate={addConnectedEventFromTemplate}
            onUpdateEventPosition={updateEventPosition}
            onOpenOrInputEvents={openOrInputEvents}
          />
        )}
      </section>
    </main>
  );
}
