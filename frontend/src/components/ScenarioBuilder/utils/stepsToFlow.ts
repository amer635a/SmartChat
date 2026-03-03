import { v4 as uuidv4 } from 'uuid';
import type { Step } from '../../../types/scenario';
import type { FlowNode, FlowEdge } from '../../../types/flowTypes';

function convertChain(
  steps: Step[],
  nodes: FlowNode[],
  edges: FlowEdge[],
  prevNodeId: string,
  prevHandle: string
): void {
  let currentPrevId = prevNodeId;
  let currentPrevHandle = prevHandle;

  for (const step of steps) {
    const nodeId = uuidv4();

    if (step.action === 'run_script') {
      nodes.push({
        id: nodeId,
        type: 'run_script',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'run_script',
          script: step.script,
          args: step.args,
          display_message: step.display_message,
        },
      });
    } else if (step.action === 'ask_choice') {
      nodes.push({
        id: nodeId,
        type: 'ask_choice',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'ask_choice',
          question: step.question,
          options: step.options ?? [],
        },
      });
    } else if (step.action === 'ask_input') {
      nodes.push({
        id: nodeId,
        type: 'ask_input',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'ask_input',
          question: step.question,
          input_key: step.input_key,
          validation: step.validation,
        },
      });
    } else if (step.action === 'end') {
      nodes.push({
        id: nodeId,
        type: 'end',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'end',
          message: step.message,
        },
      });
    }

    edges.push({
      id: uuidv4(),
      source: currentPrevId,
      sourceHandle: currentPrevHandle,
      target: nodeId,
      targetHandle: 'in',
    });

    if (step.action === 'ask_choice' && step.branches) {
      for (const option of step.options ?? []) {
        const branchSteps = step.branches[option.value];
        if (branchSteps && branchSteps.length > 0) {
          convertChain(branchSteps, nodes, edges, nodeId, `out-${option.value}`);
        }
      }
      // ask_choice has no default 'out' — stop the linear chain
      return;
    }

    currentPrevId = nodeId;
    currentPrevHandle = 'out';
  }
}

export function stepsToFlow(steps: Step[]): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const startId = 'node-start';
  nodes.push({
    id: startId,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { nodeType: 'start' },
    deletable: false,
  });

  if (steps.length > 0) {
    convertChain(steps, nodes, edges, startId, 'out');
  }

  return { nodes, edges };
}
