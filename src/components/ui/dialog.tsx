import * as React from "react";

export const Dialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="
          bg-white rounded-lg shadow-lg
          w-[85vw] max-w-[1000px]
          max-h-[90vh]
          overflow-y-auto
          overflow-x-hidden
          p-6
          box-border
          flex flex-col
        "
      >
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children, className = "" }: any) => (
  <div
    className={`flex-1 overflow-x-hidden overflow-y-visible ${className}`}
  >
    {children}
  </div>
);

export const DialogHeader = ({ children }: any) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }: any) => (
  <h3 className="text-xl font-semibold mb-2">{children}</h3>
);

export const DialogFooter = ({ children }: any) => (
  <div
    className="
      flex justify-end gap-2 mt-6
      sticky bottom-0
      bg-white pt-4 border-t
    "
  >
    {children}
  </div>
);
