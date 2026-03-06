import { useCallback, useEffect, useRef, useState } from 'react';
import { useNodesState, useEdgesState, type NodeMouseHandler } from '@xyflow/react';
import { useUndoRedo } from './hooks/useUndoRedo';
import { MetadataSection } from './MetadataSection';
import { TrainingPhraseEditor } from './TrainingPhraseEditor';
import { ActionBar } from './ActionBar';
import { FlowCanvas } from './FlowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { stepsToFlow } from './utils/stepsToFlow';
import { flowToSteps } from './utils/flowToSteps';
import { applyLayout } from './utils/autoLayout';
import type { Scenario, ScenarioSummary, ScriptInfo } from '../../types/scenario';
import type { FlowNode, FlowEdge, FlowNodeData } from '../../types/flowTypes';
import { v4 as uuidv4 } from 'uuid';
import './FlowEditor.css';

interface Props {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
  scripts: ScriptInfo[];
  scenarios: ScenarioSummary[];
  isNew: boolean;
  onSave: (s: Scenario, andTrain: boolean) => void;
  onDelete: (id: string) => void;
  saving: boolean;
  saveResult: { ok: boolean; message: string } | null;
}

const DEFAULT_NODE_DATA: Record<string, FlowNodeData> = {
  run_script: { nodeType: 'run_script' },
  ask_choice: { nodeType: 'ask_choice', options: [] },
  ask_input: { nodeType: 'ask_input' },
  end: { nodeType: 'end' },
  goto: { nodeType: 'goto' },
  call_scenario: { nodeType: 'call_scenario' },
};

export function FlowEditor({ scenario, onChange, scripts, scenarios, isNew, onSave, onDelete, saving, saveResult }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  const getNodes = useCallback(() => nodesRef.current, []);
  const getEdges = useCallback(() => edgesRef.current, []);
  const { takeSnapshot, undo, redo } = useUndoRedo(getNodes, getEdges, setNodes, setEdges);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const layoutKey = `flow-layout-${scenario.id}`;

  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = stepsToFlow(scenario.steps);
    try {
      const saved = localStorage.getItem(`flow-layout-${scenario.id}`);
      if (saved) {
        const layout = JSON.parse(saved) as {
          positions: Record<string, { x: number; y: number }>;
          bendPoints: Record<string, unknown>;
          extraEdges?: FlowEdge[];
        };
        for (const node of rawNodes) {
          if (layout.positions[node.id]) node.position = layout.positions[node.id];
        }
        for (const edge of rawEdges) {
          if (layout.bendPoints[edge.id]) edge.data = { ...edge.data, bendPoints: layout.bendPoints[edge.id] };
        }
        const nodeIds = new Set(rawNodes.map(n => n.id));
        const edgeIds = new Set(rawEdges.map(e => e.id));
        const validExtras = (layout.extraEdges ?? []).filter(
          e => nodeIds.has(e.source) && nodeIds.has(e.target) && !edgeIds.has(e.id)
        );
        setNodes(rawNodes);
        setEdges([...rawEdges, ...validExtras]);
        setSelectedNodeId(null);
        return;
      }
    } catch { /* fall through */ }
    const laidOut = applyLayout(rawNodes, rawEdges);
    setNodes(laidOut);
    setEdges(rawEdges);
    setSelectedNodeId(null);
  }, [scenario.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!scenario.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const positions: Record<string, { x: number; y: number }> = {};
      for (const n of nodes) positions[n.id] = n.position;
      const bendPoints: Record<string, unknown> = {};
      for (const e of edges) {
        const bp = (e.data as Record<string, unknown>)?.bendPoints;
        if (bp) bendPoints[e.id] = bp;
      }
      const { edges: baseEdges } = stepsToFlow(scenario.steps);
      const baseEdgeIds = new Set(baseEdges.map(e => e.id));
      const extraEdges = edges.filter(e => !baseEdgeIds.has(e.id));
      try {
        localStorage.setItem(layoutKey, JSON.stringify({ positions, bendPoints, extraEdges }));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [nodes, edges, scenario.id, layoutKey]);

  const wasDragging = useRef(false);
  const handleNodesChange: typeof onNodesChange = useCallback((changes) => {
    const isDragging = changes.some((c) => c.type === 'position' && c.dragging);
    const hasRemove = changes.some((c) => c.type === 'remove');
    if (hasRemove) takeSnapshot();
    if (isDragging && !wasDragging.current) takeSnapshot();
    wasDragging.current = isDragging;
    onNodesChange(changes);
  }, [onNodesChange, takeSnapshot]);

  const handleEdgesChange: typeof onEdgesChange = useCallback((changes) => {
    const hasRemove = changes.some((c) => c.type === 'remove');
    if (hasRemove) takeSnapshot();
    onEdgesChange(changes);
  }, [onEdgesChange, takeSnapshot]);

  const handleEdgesUpdate = useCallback((newEdges: FlowEdge[]) => {
    takeSnapshot();
    setEdges(newEdges);
  }, [takeSnapshot, setEdges]);

  const [localError, setLocalError] = useState<string | null>(null);

  const handleSave = (andTrain: boolean) => {
    setLocalError(null);
    const steps = flowToSteps(nodes, edges);
    if (steps.length === 0) {
      setLocalError('Connect the Start node to at least one step.');
      return;
    }
    if (!scenario.name.trim()) {
      setLocalError('Scenario name is required.');
      return;
    }
    onSave({ ...scenario, steps }, andTrain);
  };

  const onNodeClick: NodeMouseHandler<FlowNode> = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = useCallback((id: string, data: FlowNodeData) => {
    takeSnapshot();
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data } : n));
    if (data.nodeType === 'ask_choice') {
      const validHandles = new Set((data.options ?? []).map((o: { value: string }) => `out-${o.value}`));
      setEdges(eds => eds.filter(e =>
        e.source !== id || validHandles.has(e.sourceHandle ?? '')
      ) as FlowEdge[]);
    }
  }, [takeSnapshot, setNodes, setEdges]);

  const handleDeleteNode = useCallback((id: string) => {
    takeSnapshot();
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id) as FlowEdge[]);
    setSelectedNodeId(null);
  }, [takeSnapshot, setNodes, setEdges]);

  const handleAddNode = (type: string) => {
    takeSnapshot();
    const nodeId = uuidv4();
    const newNode: FlowNode = {
      id: nodeId,
      type,
      position: { x: 400 + Math.random() * 100 - 50, y: 300 + Math.random() * 100 - 50 },
      data: { ...(DEFAULT_NODE_DATA[type] ?? { nodeType: type as FlowNodeData['nodeType'] }) },
    };
    setNodes(nds => [...nds, newNode]);
    setSelectedNodeId(nodeId);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;

  const nodeButtons = [
    { type: 'run_script', label: 'Script', color: '#3498db' },
    { type: 'ask_choice', label: 'Choice', color: '#e67e22' },
    { type: 'ask_input', label: 'Input', color: '#2ecc71' },
    { type: 'goto', label: 'GoTo', color: '#9b59b6' },
    { type: 'call_scenario', label: 'Call', color: '#1abc9c' },
    { type: 'end', label: 'End', color: '#e74c3c' },
  ];

  return (
    <div className="flow-editor-layout">
      {/* Expanded overlay */}
      {expanded && (
        <div className="flow-expanded-overlay">
          <div className="flow-expanded-header">
            <span className="flow-expanded-title">Flow Editor — {scenario.name || 'Untitled'}</span>
            <button className="btn-close-expanded" onClick={() => setExpanded(false)}>
              Close &times;
            </button>
          </div>
          <div className="flow-toolbar">
            <span className="flow-toolbar-label">Add Node:</span>
            {nodeButtons.map(({ type, label, color }) => (
              <button key={type} className="btn-add-node" style={{ borderColor: color, color }} onClick={() => handleAddNode(type)}>
                + {label}
              </button>
            ))}
          </div>
          <div className="flow-expanded-canvas-area">
            <FlowCanvas nodes={nodes} edges={edges} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onEdgesUpdate={handleEdgesUpdate} onNodeClick={onNodeClick} onPaneClick={onPaneClick} />
            <NodeConfigPanel node={selectedNode} scripts={scripts} scenarios={scenarios} onUpdateNode={handleUpdateNode} onDeleteNode={handleDeleteNode} />
          </div>
          <div className="flow-editor-bottom">
            {localError && <div className="flow-save-error">{localError}</div>}
            <ActionBar onSave={() => handleSave(false)} onSaveAndTrain={() => handleSave(true)} onDelete={isNew ? undefined : () => onDelete(scenario.id)} saving={saving} saveResult={saveResult} />
          </div>
        </div>
      )}

      {/* Main split layout */}
      <div className="flow-split" style={expanded ? { visibility: 'hidden', height: 0, overflow: 'hidden' } : undefined}>
        {/* Left column: metadata + phrases */}
        <div className="flow-split-left">
          <h2 className="form-title">{isNew ? 'New Scenario' : scenario.name}</h2>
          <MetadataSection scenario={scenario} onChange={onChange} />
          <TrainingPhraseEditor
            phrases={scenario.training_phrases}
            onChange={phrases => onChange({ ...scenario, training_phrases: phrases })}
          />
          <div className="flow-split-left-actions">
            {localError && <div className="flow-save-error">{localError}</div>}
            <ActionBar onSave={() => handleSave(false)} onSaveAndTrain={() => handleSave(true)} onDelete={isNew ? undefined : () => onDelete(scenario.id)} saving={saving} saveResult={saveResult} />
          </div>
        </div>

        {/* Right column: toolbar + canvas + config */}
        <div className="flow-split-right">
          <div className="flow-toolbar">
            {nodeButtons.map(({ type, label, color }) => (
              <button key={type} className="btn-add-node" style={{ borderColor: color, color }} onClick={() => handleAddNode(type)}>
                + {label}
              </button>
            ))}
            <div className="toolbar-spacer" />
            <button className="btn-expand-canvas" onClick={() => setExpanded(true)}>Expand</button>
          </div>
          <div className="flow-editor-canvas-area">
            <FlowCanvas nodes={nodes} edges={edges} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onEdgesUpdate={handleEdgesUpdate} onNodeClick={onNodeClick} onPaneClick={onPaneClick} />
            <NodeConfigPanel node={selectedNode} scripts={scripts} scenarios={scenarios} onUpdateNode={handleUpdateNode} onDeleteNode={handleDeleteNode} />
          </div>
        </div>
      </div>
    </div>
  );
}
