import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function RunScriptNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  const hasCommand = !!(data.command as string);
  const hasScript = !!(data.script as string);
  const badge = hasCommand ? 'Run Command' : 'Run Script';
  const label = hasCommand
    ? (data.command as string)
    : hasScript
      ? (data.script as string)
      : 'No script or command set';

  return (
    <div className={`flow-node flow-node-run-script${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#3498db' }}>{badge}</div>
      <div className="node-label">{label}</div>
      {data.display_message && (
        <div className="node-detail">{data.display_message as string}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}
