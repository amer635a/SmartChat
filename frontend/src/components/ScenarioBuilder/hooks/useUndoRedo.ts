import { useCallback, useRef } from 'react';
import type { FlowNode, FlowEdge } from '../../../types/flowTypes';

interface Snapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const MAX_HISTORY = 50;

export function useUndoRedo(
  getNodes: () => FlowNode[],
  getEdges: () => FlowEdge[],
  setNodes: (nodes: FlowNode[]) => void,
  setEdges: (edges: FlowEdge[]) => void,
) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);

  // Call this before any change to save the current state
  const takeSnapshot = useCallback(() => {
    past.current = [
      ...past.current.slice(-(MAX_HISTORY - 1)),
      { nodes: structuredClone(getNodes()), edges: structuredClone(getEdges()) },
    ];
    future.current = [];
  }, [getNodes, getEdges]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push({
      nodes: structuredClone(getNodes()),
      edges: structuredClone(getEdges()),
    });
    setNodes(prev.nodes);
    setEdges(prev.edges);
  }, [getNodes, getEdges, setNodes, setEdges]);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    past.current.push({
      nodes: structuredClone(getNodes()),
      edges: structuredClone(getEdges()),
    });
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [getNodes, getEdges, setNodes, setEdges]);

  return { takeSnapshot, undo, redo };
}
