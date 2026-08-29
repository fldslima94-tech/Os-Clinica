import React from 'react';

interface CurrencyInputProps {
  label: string;
  value: number | string;
  onChange: (val: number) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = '0,00',
  className = '',
  id,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');
    const parsed = parseFloat(raw);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative rounded-xl shadow-2xs">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 select-none">
          R$
        </span>
        <input
          id={id}
          type="number"
          step="0.01"
          min="0"
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value === 0 || value === '0' ? '' : value}
          onChange={handleChange}
          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold text-slate-900 transition-all disabled:bg-slate-100"
        />
      </div>
    </div>
  );
};
