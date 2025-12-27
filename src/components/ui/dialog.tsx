import * as React from "react";

type DialogSize = "sm" | "md" | "lg";

type DialogBaseProps = {
  children: React.ReactNode;
  className?: string;
};

export const Dialog = ({
  open,
  onOpenChange,
  children,
  size = "lg",
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  size?: DialogSize;
}) => {
  if (!open) return null;

  const sizeClass =
    size === "sm"
      ? "w-[95vw] max-w-[600px]"
      : size === "md"
      ? "w-[90vw] max-w-[800px]"
      : "w-[85vw] max-w-[1000px]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => onOpenChange?.(false)}
    >
      <div
        className={`
          bg-white rounded-lg shadow-lg
          ${sizeClass}
          max-h-[90vh]
          overflow-y-auto
          overflow-x-hidden
          p-6
          box-border
          flex flex-col
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

/* ================= CONTENT ================= */

export const DialogContent = ({
  children,
  className = "",
}: DialogBaseProps) => (
  <div className={`flex-1 overflow-x-hidden ${className}`}>
    {children}
  </div>
);

/* ================= HEADER ================= */

export const DialogHeader = ({
  children,
  className = "",
}: DialogBaseProps) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

/* ================= TITLE ================= */

export const DialogTitle = ({
  children,
  className = "",
}: DialogBaseProps) => (
  <h3 className={`text-xl font-semibold mb-2 ${className}`}>
    {children}
  </h3>
);

/* ================= FOOTER ================= */

export const DialogFooter = ({
  children,
  className = "",
}: DialogBaseProps) => (
  <div
    className={`
      flex justify-end gap-2 mt-6
      sticky bottom-0
      bg-white pt-4 border-t
      ${className}
    `}
  >
    {children}
  </div>
);
