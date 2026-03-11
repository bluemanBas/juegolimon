"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-earth-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`border border-earth-200 rounded-lg px-4 py-2 text-earth-800 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-lemon-400 focus:border-transparent transition-shadow ${
            error ? "border-red-400 focus:ring-red-400" : ""
          } ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
