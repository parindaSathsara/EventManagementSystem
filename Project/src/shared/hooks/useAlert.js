import { useContext } from 'react';
import { AlertContext } from '../providers/AlertProvider';

/**
 * Hook to show custom alerts from any component.
 *
 * @returns {{ success, error, info, warning, confirm, showAlert }}
 *
 * @example
 *   const alert = useAlert();
 *   alert.success('Done!', 'Your event was created.');
 *   alert.error('Oops', 'Something went wrong.');
 *   alert.info('Heads up', 'New events near you.');
 *   alert.warning('Caution', 'This cannot be undone.');
 *   alert.confirm('Delete?', 'Are you sure?', {
 *     onConfirm: () => handleDelete(),
 *     onCancel: () => {},
 *     confirmText: 'Yes, Delete',
 *     cancelText: 'No',
 *   });
 */
export default function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
