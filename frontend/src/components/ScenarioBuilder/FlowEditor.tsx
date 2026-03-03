import { useCallback, useEffect, useState } from 'react';
import { useNodesState, useEdgesState, type NodeMouseHandler } from '@xyflow/react';
import { MetadataSection } from './MetadataSection';
import { TrainingPhraseEditor } from './TrainingPhraseEditor';
import { ActionBar } from './ActionBar';
import { FlowCanvas } from './FlowCanvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { stepsToFlow } from './utils/stepsToFlow';
import { flowToSteps } from './utils/flowToSteps';
import { applyLayout } from './utils/autoLayout';
import type { Scenario, ScriptInfo } from '../../types/scenario';
import type { FlowNode, FlowEdge, FlowNodeData } from '../../types/flowTypes';
import { v4 as uuidv4 } from 'uuid';
import './FlowEditor.css';

interface Props {
  scenario: Scenario;
  onChange: (s: Scenario) => void;
  scripts: ScriptInfo[];
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
};

export function FlowEditor({ scenario, onChange, scripts, isNew, onSave, onDelete, saving, saveResult }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Re-initialize canvas only when the scenario ID changes (not on metadata edits)
  useEffect(() => {
    const { nodes: rawNodes, edges: rawEdges } = stepsToFlow(scenario.steps);
    const laidOut = applyLayout(rawNodes, rawEdges);
    setNodes(laidOut);
    setEdges(rawEdges);
    setSelectedNodeId(null);
  }, [scenario.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = (andTrain: boolean) => {
    const steps = flowToSteps(nodes, edges);
    onSave({ ...scenario, steps }, andTrain);
  };

  const onNodeClick: NodeMouseHandler<FlowNode> = useCallback((_, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleUpdateNode = useCallback((id: string, data: FlowNodeData) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data } : n));

    // Clean up edges for removed ask_choice options
    if (data.nodeType === 'ask_choice') {
      const validHandles = new Set((data.options ?? []).map((o: { value: string }) => `out-${o.value}`));
      setEdges(eds => eds.filter(e =>
        e.source !== id || validHandles.has(e.sourceHandle ?? '')
      ) as FlowEdge[]);
    }
  }, [setNodes, setEdges]);

  const handleDeleteNode = useCallback((id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id) as FlowEdge[]);
    setSelectedNodeId(null);
  }, [setNodes, setEdges]);

  const handleAddNode = (type: string) => {
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

  return (
    <div className="flow-editor-layout">
      <div className="flow-editor-top">
        <h2 className="form-title">{isNew ? 'Create New Scenario' : `Edit: ${scenario.name}`}</h2>
        <div className="flow-editor-top-sections">
          <MetadataSection scenario={scenario} onChange={onChange} />
          <TrainingPhraseEditor
            phrases={scenario.training_phrases}
            onChange={phrases => onChange({ ...scenario, training_phrases: phrases })}
          />
        </div>
      </div>

      <div className="flow-editor-body">
        <div className="flow-toolbar">
          <span className="flow-toolbar-label">Add Node:</span>
          {[
            { type: 'run_script', label: 'Run Script', color: '#3498db' },
            { type: 'ask_choice', label: 'Ask Choice', color: '#e67e22' },
            { type: 'ask_input', label: 'Ask Input', color: '#2ecc71' },
            { type: 'end', label: 'End', color: '#e74c3c' },
          ].map(({ type, label, color }) => (
            <button
              key={type}
              className="btn-add-node"
              style={{ borderColor: color, color }}
              onClick={() => handleAddNode(type)}
            >
              + {label}
            </button>
          ))}
          <span className="flow-toolbar-hint">
            Connect nodes by dragging from a handle ● to another node
          </span>
        </div>

        <div className="flow-editor-canvas-area">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgesUpdate={setEdges}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
          />
          <NodeConfigPanel
            node={selectedNode}
            scripts={scripts}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
          />
        </div>
      </div>

      <div className="flow-editor-bottom">
        <ActionBar
          onSave={() => handleSave(false)}
          onSaveAndTrain={() => handleSave(true)}
          onDelete={isNew ? undefined : () => onDelete(scenario.id)}
          saving={saving}
          saveResult={saveResult}
        />
      </div>
    </div>
  );
}
