interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export default function Badge({
  children,
  color = "bg-earth-200 text-earth-700",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}
    >
      {children}
    </span>
  );
}
