import React, { useState, useRef, useEffect } from 'react';

interface FilterDropdownProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  options: { value: string; label: string }[];
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ currentFilter, onFilterChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptionLabel = options.find(option => option.value === currentFilter)?.label || '';

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleOptionClick = (value: string) => {
    onFilterChange(value);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="filter-dropdown-container" ref={dropdownRef}>
      <button type="button" className="filter-dropdown-button" onClick={handleToggle}>
        {selectedOptionLabel}
        <span className="filter-dropdown-arrow">&#9660;</span> {/* Down arrow */}
      </button>

      {isOpen && (
        <ul className="filter-dropdown-list">
          {options.map((option) => (
            <li
              key={option.value}
              className={`filter-dropdown-item ${option.value === currentFilter ? 'active' : ''}`}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FilterDropdown;