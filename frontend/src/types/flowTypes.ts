import type { Node, Edge } from '@xyflow/react';

export interface FlowNodeData extends Record<string, unknown> {
  nodeType: 'start' | 'run_script' | 'ask_choice' | 'ask_input' | 'end';
  // run_script fields
  script?: string;
  args?: Record<string, string>;
  display_message?: string;
  // ask_choice fields
  question?: string;
  options?: { label: string; value: string }[];
  // ask_input fields
  input_key?: string;
  validation?: string;
  // end fields
  message?: string;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;
