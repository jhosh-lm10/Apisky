import { renderHook, act } from '@testing-library/react';
import { useMessages } from '@/hooks/useMessages';
import { messagesService } from '@/services/api';

describe('useMessages hook', () => {
  it('calls messagesService.sendMessage', async () => {
    const spy = jest.spyOn(messagesService, 'sendMessage').mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMessages());

    let response;
    await act(async () => {
      response = await result.current.sendMessage({ content: 'Hi', channel: 'wa', recipients: ['1'] });
    });

    expect(spy).toHaveBeenCalled();
    expect(response).toEqual({ success: true });
  });
});
