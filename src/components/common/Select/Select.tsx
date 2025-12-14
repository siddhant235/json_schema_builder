import { SelectHTMLAttributes, ChangeEvent } from 'react';
import './Select.css';

type SelectOption = string | { value: string; label: string };

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  placeholder?: string;
  error?: string;
  label?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const Select = ({
  value,
  onChange,
  options = [],
  placeholder,
  error,
  label,
  id,
  required = false,
  disabled = false,
  className = '',
  ...props
}: SelectProps) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const classNames = `select-wrapper ${error ? 'select-wrapper--error' : ''} ${className}`.trim();

  return (
    <div className={classNames}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
          {required && <span className="select-required">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="select"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const optionLabel = typeof option === 'string' ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {error && <span className="select-error">{error}</span>}
    </div>
  );
};

export default Select;
