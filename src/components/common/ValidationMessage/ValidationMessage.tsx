import './ValidationMessage.css';

interface ValidationMessageProps {
  message?: string | null;
  type?: 'error' | 'warning' | 'success' | 'info';
  className?: string;
}

const ValidationMessage = ({ message, type = 'error', className = '' }: ValidationMessageProps) => {
  if (!message) return null;

  const classNames = `validation-message validation-message--${type} ${className}`.trim();

  return (
    <div className={classNames} role="alert">
      {message}
    </div>
  );
};

export default ValidationMessage;
