import * as React from "react";

type DialogSize = "sm" | "md" | "lg";

export const Dialog = ({
  open,
  onOpenChange,
  children,
  size = "lg", // 👈 mặc định giữ nguyên hành vi cũ
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  size?: DialogSize;
}) => {
  if (!open) return null;

  // ✅ Size mapping – KHÔNG ảnh hưởng modal khác
  const sizeClass =
    size === "sm"
      ? "w-[95vw] max-w-[600px]"
      : size === "md"
      ? "w-[90vw] max-w-[800px]"
      : "w-[85vw] max-w-[1000px]"; // 👈 y hệt code cũ

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

export const DialogContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex-1 overflow-x-hidden ${className}`}>
    {children}
  </div>
);

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4">{children}</div>
);

export const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xl font-semibold mb-2">{children}</h3>
);

export const DialogFooter = ({ children }: { children: React.ReactNode }) => (
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
