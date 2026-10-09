import { screen, fireEvent } from '@testing-library/react';
import { DocumentStarter } from './DocumentStarter';
import { renderCanvas } from './render-canvas';

function setup() {
  const onStart = vi.fn();
  const onInsertBlock = vi.fn();
  renderCanvas(<DocumentStarter onStart={onStart} onInsertBlock={onInsertBlock} />);
  return { onStart, onInsertBlock, line: screen.getByLabelText('Write something') as HTMLTextAreaElement };
}

describe('DocumentStarter', () => {
  it('turns the first character into a block and keeps nothing itself', () => {
    const { onStart, line } = setup();
    fireEvent.change(line, { target: { value: 'x' } });
    expect(onStart).toHaveBeenCalledWith('x');
    expect(line).toHaveValue('');
  });

  it('opens the palette on a slash keydown without typing it', () => {
    const { line, onStart } = setup();
    fireEvent.keyDown(line, { key: '/' });
    expect(screen.getByPlaceholderText(/search commands/i)).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
  });

  it('opens the palette when a slash arrives as a value change rather than a keydown', () => {
    const { line, onStart } = setup();
    fireEvent.change(line, { target: { value: '/' } });
    expect(screen.getByPlaceholderText(/search commands/i)).toBeInTheDocument();
    expect(line).toHaveValue('');
    expect(onStart).not.toHaveBeenCalled();
  });

  it('seeds a block with the chosen command syntax', () => {
    const { line, onStart } = setup();
    fireEvent.keyDown(line, { key: '/' });
    fireEvent.click(screen.getByText('Subtitle'));
    expect(onStart).toHaveBeenCalledWith('## ', { start: 3, end: 3 });
  });

  it('asks for a block when a block command is chosen', () => {
    const { line, onInsertBlock } = setup();
    fireEvent.keyDown(line, { key: '/' });
    fireEvent.click(screen.getByText('Callout'));
    expect(onInsertBlock).toHaveBeenCalledWith('CALLOUT');
  });

  it("reports the command's own selection alongside its text", () => {
    const { line, onStart } = setup();
    fireEvent.keyDown(line, { key: '/' });
    fireEvent.click(screen.getByText('Code block'));
    expect(onStart).toHaveBeenCalledWith('```\n\n```', { start: 3, end: 3 });
  });

  it('closes on Escape without starting anything', () => {
    const { line, onStart } = setup();
    fireEvent.keyDown(line, { key: '/' });
    fireEvent.keyDown(screen.getByPlaceholderText(/search commands/i), { key: 'Escape' });
    expect(screen.queryByPlaceholderText(/search commands/i)).not.toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
  });
});
