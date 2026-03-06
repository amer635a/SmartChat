import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function CallScenarioNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`flow-node flow-node-call-scenario${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#11806d' }}>{'\u2197'} Call Scenario</div>
      <div className="node-label">
        {(data.target_scenario as string) ? `→ ${data.target_scenario}` : 'No scenario set'}
      </div>
    </div>
  );
}
