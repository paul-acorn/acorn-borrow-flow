import { useEffect } from 'react';

interface UseFormNavigationOptions {
  onSubmit?: () => void;
  canSubmit?: () => boolean;
}

export const useFormNavigation = (
  formRef: React.RefObject<HTMLElement>,
  options?: UseFormNavigationOptions
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!formRef.current) return;
      
      const focusableElements = formRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
      );
      
      const elements = Array.from(focusableElements);
      const currentIndex = elements.findIndex(el => el === document.activeElement);
      
      if (currentIndex === -1) return;
      
      let nextIndex = currentIndex;
      
      if (e.key === 'ArrowDown' || (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA')) {
        e.preventDefault();
        
        // Check if we're on the last field and should submit
        if (e.key === 'Enter' && currentIndex === elements.length - 1) {
          if (options?.onSubmit && (!options?.canSubmit || options.canSubmit())) {
            options.onSubmit();
            return;
          }
        }
        
        nextIndex = currentIndex + 1;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = currentIndex - 1;
      }
      
      if (nextIndex >= 0 && nextIndex < elements.length && nextIndex !== currentIndex) {
        elements[nextIndex].focus();
      }
    };
    
    const form = formRef.current;
    if (form) {
      form.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (form) {
        form.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [formRef, options]);
};
