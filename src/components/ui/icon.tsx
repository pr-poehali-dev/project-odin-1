import { icons, type LucideProps } from "lucide-react"

interface IconProps extends LucideProps {
  name: string
  fallback?: string
}

export default function Icon({ name, fallback = "CircleAlert", ...props }: IconProps) {
  const LucideIcon = icons[name as keyof typeof icons] || icons[fallback as keyof typeof icons]
  if (!LucideIcon) return null
  return <LucideIcon {...props} />
}
