import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { FlowNodeData } from '../../../types/flowTypes';

export function AskChoiceNode({ id, data, selected }: NodeProps<Node<FlowNodeData>>) {
  const options = (data.options as { label: string; value: string }[]) ?? [];
  const updateNodeInternals = useUpdateNodeInternals();

  // Tell React Flow to re-read handle positions whenever options change
  const optionKey = options.map((o, i) => o.value || `idx_${i}`).join(',');
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, optionKey, updateNodeInternals]);

  return (
    <div className={`flow-node flow-node-ask-choice${selected ? ' flow-node-selected' : ''}`}>
      <Handle type="target" position={Position.Top} id="in" />
      <div className="node-type-badge" style={{ color: '#e67e22' }}>Ask Choice</div>
      <div className="node-label">{(data.question as string) || 'No question set'}</div>

      {options.length > 0 && (
        <div className="node-options-list">
          {options.map(opt => (
            <span key={opt.value} className="node-option-chip">{opt.label || opt.value}</span>
          ))}
        </div>
      )}

      {options.length === 0 && (
        <div className="node-detail" style={{ color: '#6a6a9a', fontSize: '0.75rem' }}>
          Add options in config panel →
        </div>
      )}

      {/* Each cell has position:relative so its Handle is anchored to that cell.
          React Flow reads getBoundingClientRect() on each Handle — so each
          handle gets a unique x position (center of its flex cell). */}
      {options.length > 0 && (
        <div className="node-choice-handles">
          {options.map((opt, i) => {
            const handleId = `out-${opt.value || `idx_${i}`}`;
            return (
              <div key={handleId} className="node-choice-handle-cell">
                <span className="node-handle-label">{opt.label || opt.value || `Option ${i + 1}`}</span>
                <Handle
                  type="source"
                  position={Position.Bottom}
                  id={handleId}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
