"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

const CustomTextarea = React.forwardRef(({ className, value, onChange, ...props }, ref) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      className={cn(
        "w-full min-h-[100px] px-3 py-2 text-sm bg-white border border-gray-300 rounded-md resize-none",
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

CustomTextarea.displayName = "CustomTextarea"

export { CustomTextarea }
