import { X, Building2, Flame, Trees, Lightbulb, DoorOpen, MapPin, Clock, User, CheckCircle2, XCircle, Circle, AlertTriangle, FileText } from 'lucide-react';
import { useAppStore } from '@/store';
import {
  InspectionTask,
  InspectionCategory,
  InspectionItemResult,
  INSPECTION_TASK_STATUS_LABEL,
} from '@/types';
import { formatDateTime, getCycleLabel } from '@/utils';
import { cn } from '@/lib/utils';

interface InspectionTaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: InspectionTask | null;
}

const CATEGORY_ICON: Record<InspectionCategory, React.ComponentType<{ className?: string }>> = {
  '电梯': Building2,
  '消防': Flame,
  '绿化': Trees,
  '照明': Lightbulb,
  '门禁': DoorOpen,
};

const CATEGORY_COLOR: Record<InspectionCategory, string> = {
  '电梯': 'bg-blue-100 text-blue-700',
  '消防': 'bg-red-100 text-red-700',
  '绿化': 'bg-green-100 text-green-700',
  '照明': 'bg-amber-100 text-amber-700',
  '门禁': 'bg-purple-100 text-purple-700',
};

const RESULT_META: Record<InspectionItemResult, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: '待检', cls: 'bg-gray-100 text-gray-600', Icon: Circle },
  normal: { label: '正常', cls: 'bg-green-100 text-green-700', Icon: CheckCircle2 },
  abnormal: { label: '异常', cls: 'bg-red-100 text-red-700', Icon: XCircle },
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function InspectionTaskDetailModal({ isOpen, onClose, task }: InspectionTaskDetailModalProps) {
  const orders = useAppStore((s) => s.orders);

  if (!isOpen || !task) return null;

  const CatIcon = CATEGORY_ICON[task.category];
  const convertedOrders = task.convertedOrderIds
    .map((id) => orders.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => !!o);

  const stats = {
    total: task.items.length,
    normal: task.items.filter((i) => i.result === 'normal').length,
    abnormal: task.items.filter((i) => i.result === 'abnormal').length,
    pending: task.items.filter((i) => i.result === 'pending').length,
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', CATEGORY_COLOR[task.category])}>
              <CatIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {task.planName}
                <span className="font-mono text-xs text-gray-400 font-normal">{task.taskNo}</span>
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">公区巡检任务详情</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">巡检类别</p>
              <p className="font-medium text-gray-700 flex items-center gap-1">
                <CatIcon className="w-4 h-4" />
                {task.category}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">推送周期</p>
              <p className="font-medium text-gray-700">{getCycleLabel(task.cycle)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">计划日期</p>
              <p className="font-medium text-gray-700">{task.scheduledDate}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">任务状态</p>
              <span className={cn('badge', STATUS_BADGE[task.status])}>
                {INSPECTION_TASK_STATUS_LABEL[task.status]}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 col-span-2">
              <p className="text-gray-400 text-xs mb-1">巡检区域</p>
              <p className="font-medium text-gray-700 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                {task.area}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">巡检员</p>
              <p className="font-medium text-gray-700 flex items-center gap-1">
                <User className="w-4 h-4 text-gray-400" />
                {task.assigneeName || '未指派'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-gray-400 text-xs mb-1">完成时间</p>
              <p className="font-medium text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-400" />
                {task.completedAt ? formatDateTime(task.completedAt) : '-'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-0.5">巡检项</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.normal}</p>
              <p className="text-xs text-gray-500 mt-0.5">正常</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.abnormal}</p>
              <p className="text-xs text-gray-500 mt-0.5">异常</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-500">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-0.5">待检</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">巡检项明细</h3>
            <div className="space-y-2">
              {task.items.map((it, idx) => {
                const meta = RESULT_META[it.result];
                return (
                  <div
                    key={it.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border',
                      it.result === 'abnormal'
                        ? 'border-red-200 bg-red-50/50'
                        : 'border-gray-100 bg-white'
                    )}
                  >
                    <span className="text-sm text-gray-400 mt-0.5 w-5">{idx + 1}.</span>
                    <meta.Icon
                      className={cn(
                        'w-5 h-5 mt-0.5 flex-shrink-0',
                        it.result === 'normal' && 'text-green-500',
                        it.result === 'abnormal' && 'text-red-500',
                        it.result === 'pending' && 'text-gray-300'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{it.name}</p>
                      {it.result === 'abnormal' && it.remark && (
                        <p className="text-xs text-red-600 mt-1 break-words">异常说明：{it.remark}</p>
                      )}
                    </div>
                    <span className={cn('badge flex-shrink-0', meta.cls)}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {task.remark && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">巡检备注</p>
              <p className="text-sm text-gray-700">{task.remark}</p>
            </div>
          )}

          {convertedOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                异常转报修单 ({convertedOrders.length})
              </h3>
              <div className="space-y-2">
                {convertedOrders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-lg border border-amber-200 bg-amber-50/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-primary-700">{o.orderNo}</span>
                      <span className="badge bg-amber-100 text-amber-700">{o.status}</span>
                    </div>
                    <p className="text-sm text-gray-700 flex items-start gap-1">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      {o.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
