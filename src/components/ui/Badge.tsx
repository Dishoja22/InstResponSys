import { cn } from '../../lib/utils';

type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
type Status = 'Pending' | 'In Progress' | 'Resolved' | 'Closed' | 'Rejected';

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const styles = {
    URGENT: 'bg-[rgba(239,68,68,0.1)] text-accent-red border-[rgba(239,68,68,0.3)]',
    HIGH: 'bg-[rgba(245,158,11,0.1)] text-accent-amber border-[rgba(245,158,11,0.3)]',
    MEDIUM: 'bg-[rgba(59,130,246,0.1)] text-accent-blue border-[rgba(59,130,246,0.3)]',
    LOW: 'bg-[rgba(107,114,128,0.1)] text-text-muted border-[rgba(107,114,128,0.3)]',
  };

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-wide uppercase", styles[priority], className)}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const styles = {
    'Pending': 'bg-[rgba(245,158,11,0.1)] text-accent-amber border-[rgba(245,158,11,0.3)]',
    'In Progress': 'bg-[rgba(59,130,246,0.1)] text-accent-blue border-[rgba(59,130,246,0.3)]',
    'Resolved': 'bg-[rgba(16,185,129,0.1)] text-accent-green border-[rgba(16,185,129,0.3)]',
    'Closed': 'bg-[rgba(107,114,128,0.1)] text-text-muted border-[rgba(107,114,128,0.3)]',
    'Rejected': 'bg-[rgba(239,68,68,0.1)] text-accent-red border-[rgba(239,68,68,0.3)]',
  };
  
  const dots = {
    'Pending': 'bg-accent-amber',
    'In Progress': 'bg-accent-blue',
    'Resolved': 'bg-accent-green',
    'Closed': 'bg-text-muted',
    'Rejected': 'bg-accent-red',
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 w-fit", styles[status], className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[status])} />
      {status}
    </span>
  );
}
