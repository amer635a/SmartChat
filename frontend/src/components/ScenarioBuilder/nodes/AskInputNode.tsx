import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function AskInputNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`flow-node flow-node-ask-input${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#2ecc71' }}>Ask Input</div>
      <div className="node-label">{(data.question as string) || 'No question set'}</div>
      {data.input_key && (
        <div className="node-detail">Key: <code>{data.input_key as string}</code></div>
      )}
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
