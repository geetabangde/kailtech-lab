import PropTypes from "prop-types";
import { forwardRef } from "react";
import ReactSelect from "react-select";

export const Select = forwardRef(({
  name,
  label,
  options,
  isMulti = false,
  onChange,
  value,
  placeholder = "Select...",
  isDisabled = false,
  isSearchable = true,
  isClearable = true,
  error,
  className = "",
}, ref) => {
  const getValue = () => {
    if (isMulti) {
      const valueList = Array.isArray(value) ? value.map(val => String(val)) : [];
      return options.filter((option) =>
        valueList.includes(String(option.value))
      );
    } else {
      return options.find((option) => String(option.value) === String(value)) || null;
    }
  };

  const handleChange = (selected) => {
    if (isMulti) {
      const selectedValues = selected ? selected.map((item) => item.value) : [];
      onChange(selectedValues);
    } else {
      onChange(selected ? selected.value : null);
    }
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : 'rgb(209 213 219)',
      boxShadow: state.isFocused ? '0 0 0 2px rgb(59 130 246 / 0.5)' : 'none',
      '&:hover': {
        borderColor: error ? '#ef4444' : '#3b82f6'
      },
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      cursor: 'pointer',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      zIndex: 99,
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#1f2937',
      '&:active': {
        backgroundColor: '#3b82f6',
      },
      cursor: 'pointer',
    }),
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <ReactSelect
        ref={ref}
        name={name}
        options={options}
        isMulti={isMulti}
        onChange={handleChange}
        value={getValue()}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isSearchable={isSearchable}
        isClearable={isClearable}
        styles={customStyles}
        classNamePrefix="react-select"
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
});

Select.displayName = "Select";

Select.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string,
  options: PropTypes.array.isRequired,
  isMulti: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.any,
  placeholder: PropTypes.string,
  isDisabled: PropTypes.bool,
  isSearchable: PropTypes.bool,
  isClearable: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
};
