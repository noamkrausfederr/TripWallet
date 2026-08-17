import { useEffect, useRef, useState } from 'react';

type AddressSuggestion = { id: string; label: string };

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export default function AddressAutocomplete({ id, value, onChange, required }: Props) {
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectionComplete, setSelectionComplete] = useState(false);
  const requestNumber = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || selectionComplete || value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const currentRequest = ++requestNumber.current;
    const timeout = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ text: value });
        const response = await fetch(`/api/address-autocomplete?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Address lookup failed');
        const data = await response.json();
        if (currentRequest !== requestNumber.current) return;
        setSuggestions(data.results || []);
        setActiveIndex(-1);
      } catch (error: any) {
        if (error.name !== 'AbortError' && currentRequest === requestNumber.current) setSuggestions([]);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [mounted, selectionComplete, value]);

  function chooseSuggestion(suggestion: AddressSuggestion) {
    setSelectionComplete(true);
    onChange(suggestion.label);
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setSuggestions([]);
    }
  }

  const addressInput = (
    <input
      id={id}
      required={required}
      value={value}
      autoComplete="street-address"
      role="combobox"
      aria-autocomplete="list"
      aria-controls={mounted ? `${id}-suggestions` : undefined}
      aria-expanded={mounted && suggestions.length > 0}
      aria-activedescendant={mounted && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
      onChange={(event) => {
        setSelectionComplete(false);
        onChange(event.target.value);
      }}
      onKeyDown={handleKeyDown}
      onBlur={() => window.setTimeout(() => setSuggestions([]), 150)}
    />
  );

  // Keep server and initial browser markup identical, then add suggestions.
  if (!mounted) return addressInput;

  return (
    <div className="address-autocomplete">
      {addressInput}
      {suggestions.length > 0 && (
        <ul id={`${id}-suggestions`} className="address-suggestions" role="listbox" aria-label="Address suggestions">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} role="option" aria-selected={index === activeIndex}>
              <button
                id={`${id}-option-${index}`}
                type="button"
                className={index === activeIndex ? 'is-active' : ''}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseSuggestion(suggestion)}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
