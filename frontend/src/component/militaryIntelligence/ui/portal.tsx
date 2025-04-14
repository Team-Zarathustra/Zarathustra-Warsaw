// components/military-intelligence/ui/Portal.tsx
import React from 'react';
import ReactDOM from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
}

const Portal: React.FC<PortalProps> = ({ children }) => {
  // Make sure this component is only rendered on the client
  if (typeof document === 'undefined') {
    return null;
  }
  
  const portalRoot = document.body;
  
  return ReactDOM.createPortal(
    children,
    portalRoot
  );
};

export default Portal;