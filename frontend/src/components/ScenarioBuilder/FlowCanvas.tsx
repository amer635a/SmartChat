import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes/nodeTypes';
import { edgeTypes } from './edges/edgeTypes';
import { v4 as uuidv4 } from 'uuid';
import type { FlowNode, FlowEdge } from '../../types/flowTypes';

interface Props {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: OnNodesChange<FlowNode>;
  onEdgesChange: OnEdgesChange<FlowEdge>;
  onEdgesUpdate: (edges: FlowEdge[]) => void;
  onNodeClick: NodeMouseHandler<FlowNode>;
  onPaneClick: () => void;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onEdgesUpdate,
  onNodeClick,
  onPaneClick,
}: Props) {
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: FlowEdge = {
        ...connection,
        id: uuidv4(),
        source: connection.source,
        target: connection.target,
        type: 'draggable',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4a4a8a' },
        data: { bendPoints: [] },
      };
      onEdgesUpdate([...edges, newEdge]);
    },
    [edges, onEdgesUpdate]
  );

  return (
    <div className="flow-canvas-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={() => true}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        defaultEdgeOptions={{
          type: 'draggable',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#4a4a8a' },
          data: { bendPoints: [] },
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.4, minZoom: 0.6, maxZoom: 1.8 }}
        minZoom={0.3}
        maxZoom={2}
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#2a2a4a" gap={20} size={1.5} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              start: '#6c63ff',
              run_script: '#3498db',
              ask_choice: '#e67e22',
              ask_input: '#2ecc71',
              goto: '#9b59b6',
              end: '#e74c3c',
            };
            return colors[node.type ?? ''] ?? '#6a6a9a';
          }}
          maskColor="rgba(10, 10, 30, 0.8)"
          style={{ background: '#0d0d20', border: '1px solid #2a2a4a' }}
        />
      </ReactFlow>
    </div>
  );
}
