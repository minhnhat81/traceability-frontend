import React from "react";

export const Toast = ({ message, type }: any) => {
  const color =
    type === "error"
      ? "bg-red-600"
      : type === "success"
      ? "bg-green-600"
      : "bg-gray-700";
  return (
    <div
      className={`${color} fixed bottom-4 right-4 text-white px-4 py-2 rounded shadow-lg`}
    >
      {message}
    </div>
  );
};
