import toast from 'react-hot-toast';

export function showSuccessToast(message: string) {
  toast.success(message, {
    duration: 3000,
    position: 'bottom-right',
  });
}

export function showErrorToast(message: string) {
  toast.error(message, {
    duration: 4000,
    position: 'bottom-right',
  });
}

export function showInfoToast(message: string) {
  toast(message, {
    duration: 3000,
    position: 'bottom-right',
    icon: 'ℹ️',
  });
}

export function showLoadingToast(message: string) {
  return toast.loading(message, {
    position: 'bottom-right',
  });
}

export function dismissToast(toastId: string) {
  toast.dismiss(toastId);
}
