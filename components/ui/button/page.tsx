import { cn } from "@/lib/utils"
import { Button as ShadcnButton, buttonVariants } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ButtonProps extends Omit<React.ComponentProps<typeof ShadcnButton>, 'variant'> {
  variant?: "primary" | "secondary" | "success" | "warning" | "destructive" | "ghost" | "default" | "outline" | "link"
  size?: "default" | "sm" | "lg"
  isLoading?: boolean
  Icon?: React.ComponentType<{ className?: string }>
}

export function Button({
  className,
  variant = "primary",
  size = "default",
  isLoading = false,
  Icon,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = "font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl focus-visible:outline-none focus-visible:ring-2"

  const variants = {
    primary: "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 border-transparent hover:shadow-green-500/25 focus-visible:ring-green-500/50",
    secondary: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 border-transparent hover:shadow-orange-500/25 focus-visible:ring-orange-500/50",
    success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-transparent",
    warning: "bg-gradient-to-r from-amber-400 to-yellow-400 text-forest-900 hover:from-amber-500 hover:to-yellow-500 border-transparent font-semibold",
    destructive: "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 border-transparent",
    ghost: "bg-white/80 hover:bg-green-50 border-2 border-green-200 hover:border-green-300 backdrop-blur-sm text-green-700 hover:text-green-900 shadow-md",
    default: "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 border-transparent hover:shadow-green-500/25 focus-visible:ring-green-500/50",
    outline: "border-2 border-green-600 text-green-600 hover:bg-green-50 hover:border-green-700 hover:text-green-700",
    link: "text-green-600 hover:text-green-700 underline-offset-4 hover:underline"
  }

  const sizes = {
    default: "h-12 px-6 py-3 rounded-xl",
    sm: "h-10 px-4 py-2 rounded-lg text-sm",
    lg: "h-14 px-8 py-4 rounded-2xl text-lg"
  }

  return (
    <ShadcnButton
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5 mr-2" />
      ) : null}
      {children}
    </ShadcnButton>
  )
}
