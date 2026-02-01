import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
  isRecommended?: boolean;
  recommendedText?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

const ChevronIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  searchPlaceholder = 'Поиск...',
  emptyText = 'Ничего не найдено',
  allowEmpty = false,
  emptyLabel = 'Не выбрано',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Separate recommended and regular options
  const recommendedOptions = filteredOptions.filter((o) => o.isRecommended);
  const regularOptions = filteredOptions.filter((o) => !o.isRecommended);

  const handleSelect = (optionValue: string | number | null) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 text-sm text-left bg-white border border-slate-200 rounded-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-slate-900' : 'text-slate-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronIcon />
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto">
            {/* Empty option */}
            {allowEmpty && (
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  value === null ? 'bg-slate-50' : ''
                }`}
              >
                <span className="text-slate-400">{emptyLabel}</span>
                {value === null && (
                  <span className="text-slate-900">
                    <CheckIcon />
                  </span>
                )}
              </button>
            )}

            {/* Recommended options */}
            {recommendedOptions.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-50">
                  Рекомендуемые
                </div>
                {recommendedOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between hover:bg-amber-50 transition-colors ${
                      value === option.value ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-500">
                        <StarIcon />
                      </span>
                      <div>
                        <span className="text-slate-900">{option.label}</span>
                        {option.recommendedText && (
                          <p className="text-xs text-slate-500 mt-0.5">{option.recommendedText}</p>
                        )}
                      </div>
                    </div>
                    {value === option.value && (
                      <span className="text-slate-900">
                        <CheckIcon />
                      </span>
                    )}
                  </button>
                ))}
                {regularOptions.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-50">
                    Другие
                  </div>
                )}
              </>
            )}

            {/* Regular options */}
            {regularOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-2.5 text-sm text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  value === option.value ? 'bg-slate-50' : ''
                }`}
              >
                <span className="text-slate-900">{option.label}</span>
                {value === option.value && (
                  <span className="text-slate-900">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}

            {/* Empty state */}
            {filteredOptions.length === 0 && !allowEmpty && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-400">{emptyText}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
