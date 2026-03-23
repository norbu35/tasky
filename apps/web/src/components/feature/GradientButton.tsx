import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function GradientButton({
  children,
  className,
  isLoading,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <button
      className={cn(
        'w-full py-4 rounded-xl text-white font-bold text-lg uppercase tracking-wide',
        'bg-gradient-to-br from-primary-deep to-primary',
        'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)]',
        'hover:-translate-y-0.5 transition-transform',
        'disabled:opacity-50 disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="mx-auto animate-spin" size={20} /> : children}
    </button>
  );
}
