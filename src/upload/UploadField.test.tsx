import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoinProvider } from '../context';
import { UploadField } from './UploadField';
import type { UploadFn } from '../types';

function setup(upload?: UploadFn) {
  const onUploaded = vi.fn();
  render(
    <QuoinProvider value={{ blockTypes: [], upload }}>
      <UploadField category="image" label="Upload image" onUploaded={onUploaded} />
    </QuoinProvider>,
  );
  return { onUploaded };
}

const file = () => new File(['x'], 'photo.png', { type: 'image/png' });

describe('UploadField', () => {
  it('reports the stored key to the caller on success', async () => {
    const user = userEvent.setup();
    const upload = vi.fn().mockResolvedValue({ storageKey: 'k/1', filename: 'photo.png', size: 1 });
    const { onUploaded } = setup(upload);
    await user.upload(screen.getByLabelText('Upload image'), file());
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith({ storageKey: 'k/1', filename: 'photo.png', size: 1 }));
  });

  it('passes the category through to the host adapter', async () => {
    const user = userEvent.setup();
    const upload = vi.fn().mockResolvedValue({ storageKey: 'k/1', filename: 'photo.png', size: 1 });
    setup(upload);
    await user.upload(screen.getByLabelText('Upload image'), file());
    await waitFor(() => expect(upload).toHaveBeenCalledWith(expect.any(File), 'image'));
  });

  it("shows the adapter's message when the upload rejects", async () => {
    const user = userEvent.setup();
    const upload = vi.fn().mockRejectedValue(new Error('Images must be under 5 MB.'));
    setup(upload);
    await user.upload(screen.getByLabelText('Upload image'), file());
    expect(await screen.findByRole('alert')).toHaveTextContent('Images must be under 5 MB.');
  });

  it('disables itself with an explanation when no upload function is configured', () => {
    setup(undefined);
    expect(screen.getByLabelText('Upload image')).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent(/uploads are not configured/i);
  });

  it('does not call the caller back when the upload rejects', async () => {
    const user = userEvent.setup();
    const upload = vi.fn().mockRejectedValue(new Error('nope'));
    const { onUploaded } = setup(upload);
    await user.upload(screen.getByLabelText('Upload image'), file());
    await screen.findByRole('alert');
    expect(onUploaded).not.toHaveBeenCalled();
  });
});
