import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoinProvider } from '../context';
import { UploadField } from './UploadField';
import type { UploadFn } from '../types';

function setup(upload?: UploadFn, onUploaded = vi.fn()) {
  const onError = vi.fn();
  render(
    <QuoinProvider value={{ blockTypes: [], upload, onError }}>
      <UploadField category="image" label="Upload image" onUploaded={onUploaded} />
    </QuoinProvider>,
  );
  return { onUploaded, onError };
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
    expect(await screen.findByRole('alert')).toHaveTextContent(/^Images must be under 5 MB\.$/);
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

  it('shows a generic message when the rejection carries an empty message', async () => {
    const user = userEvent.setup();
    setup(vi.fn().mockRejectedValue(new Error('')));
    await user.upload(screen.getByLabelText('Upload image'), file());
    expect(await screen.findByRole('alert')).toHaveTextContent(/^Upload failed\.$/);
  });

  it('shows a generic message when the rejection is not an Error', async () => {
    const user = userEvent.setup();
    setup(vi.fn().mockRejectedValue('boom'));
    await user.upload(screen.getByLabelText('Upload image'), file());
    expect(await screen.findByRole('alert')).toHaveTextContent(/^Upload failed\.$/);
  });

  it('does not report a throwing callback as an upload failure', async () => {
    const user = userEvent.setup();
    const upload = vi.fn().mockResolvedValue({ storageKey: 'k/1', filename: 'photo.png', size: 1 });
    const boom = new Error('callback broke');
    const { onError } = setup(upload, vi.fn().mockImplementation(() => { throw boom; }));
    await user.upload(screen.getByLabelText('Upload image'), file());
    await waitFor(() => expect(onError).toHaveBeenCalledWith(boom));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Upload image')).toBeEnabled();
  });

  it('disables the control and announces progress while an upload is in flight', async () => {
    const user = userEvent.setup();
    let finish: (r: { storageKey: string; filename: string; size: number }) => void = () => {};
    const upload = vi.fn().mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    setup(upload);
    await user.upload(screen.getByLabelText('Upload image'), file());
    expect(screen.getByLabelText('Upload image')).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Uploading...');
    finish({ storageKey: 'k/1', filename: 'photo.png', size: 1 });
    await waitFor(() => expect(screen.getByLabelText('Upload image')).toBeEnabled());
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('clears a previous error when a later upload succeeds', async () => {
    const user = userEvent.setup();
    const upload = vi
      .fn()
      .mockRejectedValueOnce(new Error('first failed'))
      .mockResolvedValueOnce({ storageKey: 'k/1', filename: 'photo.png', size: 1 });
    const { onUploaded } = setup(upload);
    await user.upload(screen.getByLabelText('Upload image'), file());
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    await user.upload(screen.getByLabelText('Upload image'), file());
    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
