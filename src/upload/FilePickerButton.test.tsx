import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilePickerButton } from './FilePickerButton';

describe('FilePickerButton', () => {
  it('clears the input after a pick so the same file can be chosen again', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<FilePickerButton label="Pick" onPick={onPick} />);
    const input = screen.getByLabelText('Pick') as HTMLInputElement;
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await user.upload(input, file);
    expect(onPick).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
  });
});
