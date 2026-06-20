import {
  FilePlus,
  UserCheck,
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { TimelineNode, OrderStatus } from '@/types';
import { formatDateTime, getStatusColor } from '@/utils';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  timeline: TimelineNode[];
}

const statusIconMap: Record<OrderStatus, typeof FilePlus> = {
  '待派单': FilePlus,
  '已派单': UserCheck,
  '已接单': UserCheck,
  '维修中': Wrench,
  '待确认': Clock,
  '已完成': CheckCircle,
  '已取消': XCircle,
};

export default function OrderTimeline({ timeline }: OrderTimelineProps) {
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-primary-900">工单状态流转</h2>
        <p className="text-sm text-gray-500 mt-1">查看工单处理全流程</p>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-primary-100" />

        <div className="space-y-6">
          {sortedTimeline.map((node, index) => {
            const Icon = statusIconMap[node.status] || FilePlus;
            const isLast = index === sortedTimeline.length - 1;

            return (
              <div key={index} className="relative pl-12 group">
                <div
                  className={cn(
                    'absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300',
                    isLast
                      ? 'bg-primary-800 text-white shadow-lg shadow-primary-200'
                      : 'bg-primary-100 text-primary-600 group-hover:bg-primary-200'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div
                  className={cn(
                    'p-4 rounded-xl transition-all duration-300',
                    isLast
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                  )}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'badge border',
                          getStatusColor(node.status)
                        )}
                      >
                        {node.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 hidden sm:block" />
                      <span className="text-sm text-gray-700">
                        操作人：
                        <span className="font-medium text-primary-700">{node.operator}</span>
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDateTime(node.timestamp)}</span>
                  </div>

                  {node.remark && (
                    <p className="mt-2 text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">备注：</span>
                      <span className="flex-1">{node.remark}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
