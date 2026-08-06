import { useState } from 'react';
import clsx from 'clsx';
import { CalculatorIcon } from '@heroicons/react/24/outline';

const symbols = [
  "±",
  "°",
  "²",
  "³",
  "Ω",
  "µ",
  "™",
  "≥",
  "≤",
  "•",
  "Δ"
];

export function SymbolToolbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSymbolClick = (symbol) => {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      const value = activeElement.value;

      const newValue = value.substring(0, start) + symbol + value.substring(end);

      // Use native setters to trigger React's synthetic events properly
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

      if (activeElement.tagName === 'INPUT' && nativeInputValueSetter) {
        nativeInputValueSetter.call(activeElement, newValue);
      } else if (activeElement.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(activeElement, newValue);
      } else {
        // Fallback for non-standard inputs
        activeElement.value = newValue;
      }

      // Dispatch event so React onChange handlers fire
      const event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);

      // Restore cursor position
      activeElement.setSelectionRange(start + symbol.length, start + symbol.length);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        onMouseDown={(e) => {
          // Prevent focus loss so `document.activeElement` is preserved
          e.preventDefault();
        }}
        className={clsx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
          isOpen
            ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
            : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-600"
        )}
        title="Special Symbols"
      >
        <CalculatorIcon className="h-5 w-5" />
      </button>

      <div
        className={clsx(
          "flex items-center overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-w-[500px] ml-2 opacity-100" : "max-w-0 ml-0 opacity-0"
        )}
      >
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-hide">
          {symbols.map((symbol) => (
            <button
              key={symbol}
              onClick={(e) => {
                e.preventDefault();
                handleSymbolClick(symbol);
              }}
              onMouseDown={(e) => {
                // Prevent default behavior to keep focus on the currently active input
                e.preventDefault();
              }}
              className={clsx(
                "flex items-center justify-center rounded px-1.5 py-0.5 text-lg font-medium text-gray-700 transition-all bg-transparent border border-transparent",
                "hover:bg-white hover:border-gray-200 hover:shadow-sm hover:text-gray-900 focus:outline-none",
                "dark:text-dark-100 dark:hover:bg-dark-700 dark:hover:border-dark-600 shrink-0 cursor-pointer"
              )}
              title={`Insert ${symbol}`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
