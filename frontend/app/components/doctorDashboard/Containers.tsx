import React from 'react';

interface DashboardContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div 
      className={`${className}`}
      style={{
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}
    >
      {children}
    </div>
  );
};

export default DashboardContainer;
