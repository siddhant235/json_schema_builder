import { InputHTMLAttributes, TextareaHTMLAttributes, ChangeEvent } from 'react';
import './Input.css';

type InputPropsBase = {
  type?: 'text' | 'number' | 'email' | 'password' | 'textarea';
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

type InputProps = InputPropsBase & (
  | (Omit<InputHTMLAttributes<HTMLInputElement>, keyof InputPropsBase> & { type?: 'text' | 'number' | 'email' | 'password' })
  | (Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof InputPropsBase> & { type: 'textarea' })
);

const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  label,
  id,
  required = false,
  disabled = false,
  className = '',
  ...props
}: InputProps) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const classNames = `input-wrapper ${error ? 'input-wrapper--error' : ''} ${className}`.trim();

  const isTextarea = type === 'textarea';

  return (
    <div className={classNames}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      {isTextarea ? (
        <textarea
          id={inputId}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="input input--textarea"
          rows={3}
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="input"
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};

export default Input;
