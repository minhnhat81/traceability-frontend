import * as React from "react";

export const Button = ({
  children,
  onClick,
  variant = "default",
  size = "md",
  ...props
}: any) => {
  const base =
    "inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<string, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300",
    outline:
      "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-200",
  };
  const sizes: Record<string, string> = {
    sm: "px-2.5 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };
  return (
    <button
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
