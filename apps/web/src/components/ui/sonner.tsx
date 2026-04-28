import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

function useSystemTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return theme;
}

const Toaster = ({ ...props }: ToasterProps) => {
  const systemTheme = useSystemTheme();

  return (
    <Sonner
      theme={systemTheme}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-icon-xs w-icon-xs" />,
        info: <Info className="h-icon-xs w-icon-xs" />,
        warning: <TriangleAlert className="h-icon-xs w-icon-xs" />,
        error: <OctagonX className="h-icon-xs w-icon-xs" />,
        loading: <LoaderCircle className="h-icon-xs w-icon-xs animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast z-toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-elevated',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-caption',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
