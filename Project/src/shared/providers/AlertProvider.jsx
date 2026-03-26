import React, { createContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import CustomAlert from '../components/CustomAlert';

export const AlertContext = createContext(null);

export default function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: null,
    onCancel: null,
  });

  const dismiss = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback(({ type, title, message, confirmText, cancelText, onConfirm, onCancel }) => {
    setAlertState({
      visible: true,
      type: type || 'info',
      title: title || '',
      message: message || '',
      confirmText: confirmText || '',
      cancelText: cancelText || '',
      onConfirm: onConfirm || null,
      onCancel: onCancel || null,
    });
  }, []);

  const success = useCallback((title, message, onConfirm) => {
    showAlert({ type: 'success', title, message, onConfirm });
  }, [showAlert]);

  const error = useCallback((title, message, onConfirm) => {
    showAlert({ type: 'error', title, message, onConfirm });
  }, [showAlert]);

  const info = useCallback((title, message, onConfirm) => {
    showAlert({ type: 'info', title, message, onConfirm });
  }, [showAlert]);

  const warning = useCallback((title, message, onConfirm) => {
    showAlert({ type: 'warning', title, message, onConfirm });
  }, [showAlert]);

  const confirm = useCallback((title, message, { onConfirm, onCancel, confirmText, cancelText } = {}) => {
    showAlert({
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    });
  }, [showAlert]);

  const contextValue = useMemo(
    () => ({ showAlert, success, error, info, warning, confirm }),
    [showAlert, success, error, info, warning, confirm],
  );

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
        onDismiss={dismiss}
      />
    </AlertContext.Provider>
  );
}

AlertProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
