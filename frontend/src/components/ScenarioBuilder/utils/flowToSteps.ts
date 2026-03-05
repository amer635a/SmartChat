import type { FlowNode, FlowEdge } from '../../../types/flowTypes';
import type { Step } from '../../../types/scenario';

export function flowToSteps(nodes: FlowNode[], edges: FlowEdge[]): Step[] {
  // Build edge map: "nodeId:handleId" → targetNodeId
  const outMap = new Map<string, string>();
  for (const edge of edges) {
    const key = `${edge.source}:${edge.sourceHandle ?? 'out'}`;
    outMap.set(key, edge.target);
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Build label map: nodeId → label (for goto target resolution)
  const nodeIdToLabel = new Map<string, string>();
  for (const node of nodes) {
    const lbl = node.data.label as string | undefined;
    if (lbl) nodeIdToLabel.set(node.id, lbl);
  }

  const visited = new Set<string>();

  function buildChain(startId: string): Step[] {
    const steps: Step[] = [];
    let currentId: string | undefined = startId;

    while (currentId) {
      if (visited.has(currentId)) break; // prevent cycles
      visited.add(currentId);

      const node = nodeMap.get(currentId);
      if (!node || node.type === 'start') break;

      const d = node.data;
      const label = d.label as string | undefined;

      if (d.nodeType === 'run_script') {
        steps.push({
          action: 'run_script',
          label: label || undefined,
          script: d.script,
          args: d.args,
          display_message: d.display_message,
        });
        currentId = outMap.get(`${currentId}:out`);

      } else if (d.nodeType === 'ask_choice') {
        const options = d.options ?? [];
        const branches: Record<string, Step[]> = {};
        for (const opt of options) {
          const branchStart = outMap.get(`${currentId}:out-${opt.value}`);
          if (branchStart) {
            branches[opt.value] = buildChain(branchStart);
          }
        }
        steps.push({
          action: 'ask_choice',
          label: label || undefined,
          question: d.question,
          options,
          branches: Object.keys(branches).length ? branches : undefined,
        });
        break; // ask_choice has no default 'out' edge

      } else if (d.nodeType === 'ask_input') {
        steps.push({
          action: 'ask_input',
          label: label || undefined,
          question: d.question,
          input_key: d.input_key,
          validation: d.validation,
        });
        currentId = outMap.get(`${currentId}:out`);

      } else if (d.nodeType === 'end') {
        steps.push({
          action: 'end',
          label: label || undefined,
          message: d.message,
        });
        break;

      } else if (d.nodeType === 'goto') {
        // Resolve goto: find what the 'out' edge points to, then look up that node's label
        const targetNodeId = outMap.get(`${currentId}:out`);
        const targetLabel = targetNodeId ? nodeIdToLabel.get(targetNodeId) : (d.target as string);
        steps.push({
          action: 'goto',
          target: targetLabel || (d.target as string) || undefined,
        });
        break; // goto is terminal

      } else {
        break;
      }
    }

    return steps;
  }

  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) return [];

  const firstId = outMap.get(`${startNode.id}:out`);
  if (!firstId) return [];

  return buildChain(firstId);
}
