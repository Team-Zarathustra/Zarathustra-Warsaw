import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  optionClassName?: string;
  error?: string;
  label?: string;
  name?: string;
  id?: string;
  required?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  labelClassName = '',
  optionClassName = '',
  error,
  label,
  name,
  id,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
  const selectRef = useRef<HTMLDivElement>(null);

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update internal state when prop value changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleOptionSelect = (option: SelectOption) => {
    if (option.disabled) return;
    
    setSelectedValue(option.value);
    setIsOpen(false);
    
    if (onChange) {
      onChange(option.value);
    }
  };

  const getSelectedLabel = (): string => {
    if (selectedValue) {
      const option = options.find(opt => opt.value === selectedValue);
      return option ? option.label : placeholder;
    }
    return placeholder;
  };

  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label 
          htmlFor={id || name} 
          className={`text-sm font-medium text-gray-700 ${labelClassName}`}
        >
          {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div 
        ref={selectRef} 
        className={`relative ${className}`}
      >
        <div
          className={`
            flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md outline-none
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-gray-400'}
            ${error ? 'border-red-500' : 'border-gray-300'} 
            transition-colors duration-200
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-disabled={disabled}
          id={id || name}
        >
          <span className={`flex-1 truncate ${!selectedValue ? 'text-gray-400' : ''}`}>
            {getSelectedLabel()}
          </span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <ul role="listbox">
              {options.map((option) => (
                <li
                  key={option.value}
                  className={`
                    px-3 py-2 text-sm cursor-pointer
                    ${option.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}
                    ${selectedValue === option.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'}
                    ${optionClassName}
                  `}
                  onClick={() => !option.disabled && handleOptionSelect(option)}
                  role="option"
                  aria-selected={selectedValue === option.value}
                >
                  {option.label}
                </li>
              ))}
              {options.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">No options available</li>
              )}
            </ul>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default Select;