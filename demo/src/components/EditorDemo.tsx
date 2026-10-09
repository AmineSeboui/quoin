import { BlockCanvas, type QuoinBlock } from 'quoin-editor';
import { RotateCcw } from 'lucide-react';
import { blockTypes } from '../blockTypes';

type Props = {
  blocks: QuoinBlock[];
  revision: number;
  onChange: (blocks: QuoinBlock[]) => void;
  onReset: () => void;
};

export function EditorDemo({ blocks, revision, onChange, onReset }: Props) {
  return (
    <div className="editor-frame">
      <div className="editor-hints">
        <span><kbd>/</kbd> opens the palette</span>
        <span>Drag the handle to reorder</span>
        <span>Click a block to edit it</span>
        <button type="button" className="text-button" onClick={onReset}>
          <RotateCcw size={14} aria-hidden />
          Reset
        </button>
      </div>
      <BlockCanvas
        key={revision}
        blocks={blocks}
        onChange={onChange}
        blockTypes={blockTypes}
        aria-label="Live Quoin editor"
      />
    </div>
  );
}
