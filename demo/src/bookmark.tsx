import { Bookmark, ExternalLink } from 'lucide-react';
import { defineBlock, type BlockEditorProps, type BlockPreviewProps } from 'quoin-editor';
import { safeHref } from './safeUrl';

type BookmarkData = { url: string; title: string };

function BookmarkEditor({ data, onChange, onDone }: BlockEditorProps<BookmarkData>) {
  return (
    <div className="bm-editor">
      <input
        className="bm-input"
        aria-label="Title"
        placeholder="Title"
        value={data.title}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
      />
      <input
        className="bm-input"
        aria-label="URL"
        placeholder="https://example.com"
        value={data.url}
        onChange={(event) => onChange({ ...data, url: event.target.value })}
      />
      <button type="button" className="bm-done" onClick={onDone}>
        Done
      </button>
    </div>
  );
}

function BookmarkPreview({ data }: BlockPreviewProps<BookmarkData>) {
  if (data.url === '') return <p className="bm-empty">No bookmark yet. Click to add one.</p>;
  const href = safeHref(data.url);
  return (
    <div className="bm-card">
      <Bookmark size={18} aria-hidden />
      <div className="bm-text">
        <strong>{data.title || data.url}</strong>
        <span>{data.url}</span>
      </div>
      {href && (
        <a href={href} target="_blank" rel="noreferrer" aria-label="Open bookmark">
          <ExternalLink size={16} aria-hidden />
        </a>
      )}
    </div>
  );
}

export const bookmark = defineBlock({
  type: 'BOOKMARK',
  label: 'Bookmark',
  icon: Bookmark,
  editor: BookmarkEditor,
  preview: BookmarkPreview,
  initialData: () => ({ url: '', title: '' }),
});
