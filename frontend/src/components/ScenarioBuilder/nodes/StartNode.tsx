import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function StartNode({ selected }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`flow-node flow-node-start${selected ? ' flow-node-selected' : ''}`}>
      <div className="node-type-badge" style={{ color: '#c0151c' }}>{'\u25B6'} Entry Point</div>
      <div className="node-label">START</div>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
