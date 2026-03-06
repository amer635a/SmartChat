import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function GotoNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`flow-node flow-node-goto${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#743a8e' }}>{'\u21AA'} Go To</div>
      <div className="node-label">{(data.target as string) ? `→ ${data.target}` : 'No target set'}</div>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
