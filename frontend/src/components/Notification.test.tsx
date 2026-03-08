/**
 * Unit tests for Notification (ToastNotification) component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastNotification from './Notification';

describe('Notification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render message', () => {
    render(<ToastNotification message="Success message" type="success" />);
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should have role alert and data-testid for success', () => {
    render(<ToastNotification message="Done" type="success" />);
    const alert = screen.getByTestId('success-notification');
    expect(alert).toHaveAttribute('role', 'alert');
  });

  it('should have data-testid for error type', () => {
    render(<ToastNotification message="Error" type="error" />);
    expect(screen.getByTestId('error-notification')).toBeInTheDocument();
  });

  it('should have data-testid for warning and info types', () => {
    const { unmount } = render(<ToastNotification message="Warning" type="warning" />);
    expect(screen.getByTestId('warning-notification')).toBeInTheDocument();
    unmount();
    render(<ToastNotification message="Info" type="info" />);
    expect(screen.getByTestId('info-notification')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <ToastNotification message="Close me" type="info" onClose={onClose} />
    );
    const closeButton = screen.getByLabelText('Close notification');
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should hide and call onClose after duration', async () => {
    const onClose = jest.fn();
    render(
      <ToastNotification
        message="Auto close"
        type="success"
        duration={1000}
        onClose={onClose}
      />
    );
    expect(screen.getByText('Auto close')).toBeInTheDocument();
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should use longer duration for error type', async () => {
    const onClose = jest.fn();
    render(
      <ToastNotification
        message="Error stays longer"
        type="error"
        duration={5000}
        onClose={onClose}
      />
    );
    jest.advanceTimersByTime(5000);
    expect(onClose).not.toHaveBeenCalled();
    jest.advanceTimersByTime(5000); // error uses 10000 ms
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
