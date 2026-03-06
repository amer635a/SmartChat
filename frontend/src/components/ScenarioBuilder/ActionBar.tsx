import { useEffect, useState } from 'react';

interface Props {
  onSave: () => void;
  onSaveAndTrain: () => void;
  onDelete?: () => void;
  saving: boolean;
  saveResult: { ok: boolean; message: string } | null;
}

export function ActionBar({ onSave, onSaveAndTrain, onDelete, saving, saveResult }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (saveResult) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [saveResult]);

  return (
    <div className="action-bar">
      <button className="btn-save" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button className="btn-save-train" onClick={onSaveAndTrain} disabled={saving}>
        {saving ? 'Saving...' : 'Save & Train'}
      </button>
      {onDelete && (
        <button className="btn-delete" onClick={onDelete} disabled={saving}>
          Delete
        </button>
      )}
      {saveResult && visible && (
        <div className={`save-toast ${saveResult.ok ? 'success' : 'error'}`}>
          <span className="save-toast-icon">{saveResult.ok ? '\u2714' : '\u2716'}</span>
          {saveResult.message}
        </div>
      )}
    </div>
  );
}
