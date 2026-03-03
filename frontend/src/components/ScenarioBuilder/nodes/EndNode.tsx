import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function EndNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`flow-node flow-node-end${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#e74c3c' }}>End</div>
      <div className="node-label">{(data.message as string) || 'Conversation ends'}</div>
    </div>
  );
}
