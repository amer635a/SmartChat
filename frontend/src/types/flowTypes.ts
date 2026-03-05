import type { Node, Edge } from '@xyflow/react';

export interface FlowNodeData extends Record<string, unknown> {
  nodeType: 'start' | 'run_script' | 'ask_choice' | 'ask_input' | 'end' | 'goto' | 'call_scenario';
  // label — used as a goto target identifier
  label?: string;
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
  // goto fields
  target?: string;
  // call_scenario fields
  target_scenario?: string;
}

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;
