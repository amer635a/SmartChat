import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function RunScriptBranchNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  const hasCommand = !!(data.command as string);
  const hasScript = !!(data.script as string);
  const badge = hasCommand ? 'Run & Branch' : 'Run Script & Branch';
  const label = hasCommand
    ? (data.command as string)
    : hasScript
      ? (data.script as string)
      : 'No script set';
  const branchField = (data.branch_field as string) || 'success';

  return (
    <div className={`flow-node flow-node-run-script-branch${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#8b5e00' }}>{'\u2699'} {badge}</div>
      <div className="node-label">{label}</div>
      {data.display_message && (
        <div className="node-detail">{data.display_message as string}</div>
      )}
      <div className="node-detail" style={{ fontSize: '0.72rem', opacity: 0.7 }}>
        branch on: {branchField}
      </div>
      <div className="node-branch-handles">
        <div className="branch-label-row">
          <span className="branch-label" style={{ color: '#2e7d32' }}>success</span>
          <span className="branch-label" style={{ color: '#c62828' }}>fail</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="out-success"
        style={{ left: '30%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out-fail"
        style={{ left: '70%' }}
      />
    </div>
  );
}
