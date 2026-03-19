import React, { createContext, useContext, useState, useCallback } from "react";

interface InputBarContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const InputBarContext = createContext<InputBarContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function InputBarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <InputBarContext.Provider value={{ isOpen, open, close }}>
      {children}
    </InputBarContext.Provider>
  );
}

export function useInputBar() {
  return useContext(InputBarContext);
}
