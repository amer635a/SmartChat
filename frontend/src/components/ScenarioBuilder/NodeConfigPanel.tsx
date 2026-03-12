import { useState } from 'react';
import type { FlowNode, FlowNodeData } from '../../types/flowTypes';
import type { ScenarioSummary, ScriptInfo } from '../../types/scenario';
import { FilePicker } from './FilePicker';

interface Props {
  node: FlowNode | null;
  scripts: ScriptInfo[];
  scenarios: ScenarioSummary[];
  onUpdateNode: (id: string, data: FlowNodeData) => void;
  onDeleteNode: (id: string) => void;
}

export function NodeConfigPanel({ node, scripts, scenarios, onUpdateNode, onDeleteNode }: Props) {
  if (!node) {
    return (
      <div className="node-config-panel node-config-empty">
        <div>
          <p>Click a node to configure it</p>
          <p style={{ fontSize: '0.75rem', marginTop: 8, color: 'var(--text-dim)' }}>
            Drag from a handle to connect nodes
          </p>
        </div>
      </div>
    );
  }

  const d = node.data;

  const update = (partial: Partial<FlowNodeData>) => {
    onUpdateNode(node.id, { ...d, ...partial } as FlowNodeData);
  };

  const nodeTitles: Record<string, string> = {
    start: 'Entry Point',
    run_script: 'Run Script',
    run_script_branch: 'Run Script & Branch',
    ask_choice: 'Ask Choice',
    ask_input: 'Ask Input',
    end: 'End',
    goto: 'Go To',
    call_scenario: 'Call Scenario',
  };

  return (
    <div className="node-config-panel">
      <div className="config-panel-header">
        <span className="config-panel-type">{nodeTitles[d.nodeType] ?? d.nodeType}</span>
        {d.nodeType !== 'start' && (
          <button className="btn-remove" onClick={() => onDeleteNode(node.id)}>Delete</button>
        )}
      </div>

      {d.nodeType === 'start' && (
        <p className="config-hint">This is the entry point. Connect it to your first step.</p>
      )}

      {d.nodeType === 'run_script' && (
        <RunScriptConfig data={d} scripts={scripts} onChange={update} />
      )}

      {d.nodeType === 'run_script_branch' && (
        <RunScriptBranchConfig data={d} scripts={scripts} onChange={update} />
      )}

      {d.nodeType === 'ask_choice' && (
        <AskChoiceConfig data={d} onChange={update} />
      )}

      {d.nodeType === 'ask_input' && (
        <AskInputConfig data={d} onChange={update} />
      )}

      {d.nodeType === 'end' && (
        <EndConfig data={d} onChange={update} />
      )}

      {d.nodeType === 'goto' && (
        <GotoConfig data={d} onChange={update} />
      )}

      {d.nodeType === 'call_scenario' && (
        <CallScenarioConfig data={d} scenarios={scenarios} onChange={update} />
      )}

    </div>
  );
}

function RunScriptConfig({
  data,
  scripts,
  onChange,
}: {
  data: FlowNodeData;
  scripts: ScriptInfo[];
  onChange: (p: Partial<FlowNodeData>) => void;
}) {
  const mode = data.command !== undefined ? 'command' : 'script';
  const [showBrowser, setShowBrowser] = useState(false);
  const args = data.args ?? {};
  const argEntries = Object.entries(args);

  const switchMode = (newMode: string) => {
    if (newMode === 'command') {
      onChange({ script: undefined, command: data.command ?? '' });
    } else {
      onChange({ command: undefined, script: data.script ?? '' });
    }
  };

  const updateArg = (index: number, newKey: string, newValue: string) => {
    const entries = [...argEntries];
    entries[index] = [newKey, newValue];
    const newArgs: Record<string, string> = {};
    for (const [k, v] of entries) newArgs[k] = v;
    onChange({ args: Object.keys(newArgs).length ? newArgs : undefined });
  };

  const removeArg = (index: number) => {
    const entries = [...argEntries];
    entries.splice(index, 1);
    const newArgs: Record<string, string> = {};
    for (const [k, v] of entries) newArgs[k] = v;
    onChange({ args: Object.keys(newArgs).length ? newArgs : undefined });
  };

  return (
    <>
      <div className="config-field">
        <label>Mode</label>
        <select
          className="builder-select"
          value={mode}
          onChange={e => switchMode(e.target.value)}
        >
          <option value="script">Python Script</option>
          <option value="command">Shell Command</option>
        </select>
      </div>

      {mode === 'script' && (
        <div className="config-field">
          <label>Script</label>
          <select
            className="builder-select"
            value={data.script ?? ''}
            onChange={e => onChange({ script: e.target.value || undefined })}
          >
            <option value="">-- Select script --</option>
            {scripts.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {mode === 'command' && (
        <div className="config-field">
          <label>Command</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              className="builder-input"
              style={{ flex: 1 }}
              value={data.command ?? ''}
              onChange={e => onChange({ command: e.target.value || undefined })}
              placeholder="e.g. ls -la /tmp"
            />
            <button className="btn-browse" onClick={() => setShowBrowser(true)}>Browse</button>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '4px 0 0' }}>
            Use <code style={{ background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 3 }}>{'${key}'}</code> for arg substitution
          </p>
        </div>
      )}
      <div className="config-field">
        <label>Display Message</label>
        <input
          className="builder-input"
          value={data.display_message ?? ''}
          onChange={e => onChange({ display_message: e.target.value || undefined })}
          placeholder="Message before result"
        />
      </div>
      <div className="config-field">
        <label>Arguments</label>
        {argEntries.map(([key, value], i) => (
          <div key={i} className="arg-row">
            <input
              className="builder-input arg-key"
              value={key}
              onChange={e => updateArg(i, e.target.value, value)}
              placeholder="key"
            />
            <input
              className="builder-input"
              value={value}
              onChange={e => updateArg(i, key, e.target.value)}
              placeholder="$input.key or value"
            />
            <button className="btn-remove" onClick={() => removeArg(i)}>x</button>
          </div>
        ))}
        <button
          className="btn-add"
          onClick={() => onChange({ args: { ...args, '': '' } })}
        >
          + Add Arg
        </button>
      </div>

      {showBrowser && (
        <FilePicker
          onSelect={(path) => {
            if (mode === 'command') {
              onChange({ command: path });
            } else {
              onChange({ script: path });
            }
            setShowBrowser(false);
          }}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </>
  );
}

function RunScriptBranchConfig({
  data,
  scripts,
  onChange,
}: {
  data: FlowNodeData;
  scripts: ScriptInfo[];
  onChange: (p: Partial<FlowNodeData>) => void;
}) {
  const args = data.args ?? {};
  const argEntries = Object.entries(args);

  const updateArg = (index: number, newKey: string, newValue: string) => {
    const entries = [...argEntries];
    entries[index] = [newKey, newValue];
    const newArgs: Record<string, string> = {};
    for (const [k, v] of entries) newArgs[k] = v;
    onChange({ args: Object.keys(newArgs).length ? newArgs : undefined });
  };

  const removeArg = (index: number) => {
    const entries = [...argEntries];
    entries.splice(index, 1);
    const newArgs: Record<string, string> = {};
    for (const [k, v] of entries) newArgs[k] = v;
    onChange({ args: Object.keys(newArgs).length ? newArgs : undefined });
  };

  return (
    <>
      <div className="config-field">
        <label>Script</label>
        <select
          className="builder-select"
          value={data.script ?? ''}
          onChange={e => onChange({ script: e.target.value || undefined })}
        >
          <option value="">-- Select script --</option>
          {scripts.map(s => (
            <option key={s.name} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>
      <div className="config-field">
        <label>Display Message</label>
        <input
          className="builder-input"
          value={data.display_message ?? ''}
          onChange={e => onChange({ display_message: e.target.value || undefined })}
          placeholder="Message before result"
        />
      </div>
      <div className="config-field">
        <label>Branch Field</label>
        <input
          className="builder-input"
          value={data.branch_field ?? ''}
          onChange={e => onChange({ branch_field: e.target.value || undefined })}
          placeholder="e.g. success"
        />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '4px 0 0' }}>
          JSON field in script result to check. If truthy → "success" branch, if falsy → "fail" branch.
        </p>
      </div>
      <div className="config-field">
        <label>Arguments</label>
        {argEntries.map(([key, value], i) => (
          <div key={i} className="arg-row">
            <input
              className="builder-input arg-key"
              value={key}
              onChange={e => updateArg(i, e.target.value, value)}
              placeholder="key"
            />
            <input
              className="builder-input"
              value={value}
              onChange={e => updateArg(i, key, e.target.value)}
              placeholder="$input.key or value"
            />
            <button className="btn-remove" onClick={() => removeArg(i)}>x</button>
          </div>
        ))}
        <button
          className="btn-add"
          onClick={() => onChange({ args: { ...args, '': '' } })}
        >
          + Add Arg
        </button>
      </div>
    </>
  );
}

function AskChoiceConfig({
  data,
  onChange,
}: {
  data: FlowNodeData;
  onChange: (p: Partial<FlowNodeData>) => void;
}) {
  const options = data.options ?? [];

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `opt_${Date.now()}`;

  const updateOption = (index: number, val: string) => {
    const updated = [...options];
    // Auto-generate value from label so every handle gets a unique id
    updated[index] = { label: val, value: slugify(val) };
    onChange({ options: updated });
  };

  const removeOption = (index: number) => {
    onChange({ options: options.filter((_, i) => i !== index) });
  };

  const addOption = () => {
    const idx = options.length;
    onChange({ options: [...options, { label: '', value: `opt_${idx}` }] });
  };

  return (
    <>
      <div className="config-field">
        <label>Question</label>
        <input
          className="builder-input"
          value={data.question ?? ''}
          onChange={e => onChange({ question: e.target.value || undefined })}
          placeholder="What would you like to do?"
        />
      </div>
      <div className="config-field">
        <label>Options</label>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '0 0 8px' }}>
          Each option creates an output handle. Connect it to the next node.
        </p>
        {options.map((opt, i) => (
          <div key={opt.value || i} className="option-row">
            <input
              className="builder-input"
              value={opt.label}
              onChange={e => updateOption(i, e.target.value)}
              placeholder="e.g. Yes / No"
            />
            <button className="btn-remove" onClick={() => removeOption(i)}>x</button>
          </div>
        ))}
        <button className="btn-add" onClick={addOption}>+ Add Option</button>
      </div>
    </>
  );
}

function AskInputConfig({
  data,
  onChange,
}: {
  data: FlowNodeData;
  onChange: (p: Partial<FlowNodeData>) => void;
}) {
  return (
    <>
      <div className="config-field">
        <label>Question</label>
        <input
          className="builder-input"
          value={data.question ?? ''}
          onChange={e => onChange({ question: e.target.value || undefined })}
          placeholder="What is the user's email?"
        />
      </div>
      <div className="config-field">
        <label>Input Key</label>
        <input
          className="builder-input"
          value={data.input_key ?? ''}
          onChange={e => onChange({ input_key: e.target.value || undefined })}
          placeholder="e.g., user_email"
        />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '4px 0 0' }}>
          Use as <code style={{ background: 'var(--bg-elevated)', padding: '1px 4px', borderRadius: 3 }}>$input.user_email</code> in script args
        </p>
      </div>
      <div className="config-field">
        <label>Validation</label>
        <select
          className="builder-select"
          value={data.validation ?? ''}
          onChange={e => onChange({ validation: e.target.value || undefined })}
        >
          <option value="">None</option>
          <option value="email">Email</option>
          <option value="integer">Integer</option>
          <option value="url">URL</option>
        </select>
      </div>
    </>
  );
}

function EndConfig({
  data,
  onChange,
}: {
  data: FlowNodeData;
  onChange: (p: Partial<FlowNodeData>) => void;
}) {
  return (
    <div className="config-field">
      <label>End Message</label>
      <input
        className="builder-input"
        value={data.message ?? ''}
        onChange={e => onChange({ message: e.target.value || undefined })}
        placeholder="Goodbye message..."
      />
    </div>
  );
}

function CallScenarioConfig({
  data,
  scenarios,
  onChange,
}: {
  data: FlowNodeData;
  scenarios: ScenarioSummary[];
  onChange: (p: Partial<FlowNodeData>) => void;
}) {
  return (
    <div className="config-field">
      <label>Target Scenario</label>
      <select
        className="builder-select"
        value={data.target_scenario ?? ''}
        onChange={e => onChange({ target_scenario: e.target.value || undefined })}
      >
        <option value="">-- Select scenario --</option>
        {scenarios.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '4px 0 0' }}>
        When reached, execution transfers to the selected scenario.
      </p>
    </div>
  );
}

function GotoConfig({
  data,
  onChange,
}: {
  data: FlowNodeData;
  onChange: (p: Partial<FlowNodeData>) => void;
}) {
  return (
    <>
      <div className="config-field">
        <label>Target Label</label>
        <input
          className="builder-input"
          value={data.target ?? ''}
          onChange={e => onChange({ target: e.target.value || undefined })}
          placeholder="e.g. ask_again"
        />
        <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', margin: '4px 0 0' }}>
          Enter the label of the node to jump to. Or connect the Go To output to the target node directly.
        </p>
      </div>
      <p className="config-hint">
        Tip: Set a label on the target node first, then enter that label here.
      </p>
    </>
  );
}
