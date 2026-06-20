import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 border-green-200',
    iconClass: 'text-green-500',
    textClass: 'text-green-800',
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50 border-red-200',
    iconClass: 'text-red-500',
    textClass: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 border-amber-200',
    iconClass: 'text-amber-500',
    textClass: 'text-amber-800',
  },
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 border-blue-200',
    iconClass: 'text-blue-500',
    textClass: 'text-blue-800',
  },
};

export default function Toast() {
  const { toasts, removeToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      {toasts.map((toast, index) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-in',
              config.bgClass
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClass)} />
            <p className={cn('flex-1 text-sm leading-relaxed', config.textClass)}>
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className={cn(
                'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors',
                'hover:bg-black/5',
                config.iconClass
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
