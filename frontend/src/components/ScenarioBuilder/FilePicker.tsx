import { useState, useEffect } from 'react';
import { API_URLS, fetchApi } from '../../services/api';

interface BrowseResult {
  type: 'directory' | 'file';
  path: string;
  items?: { name: string; path: string; is_dir: boolean }[];
}

interface Props {
  onSelect: (path: string) => void;
  onClose: () => void;
}

export function FilePicker({ onSelect, onClose }: Props) {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<{ name: string; path: string; is_dir: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchApi<BrowseResult>(API_URLS.scenarioBrowse(currentPath))
      .then(data => {
        if (data.type === 'directory') {
          setItems(data.items ?? []);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentPath]);

  return (
    <div className="file-picker-overlay" onClick={onClose}>
      <div className="file-picker" onClick={e => e.stopPropagation()}>
        <div className="file-picker-header">
          <span className="file-picker-title">Select File</span>
          <button className="btn-remove" onClick={onClose}>x</button>
        </div>
        <div className="file-picker-path">{currentPath}</div>
        {error && <div className="file-picker-error">{error}</div>}
        <div className="file-picker-list">
          {loading && <div className="file-picker-loading">Loading...</div>}
          {!loading && items.map(item => (
            <div
              key={item.path}
              className={`file-picker-item ${item.is_dir ? 'is-dir' : 'is-file'}`}
              onClick={() => {
                if (item.is_dir) {
                  setCurrentPath(item.path);
                } else {
                  onSelect(item.path);
                }
              }}
            >
              <span className="file-picker-icon">{item.is_dir ? '📁' : '📄'}</span>
              <span className="file-picker-name">{item.name}</span>
            </div>
          ))}
          {!loading && items.length === 0 && (
            <div className="file-picker-empty">Empty directory</div>
          )}
        </div>
      </div>
    </div>
  );
}
