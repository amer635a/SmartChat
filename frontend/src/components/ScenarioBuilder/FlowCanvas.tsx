import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ConnectionLineType,
  MarkerType,
  useReactFlow,
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

function InnerCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onEdgesUpdate,
  onNodeClick,
  onPaneClick,
}: Props) {
  const { fitView } = useReactFlow();
  const prevIds = useRef<string | null>(null);
  const edgesRef = useRef(edges);
  edgesRef.current = edges;

  useEffect(() => {
    const ids = nodes.map(n => n.id).sort().join(',');
    const isInitial = prevIds.current === null;
    const changed = ids !== prevIds.current;
    const prevLen = prevIds.current?.split(',').filter(Boolean).length ?? 0;
    const bulkChange = Math.abs(nodes.length - prevLen) > 1;
    prevIds.current = ids;

    if (nodes.length > 0 && (isInitial || (changed && bulkChange))) {
      // Use double rAF to ensure React Flow has measured and rendered nodes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitView({ padding: 0.4, duration: 200 });
        });
      });
    }
  }, [nodes, fitView]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: FlowEdge = {
        ...connection,
        id: uuidv4(),
        source: connection.source,
        target: connection.target,
        type: 'draggable',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#b0b4c0' },
        data: { bendPoints: [] },
      };
      onEdgesUpdate([...edgesRef.current, newEdge]);
    },
    [onEdgesUpdate]
  );

  return (
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
        markerEnd: { type: MarkerType.ArrowClosed, color: '#b0b4c0' },
        data: { bendPoints: [] },
      }}
      connectionLineType={ConnectionLineType.SmoothStep}
      connectionRadius={30}
      connectOnClick
      fitView
      fitViewOptions={{ padding: 0.4, minZoom: 0.6, maxZoom: 1.8 }}
      minZoom={0.3}
      maxZoom={2}
      deleteKeyCode="Delete"
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} color="#d0d4da" gap={20} size={1.5} />
      <Controls />
      <MiniMap
        nodeColor={(node) => {
          const colors: Record<string, string> = {
            start: '#ED1C24',
            run_script: '#3498db',
            ask_choice: '#e67e22',
            ask_input: '#2ecc71',
            goto: '#9b59b6',
            call_scenario: '#1abc9c',
            end: '#e74c3c',
          };
          return colors[node.type ?? ''] ?? '#b0b4c0';
        }}
        maskColor="rgba(245, 246, 250, 0.85)"
        style={{ background: '#ffffff', border: '1px solid #e0e3e8', borderRadius: '8px' }}
      />
    </ReactFlow>
  );
}

export function FlowCanvas(props: Props) {
  return (
    <div className="flow-canvas-container">
      <ReactFlowProvider>
        <InnerCanvas {...props} />
      </ReactFlowProvider>
    </div>
  );
}
