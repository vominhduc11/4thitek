import { useRef, useLayoutEffect, useCallback } from "react";
import { toDigitsOnly, formatNumberInput } from "./constants";

export function useNumericFormatter(value: string, onChange: (digits: string) => void) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caretRef.current === null) return;
    const input = inputRef.current;
    if (!input) return;
    const caret = caretRef.current;
    caretRef.current = null;
    input.setSelectionRange(caret, caret);
  }, [value]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const digits = toDigitsOnly(rawValue);
    const formatted = formatNumberInput(digits);

    const originalSelectionStart = input.selectionStart ?? 0;
    let newSelectionStart = originalSelectionStart;

    const rawSub = rawValue.substring(0, originalSelectionStart);
    const rawDigitsSub = toDigitsOnly(rawSub);
    const rawDotsCount = rawSub.length - rawDigitsSub.length;

    let formattedSubLength = 0;
    let digitsFound = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (formatted[i] !== ".") {
        digitsFound++;
      }
      formattedSubLength = i + 1;
      if (digitsFound >= rawDigitsSub.length) {
        break;
      }
    }
    const newDotsCount = formattedSubLength - digitsFound;
    newSelectionStart += (newDotsCount - rawDotsCount);

    caretRef.current = Math.max(0, newSelectionStart);
    onChange(digits);
  }, [onChange]);

  return {
    inputRef,
    handleInputChange,
  };
}
export default useNumericFormatter;
