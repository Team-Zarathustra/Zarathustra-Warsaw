import { Toast } from '@/component/toast';
import ReactDOM from 'react-dom';

let toastContainer: HTMLDivElement | null = null;

// Create container if it doesn't exist
function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export const toast = {
  success: (message: string) => {
    const container = ensureContainer();
    const toastElement = document.createElement('div');
    container.appendChild(toastElement);

    ReactDOM.render(
      <Toast
        message={message}
        type="success"
        onClose={() => {
          container.removeChild(toastElement);
        }}
      />,
      toastElement
    );
  },
  error: (message: string) => {
    const container = ensureContainer();
    const toastElement = document.createElement('div');
    container.appendChild(toastElement);

    ReactDOM.render(
      <Toast
        message={message}
        type="error"
        onClose={() => {
          container.removeChild(toastElement);
        }}
      />,
      toastElement
    );
  }
};