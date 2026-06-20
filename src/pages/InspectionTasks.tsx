import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Eye,
  Building2,
  Flame,
  Trees,
  Lightbulb,
  DoorOpen,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  InspectionTask,
  InspectionTaskStatus,
  InspectionCategory,
  INSPECTION_CATEGORIES,
  INSPECTION_TASK_STATUSES,
  INSPECTION_TASK_STATUS_LABEL,
} from '@/types';
import { getCycleLabel } from '@/utils';
import { cn } from '@/lib/utils';
import Empty from '@/components/Empty';
import InspectionTaskDetailModal from '@/components/InspectionTaskDetailModal';

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

const STATUS_BADGE: Record<InspectionTaskStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export default function InspectionTasks() {
  const inspectionTasks = useAppStore((s) => s.inspectionTasks);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<InspectionTaskStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<InspectionCategory | ''>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);

  const filteredTasks = useMemo(() => {
    let result = [...inspectionTasks];
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    if (categoryFilter) result = result.filter((t) => t.category === categoryFilter);
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [inspectionTasks, statusFilter, categoryFilter]);

  const stats = useMemo(
    () => ({
      total: inspectionTasks.length,
      pending: inspectionTasks.filter((t) => t.status === 'pending').length,
      inProgress: inspectionTasks.filter((t) => t.status === 'in_progress').length,
      completed: inspectionTasks.filter((t) => t.status === 'completed').length,
      abnormal: inspectionTasks.reduce(
        (sum, t) => sum + t.items.filter((i) => i.result === 'abnormal').length,
        0
      ),
    }),
    [inspectionTasks]
  );

  const handleViewDetail = (task: InspectionTask) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-serif flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-primary-700" />
            公区巡检记录
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            查看所有巡检任务的执行情况与异常转单记录
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <p className="text-gray-500 text-xs">巡检任务</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{stats.total}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-500 text-xs">待巡检</p>
            <p className="text-xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-500 text-xs">巡检中</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-500 text-xs">已完成</p>
            <p className="text-xl font-bold text-green-600 mt-1">{stats.completed}</p>
          </div>
          <div className="card p-4">
            <p className="text-gray-500 text-xs">累计异常</p>
            <p className="text-xl font-bold text-red-600 mt-1">{stats.abnormal}</p>
          </div>
        </div>

        <div className="card p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">任务状态</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InspectionTaskStatus | '')}
                className="select-field"
              >
                <option value="">全部状态</option>
                {INSPECTION_TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {INSPECTION_TASK_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">巡检类别</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as InspectionCategory | '')}
                className="select-field"
              >
                <option value="">全部类别</option>
                {INSPECTION_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="py-16">
              <Empty />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">任务号</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">巡检计划</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">类别</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">周期</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">区域</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">巡检员</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">进度</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTasks.map((task) => {
                    const CatIcon = CATEGORY_ICON[task.category];
                    const checked = task.items.filter((i) => i.result !== 'pending').length;
                    const total = task.items.length;
                    const abnormal = task.items.filter((i) => i.result === 'abnormal').length;
                    return (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-sm text-gray-900">{task.taskNo}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-medium text-gray-800">{task.planName}</span>
                          <span className="text-xs text-gray-400 block">{task.scheduledDate}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium', CATEGORY_COLOR[task.category])}>
                            <CatIcon className="w-3.5 h-3.5" />
                            {task.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600">{getCycleLabel(task.cycle)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600 inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {task.area}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm text-gray-600">{task.assigneeName || '—'}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  abnormal > 0 ? 'bg-red-500' : 'bg-green-500'
                                )}
                                style={{ width: `${total ? (checked / total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{checked}/{total}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn('badge', STATUS_BADGE[task.status])}>
                            {INSPECTION_TASK_STATUS_LABEL[task.status]}
                          </span>
                          {abnormal > 0 && (
                            <span className="badge bg-red-100 text-red-700 ml-1 inline-flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              {abnormal}
                            </span>
                          )}
                          {task.status === 'completed' && abnormal === 0 && (
                            <CheckCircle2 className="w-4 h-4 text-green-500 inline ml-1" />
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => navigate(`/inspection/mobile?task=${task.id}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                                开始巡检
                              </button>
                            )}
                            {task.status === 'in_progress' && (
                              <button
                                onClick={() => navigate(`/inspection/mobile?task=${task.id}`)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                继续巡检
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetail(task)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              详情
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <InspectionTaskDetailModal
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />
    </div>
  );
}
