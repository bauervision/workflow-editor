import {
  type DragEvent,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ConnectionMode,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type OnConnectStartParams,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Power, Trash2 } from "lucide-react";

import type {
  ConditionKind,
  EventKind,
  EventTemplate,
  Workflow,
  WorkflowEvent,
  WorkflowView,
} from "./workflow-types";

type Props = {
  workflow: Workflow;
  viewName: WorkflowView["name"];
  detailKind: EventKind | null;
  templates: EventTemplate[];
  conditionKinds: ConditionKind[];
  onOpenInputEvents: () => void;
  onOpenOutputEvents: () => void;
  onToggleEvent: (kind: EventKind, workflowId: string, eventId: string) => void;
  onDeleteEvent: (kind: EventKind, workflowId: string, eventId: string) => void;
  onAddEventFromTemplate: (
    kind: EventKind,
    workflowId: string,
    template: EventTemplate,
    position: { x: number; y: number },
    forcedId?: string,
  ) => string;
  onAddLink: (
    kind: EventKind,
    workflowId: string,
    sourceId: string,
    targetId: string,
    operator: ConditionKind,
  ) => void;
  onAddConnectedEventFromTemplate: (
    kind: EventKind,
    workflowId: string,
    sourceId: string,
    template: EventTemplate,
    position: { x: number; y: number },
    operator: ConditionKind,
  ) => string;
  onUpdateEventPosition: (
    kind: EventKind,
    workflowId: string,
    eventId: string,
    position: { x: number; y: number },
  ) => void;
};

type PendingConnection = {
  x: number;
  y: number;
  sourceId: string;
  operator: ConditionKind | null;
  kind: EventKind;
  workflowId: string;
  search: string;
};

type PendingPaneAdd = {
  x: number;
  y: number;
  position: { x: number; y: number };
  kind: EventKind;
  workflowId: string;
  search: string;
};

type SummaryNodeData = {
  title: string;
  subtitle: string;
  accent: EventKind;
  onOpen: () => void;
};

type EventNodeData = {
  event: WorkflowEvent;
  onToggle: (eventId: string) => void;
  onDelete: (eventId: string) => void;
};

function SummaryNode({ data }: NodeProps<Node<SummaryNodeData>>) {
  return (
    <button
      className={`summary-node summary-node--${data.accent}`}
      onClick={data.onOpen}
      type="button"
    >
      <Handle type="target" position={Position.Left} />
      <div className="summary-node__title">{data.title}</div>
      <div className="summary-node__subtitle">{data.subtitle}</div>
      <Handle type="source" position={Position.Right} />
    </button>
  );
}

function EventNode({ data }: NodeProps<Node<EventNodeData>>) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div
      className={`event-node ${data.event.active ? "" : "event-node--disabled"}`}
    >
      <Handle type="target" position={Position.Left} />

      <div className="event-node__top">
        <div>
          <div className="event-node__label">{data.event.label}</div>
          <div className="event-node__condition">{data.event.condition}</div>
        </div>

        <span
          className={data.event.active ? "status status--active" : "status"}
        >
          {data.event.active ? "Active" : "Off"}
        </span>
      </div>

      <div className="event-node__actions">
        <button type="button" onClick={() => data.onToggle(data.event.id)}>
          <Power size={14} />
          {data.event.active ? "Disable" : "Enable"}
        </button>

        {confirmingDelete ? (
          <span className="delete-confirm">
            Delete?
            <button type="button" onClick={() => data.onDelete(data.event.id)}>
              Yes
            </button>
            <button type="button" onClick={() => setConfirmingDelete(false)}>
              No
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={14} />
            Delete
          </button>
        )}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  summary: SummaryNode,
  event: EventNode,
};

export function NodeFlowWorkflowEditor({
  workflow,
  viewName,
  detailKind,
  templates,
  conditionKinds,
  onOpenInputEvents,
  onOpenOutputEvents,
  onToggleEvent,
  onDeleteEvent,
  onAddEventFromTemplate,
  onAddLink,
  onAddConnectedEventFromTemplate,
  onUpdateEventPosition,
}: Props) {
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(
    null,
  );
  const suppressNextPaneClickRef = useRef(false);

  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const [pendingPaneAdd, setPendingPaneAdd] = useState<PendingPaneAdd | null>(
    null,
  );

  function onCanvasDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();

    if (!detailKind) {
      return;
    }

    const rawTemplate = event.dataTransfer.getData(
      "application/workflow-template",
    );

    if (!rawTemplate) {
      return;
    }

    const template = JSON.parse(rawTemplate) as EventTemplate;

    if (template.kind !== detailKind) {
      return;
    }

    const position = flowInstance
      ? flowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
      : { x: 120, y: 120 };

    const newEventId = onAddEventFromTemplate(
      detailKind,
      workflow.id,
      template,
      {
        x: position.x - 180,
        y: position.y - 70,
      },
    );

    if (pendingConnection?.operator) {
      onAddLink(
        pendingConnection.kind,
        pendingConnection.workflowId,
        pendingConnection.sourceId,
        newEventId,
        pendingConnection.operator,
      );
      setPendingConnection(null);
    }

    setPendingPaneAdd(null);
  }

  function openPaneAddPicker(event: ReactMouseEvent<Element>) {
    if (suppressNextPaneClickRef.current) {
      suppressNextPaneClickRef.current = false;
      return;
    }

    if (!detailKind || !flowInstance) {
      return;
    }

    const position = flowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    setPendingConnection(null);
    setPendingPaneAdd({
      x: event.clientX,
      y: event.clientY,
      position: {
        x: position.x - 180,
        y: position.y - 70,
      },
      kind: detailKind,
      workflowId: workflow.id,
      search: "",
    });
  }

  function addNodeFromPanePicker(template: EventTemplate) {
    if (!pendingPaneAdd) {
      return;
    }

    onAddEventFromTemplate(
      pendingPaneAdd.kind,
      pendingPaneAdd.workflowId,
      template,
      pendingPaneAdd.position,
    );

    setPendingPaneAdd(null);
  }

  function openConnectionFlow(
    event: MouseEvent | TouchEvent,
    sourceId: string,
  ) {
    if (!detailKind) {
      return;
    }

    const pointer =
      "changedTouches" in event && event.changedTouches.length > 0
        ? event.changedTouches[0]
        : "clientX" in event
          ? event
          : null;

    if (!pointer) {
      return;
    }

    setPendingPaneAdd(null);
    setPendingConnection({
      x: pointer.clientX,
      y: pointer.clientY,
      sourceId,
      operator: null,
      kind: detailKind,
      workflowId: workflow.id,
      search: "",
    });
  }

  function connectToTemplate(template: EventTemplate) {
    const connection = pendingConnection;

    if (!connection?.operator || !flowInstance) {
      return;
    }

    const position = flowInstance.screenToFlowPosition({
      x: connection.x + 260,
      y: connection.y,
    });

    onAddConnectedEventFromTemplate(
      connection.kind,
      connection.workflowId,
      connection.sourceId,
      {
        ...template,
        kind: connection.kind,
      },
      {
        x: position.x,
        y: position.y - 70,
      },
      connection.operator,
    );

    setPendingConnection(null);
  }

  const overviewFlow = useMemo(() => {
    const nodes: Node<SummaryNodeData>[] = [
      {
        id: "inputs",
        type: "summary",
        position: { x: 120, y: 180 },
        data: {
          title: `Inputs (${workflow.inputEvents.length})`,
          subtitle: "Click to edit input events",
          accent: "input",
          onOpen: onOpenInputEvents,
        },
      },
      {
        id: "outputs",
        type: "summary",
        position: { x: 560, y: 180 },
        data: {
          title: `Outputs (${workflow.outputEvents.length})`,
          subtitle: "Click to edit output actions",
          accent: "output",
          onOpen: onOpenOutputEvents,
        },
      },
    ];

    const edges: Edge[] = [
      {
        id: "inputs-to-outputs",
        source: "inputs",
        target: "outputs",
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: 3 },
      },
    ];

    return { nodes, edges };
  }, [
    onOpenInputEvents,
    onOpenOutputEvents,
    workflow.inputEvents.length,
    workflow.outputEvents.length,
  ]);

  const detailFlow = useMemo(() => {
    if (!detailKind) {
      return { nodes: [], edges: [] };
    }

    const events =
      detailKind === "input" ? workflow.inputEvents : workflow.outputEvents;
    const links =
      detailKind === "input" ? workflow.inputLinks : workflow.outputLinks;

    const nodes: Node<EventNodeData>[] = events.map((event) => ({
      id: event.id,
      type: "event",
      position: event.position,
      data: {
        event,
        onToggle: (eventId) => onToggleEvent(detailKind, workflow.id, eventId),
        onDelete: (eventId) => onDeleteEvent(detailKind, workflow.id, eventId),
      },
    }));

    const edges: Edge[] = links.map((link) => ({
      id: link.id,
      source: link.sourceId,
      target: link.targetId,
      label: link.operator,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 2 },
    }));

    return { nodes, edges };
  }, [
    detailKind,
    onDeleteEvent,
    onToggleEvent,
    workflow.id,
    workflow.inputEvents,
    workflow.inputLinks,
    workflow.outputEvents,
    workflow.outputLinks,
  ]);

  const activeFlow =
    viewName === "workflow-overview" ? overviewFlow : detailFlow;

  useEffect(() => {
    if (!flowInstance || activeFlow.nodes.length === 0) {
      return;
    }

    window.requestAnimationFrame(() => {
      flowInstance.fitView({ padding: 0.25, duration: 120 });
    });
  }, [activeFlow.nodes.length, flowInstance, viewName]);

  const isChoosingConnectionOperator =
    pendingConnection !== null && pendingConnection.operator === null;

  const pickerTemplates = templates.filter((template) =>
    template.label
      .toLowerCase()
      .includes(pendingConnection?.search.toLowerCase() ?? ""),
  );

  const panePickerTemplates = templates.filter((template) =>
    template.label
      .toLowerCase()
      .includes(pendingPaneAdd?.search.toLowerCase() ?? ""),
  );

  return (
    <>
      <div
        className="node-flow-stage"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onCanvasDrop}
      >
        <ReactFlow
          style={{ width: "100%", height: "100%", background: "#07111f" }}
          nodes={activeFlow.nodes}
          edges={activeFlow.edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable
          connectionMode={ConnectionMode.Loose}
          connectOnClick={false}
          proOptions={{ hideAttribution: true }}
          onInit={setFlowInstance}
          onPaneClick={openPaneAddPicker}
          onConnectStart={(_, _params: OnConnectStartParams) => {
            suppressNextPaneClickRef.current = true;
            setPendingConnection(null);
            setPendingPaneAdd(null);
          }}
          onConnectEnd={(event, connectionState) => {
            suppressNextPaneClickRef.current = true;

            if (!connectionState.fromNode) {
              window.setTimeout(() => {
                suppressNextPaneClickRef.current = false;
              }, 0);
              return;
            }

            openConnectionFlow(event, connectionState.fromNode.id);

            window.setTimeout(() => {
              suppressNextPaneClickRef.current = false;
            }, 0);
          }}
          onNodeDragStop={(_, node) => {
            if (!detailKind) {
              return;
            }

            onUpdateEventPosition(
              detailKind,
              workflow.id,
              node.id,
              node.position,
            );
          }}
        >
          <Background color="#334155" gap={18} />
          <Controls />
        </ReactFlow>
      </div>

      {pendingPaneAdd ? (
        <div
          className="event-picker"
          style={{ left: pendingPaneAdd.x, top: pendingPaneAdd.y }}
        >
          <div className="event-picker__title">
            Add{" "}
            {pendingPaneAdd.kind === "input" ? "input event" : "output action"}
          </div>

          <input
            autoFocus
            value={pendingPaneAdd.search}
            placeholder="Search event templates..."
            onChange={(event) =>
              setPendingPaneAdd((current) =>
                current ? { ...current, search: event.target.value } : current,
              )
            }
          />

          <div className="event-picker__list">
            {panePickerTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => addNodeFromPanePicker(template)}
              >
                <strong>{template.label}</strong>
                <span>{template.description}</span>
              </button>
            ))}

            {panePickerTemplates.length === 0 ? (
              <div className="event-picker__empty">
                No matching event templates.
              </div>
            ) : null}
          </div>

          <button
            className="event-picker__cancel"
            type="button"
            onClick={() => setPendingPaneAdd(null)}
          >
            Cancel
          </button>
        </div>
      ) : null}

      {pendingConnection ? (
        <div
          className="event-picker"
          style={{ left: pendingConnection.x, top: pendingConnection.y }}
        >
          {isChoosingConnectionOperator ? (
            <>
              <div className="event-picker__title">Choose condition</div>
              <div className="condition-picker__grid">
                {conditionKinds.map((operator) => (
                  <button
                    key={operator}
                    type="button"
                    onClick={() =>
                      setPendingConnection((current) =>
                        current ? { ...current, operator } : current,
                      )
                    }
                  >
                    {operator}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="event-picker__title">
                Connect with {pendingConnection.operator}
              </div>

              <input
                autoFocus
                value={pendingConnection.search}
                placeholder="Search event templates..."
                onChange={(event) =>
                  setPendingConnection((current) =>
                    current
                      ? { ...current, search: event.target.value }
                      : current,
                  )
                }
              />

              <div className="event-picker__list">
                {pickerTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => connectToTemplate(template)}
                  >
                    <strong>{template.label}</strong>
                    <span>{template.description}</span>
                  </button>
                ))}

                {pickerTemplates.length === 0 ? (
                  <div className="event-picker__empty">
                    No matching event templates.
                  </div>
                ) : null}
              </div>
            </>
          )}

          <button
            className="event-picker__cancel"
            type="button"
            onClick={() => setPendingConnection(null)}
          >
            Cancel
          </button>
        </div>
      ) : null}
    </>
  );
}
