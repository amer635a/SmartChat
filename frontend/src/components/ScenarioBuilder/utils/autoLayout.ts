import type { FlowNode, FlowEdge } from '../../../types/flowTypes';

const NODE_HEIGHT = 100;
const V_GAP = 60;
const H_GAP = 300;

export function applyLayout(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  // Build adjacency: nodeId → list of { targetId, sourceHandle }
  const children = new Map<string, { targetId: string; sourceHandle: string | null | undefined }[]>();
  for (const edge of edges) {
    if (!children.has(edge.source)) children.set(edge.source, []);
    children.get(edge.source)!.push({ targetId: edge.target, sourceHandle: edge.sourceHandle });
  }

  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  function layout(nodeId: string, x: number, y: number) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    positions.set(nodeId, { x, y });

    const outs = children.get(nodeId) ?? [];
    const nextY = y + NODE_HEIGHT + V_GAP;

    if (outs.length === 0) return;

    if (outs.length === 1) {
      layout(outs[0].targetId, x, nextY);
    } else {
      // Fan branches out horizontally
      const totalWidth = (outs.length - 1) * H_GAP;
      const startX = x - totalWidth / 2;
      outs.forEach((out, i) => {
        layout(out.targetId, startX + i * H_GAP, nextY);
      });
    }
  }

  const startNode = nodes.find(n => n.type === 'start');
  if (startNode) layout(startNode.id, 400, 50);

  return nodes.map(node => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
}
