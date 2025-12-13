import * as React from "react";

export const Input = React.forwardRef<HTMLInputElement, any>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`border rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
