import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CustomCardProps extends React.ComponentProps<typeof Card> {
  variant?: "default" | "elevated" | "outline"
}

export function CustomCard({ 
  className, 
  children, 
  variant = "default",
  ...props 
}: CustomCardProps) {
  const baseClasses = "border-2 shadow-lg transition-all duration-300 hover:shadow-xl"
  
  const variants = {
    default: "bg-white border-green-200 hover:border-green-300 hover:bg-green-50",
    elevated: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 shadow-2xl hover:shadow-3xl",
    outline: "bg-white/80 backdrop-blur-sm border-green-200/50 shadow-md hover:border-green-400"
  }

  return (
    <Card 
      className={cn(
        baseClasses,
        variants[variant],
        className
      )} 
      {...props}
    >
      {children}
    </Card>
  )
}

export { CardContent, CardDescription, CardHeader, CardTitle }
