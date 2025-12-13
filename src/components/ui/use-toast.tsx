import React, { createContext, useContext, useState, useCallback } from "react";

interface ToastData {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextType {
  toast: (data: ToastData) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toastData, setToastData] = useState<ToastData | null>(null);

  const toast = useCallback((data: ToastData) => {
    setToastData(data);
    setTimeout(() => setToastData(null), 3000);
  }, []);

  const color =
    toastData?.variant === "destructive"
      ? "bg-red-600"
      : toastData
      ? "bg-green-600"
      : "";

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toastData && (
        <div
          className={`${color} fixed bottom-4 right-4 text-white px-4 py-3 rounded shadow-lg z-50`}
        >
          <div className="font-semibold">{toastData.title}</div>
          {toastData.description && (
            <div className="text-sm">{toastData.description}</div>
          )}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
