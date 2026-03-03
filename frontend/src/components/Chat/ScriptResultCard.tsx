import './Chat.css';

interface Props {
  content: string;
  displayMessage?: string;
}

export function ScriptResultCard({ content, displayMessage }: Props) {
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    // Not JSON, render as plain text
  }

  return (
    <div className="script-result-card">
      {displayMessage && <div className="result-label">{displayMessage}</div>}
      {parsed ? (
        <table className="result-table">
          <tbody>
            {Object.entries(parsed).map(([key, value]) => (
              <tr key={key}>
                <td className="result-key">{key.replace(/_/g, ' ')}</td>
                <td className="result-value">{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <pre className="result-text">{content}</pre>
      )}
    </div>
  );
}
