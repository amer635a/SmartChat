interface Props {
  onSave: () => void;
  onSaveAndTrain: () => void;
  onDelete?: () => void;
  saving: boolean;
  saveResult: { ok: boolean; message: string } | null;
}

export function ActionBar({ onSave, onSaveAndTrain, onDelete, saving, saveResult }: Props) {
  return (
    <div className="action-bar">
      <button className="btn-save" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
      <button className="btn-save-train" onClick={onSaveAndTrain} disabled={saving}>
        {saving ? 'Saving...' : 'Save & Train'}
      </button>
      {saveResult && (
        <span className={`save-result ${saveResult.ok ? 'success' : 'error'}`}>
          {saveResult.message}
        </span>
      )}
      {onDelete && (
        <button className="btn-delete" onClick={onDelete} disabled={saving}>
          Delete
        </button>
      )}
    </div>
  );
}
