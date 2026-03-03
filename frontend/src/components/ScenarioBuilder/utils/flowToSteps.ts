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

  function buildChain(startId: string): Step[] {
    const steps: Step[] = [];
    let currentId: string | undefined = startId;

    while (currentId) {
      const node = nodeMap.get(currentId);
      if (!node || node.type === 'start') break;

      const d = node.data;

      if (d.nodeType === 'run_script') {
        steps.push({
          action: 'run_script',
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
          question: d.question,
          options,
          branches: Object.keys(branches).length ? branches : undefined,
        });
        break; // ask_choice has no default 'out' edge

      } else if (d.nodeType === 'ask_input') {
        steps.push({
          action: 'ask_input',
          question: d.question,
          input_key: d.input_key,
          validation: d.validation,
        });
        currentId = outMap.get(`${currentId}:out`);

      } else if (d.nodeType === 'end') {
        steps.push({
          action: 'end',
          message: d.message,
        });
        break;

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
