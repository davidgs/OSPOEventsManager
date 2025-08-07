import React from 'react';
import { Badge } from './badge';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, User } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'general' | 'approval' | 'cfp' | 'event';
  className?: string;
  showIcon?: boolean;
}

const getStatusConfig = (status: string, type: string = 'general') => {
  const normalizedStatus = status?.toLowerCase() || '';

  switch (normalizedStatus) {
    // General statuses
    case 'pending':
      return {
        colors: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
        icon: Clock,
        label: 'Pending'
      };
    case 'approved':
    case 'accepted':
      return {
        colors: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
        icon: CheckCircle,
        label: normalizedStatus === 'approved' ? 'Approved' : 'Accepted'
      };
    case 'rejected':
    case 'declined':
      return {
        colors: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
        icon: XCircle,
        label: normalizedStatus === 'rejected' ? 'Rejected' : 'Declined'
      };
    case 'changes_requested':
    case 'changes requested':
      return {
        colors: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        icon: AlertCircle,
        label: 'Changes Requested'
      };
    case 'in_progress':
    case 'in progress':
      return {
        colors: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: Clock,
        label: 'In Progress'
      };
    case 'completed':
    case 'done':
      return {
        colors: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: CheckCircle,
        label: 'Completed'
      };
    case 'cancelled':
    case 'canceled':
      return {
        colors: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        icon: XCircle,
        label: 'Cancelled'
      };
    case 'draft':
      return {
        colors: 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800',
        icon: FileText,
        label: 'Draft'
      };
    case 'published':
    case 'active':
      return {
        colors: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        icon: CheckCircle,
        label: normalizedStatus === 'published' ? 'Published' : 'Active'
      };
    default:
      return {
        colors: 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        icon: User,
        label: status.charAt(0).toUpperCase() + status.slice(1)
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'general',
  className = '',
  showIcon = true
}) => {
  const config = getStatusConfig(status, type);
  const IconComponent = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.colors} ${showIcon ? 'flex items-center gap-1' : ''} ${className}`}
    >
      {showIcon && <IconComponent className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

export default StatusBadge;