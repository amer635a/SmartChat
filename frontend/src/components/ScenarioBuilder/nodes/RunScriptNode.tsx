import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function RunScriptNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`flow-node flow-node-run-script${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#3498db' }}>Run Script</div>
      <div className="node-label">{(data.script as string) || 'No script selected'}</div>
      {data.display_message && (
        <div className="node-detail">{data.display_message as string}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
