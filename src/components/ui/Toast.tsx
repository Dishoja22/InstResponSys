import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';
import type { ToastVariant } from '../../store/useToastStore';
import { cn } from '../../lib/utils';

const variantConfig: Record<ToastVariant, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
  success: { icon: CheckCircle2, colorClass: 'text-accent-green', bgClass: 'bg-[rgba(16,185,129,0.1)]' },
  error: { icon: AlertCircle, colorClass: 'text-accent-red', bgClass: 'bg-[rgba(239,68,68,0.1)]' },
  warning: { icon: AlertTriangle, colorClass: 'text-accent-amber', bgClass: 'bg-[rgba(245,158,11,0.1)]' },
  info: { icon: Info, colorClass: 'text-accent-blue', bgClass: 'bg-[rgba(59,130,246,0.1)]' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant];
          const Icon = config.icon;
          
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="pointer-events-auto glass-card w-[300px] p-4 relative overflow-hidden group"
            >
              <div className="flex items-start gap-3 relative z-10">
                <div className={cn("p-1 rounded-full shrink-0", config.bgClass, config.colorClass)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 mt-0.5">
                  <h4 className="text-sm font-semibold text-primary">{toast.title}</h4>
                  <p className="text-xs text-muted mt-1 leading-snug truncate">{toast.message}</p>
                </div>
                <button 
                  onClick={() => removeToast(toast.id)}
                  className="text-muted hover:text-primary transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Progress Bar (shrinks over 3.5s) */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 3.5, ease: "linear" }}
                className={cn("absolute bottom-0 left-0 h-[2px] opacity-60", config.bgClass.replace('0.1', '1').replace('bg-', 'bg-'))}
                style={{ backgroundColor: `var(--${toast.variant === 'warning' ? 'accent-amber' : toast.variant === 'error' ? 'accent-red' : toast.variant === 'info' ? 'accent-blue' : 'accent-green'})`}}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
