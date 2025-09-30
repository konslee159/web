"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

const CustomInput = React.forwardRef(({ className, type = "text", value, onChange, ...props }, ref) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      className={cn(
        "w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        "disabled:bg-gray-100 disabled:cursor-not-allowed",
        "placeholder:text-gray-400",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

CustomInput.displayName = "CustomInput"

export { CustomInput }
