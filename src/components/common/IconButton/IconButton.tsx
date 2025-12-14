import { ReactNode, ButtonHTMLAttributes } from 'react';
import './IconButton.css';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

const IconButton = ({
  icon,
  onClick,
  ariaLabel,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}: IconButtonProps) => {
  const classNames = `icon-btn icon-btn--${variant} icon-btn--${size} ${className}`.trim();

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  );
};

export default IconButton;
