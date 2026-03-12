import type { Step } from '../../../types/scenario';
import type { FlowNode, FlowEdge } from '../../../types/flowTypes';

// Deferred goto edges — resolved after all nodes are created
interface GotoRef {
  sourceNodeId: string;
  targetLabel: string;
}

function convertChain(
  steps: Step[],
  nodes: FlowNode[],
  edges: FlowEdge[],
  gotoRefs: GotoRef[],
  prevNodeId: string,
  prevHandle: string,
  pathPrefix: string
): void {
  let currentPrevId = prevNodeId;
  let currentPrevHandle = prevHandle;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const nodeId = `${pathPrefix}-${i}`;

    if (step.action === 'run_script') {
      nodes.push({
        id: nodeId,
        type: 'run_script',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'run_script',
          label: step.label,
          script: step.script,
          command: step.command,
          args: step.args,
          display_message: step.display_message,
        },
      });
    } else if (step.action === 'run_script_branch') {
      nodes.push({
        id: nodeId,
        type: 'run_script_branch',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'run_script_branch',
          label: step.label,
          script: step.script,
          command: step.command,
          args: step.args,
          display_message: step.display_message,
          branch_field: step.branch_field,
        },
      });
    } else if (step.action === 'ask_choice') {
      nodes.push({
        id: nodeId,
        type: 'ask_choice',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'ask_choice',
          label: step.label,
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
          label: step.label,
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
          label: step.label,
          message: step.message,
        },
      });
    } else if (step.action === 'call_scenario') {
      nodes.push({
        id: nodeId,
        type: 'call_scenario',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'call_scenario',
          target_scenario: step.target_scenario,
        },
      });
    } else if (step.action === 'goto') {
      nodes.push({
        id: nodeId,
        type: 'goto',
        position: { x: 0, y: 0 },
        data: {
          nodeType: 'goto',
          target: step.target,
        },
      });
      // Defer the goto edge — target node might not exist yet
      if (step.target) {
        gotoRefs.push({ sourceNodeId: nodeId, targetLabel: step.target });
      }
    }

    edges.push({
      id: `edge-${currentPrevId}-${currentPrevHandle}-${nodeId}`,
      source: currentPrevId,
      sourceHandle: currentPrevHandle,
      target: nodeId,
      targetHandle: 'in',
    });

    // goto and end are terminal — stop the linear chain
    if (step.action === 'goto' || step.action === 'end') {
      return;
    }

    if (step.action === 'run_script_branch' && step.branches) {
      for (const branchKey of ['success', 'fail']) {
        const branchSteps = step.branches[branchKey];
        if (branchSteps && branchSteps.length > 0) {
          convertChain(branchSteps, nodes, edges, gotoRefs, nodeId, `out-${branchKey}`, `${nodeId}-${branchKey}`);
        }
      }
      return;
    }

    if (step.action === 'ask_choice' && step.branches) {
      for (const option of step.options ?? []) {
        const branchSteps = step.branches[option.value];
        if (branchSteps && branchSteps.length > 0) {
          convertChain(branchSteps, nodes, edges, gotoRefs, nodeId, `out-${option.value}`, `${nodeId}-${option.value}`);
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
  const gotoRefs: GotoRef[] = [];

  const startId = 'node-start';
  nodes.push({
    id: startId,
    type: 'start',
    position: { x: 0, y: 0 },
    data: { nodeType: 'start' },
    deletable: false,
  });

  if (steps.length > 0) {
    convertChain(steps, nodes, edges, gotoRefs, startId, 'out', 'node');
  }

  // Resolve goto edges: find nodes by label and create edges from goto → target
  const labelToNodeId = new Map<string, string>();
  for (const node of nodes) {
    const lbl = node.data.label as string | undefined;
    if (lbl) labelToNodeId.set(lbl, node.id);
  }
  for (const ref of gotoRefs) {
    const targetNodeId = labelToNodeId.get(ref.targetLabel);
    if (targetNodeId) {
      edges.push({
        id: `edge-goto-${ref.sourceNodeId}-${targetNodeId}`,
        source: ref.sourceNodeId,
        sourceHandle: 'out',
        target: targetNodeId,
        targetHandle: 'in',
      });
    }
  }

  return { nodes, edges };
}
