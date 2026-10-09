import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function CodeSample({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="code-sample">
      {label && <span className="code-label">{label}</span>}
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
      <button type="button" className="copy" onClick={copy} aria-label={`Copy ${label ?? 'code'}`}>
        {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </div>
  );
}
