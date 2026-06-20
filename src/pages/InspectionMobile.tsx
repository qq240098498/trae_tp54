import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Circle,
  MapPin,
  ClipboardCheck,
  Send,
  Smartphone,
  Building2,
  Flame,
  Trees,
  Lightbulb,
  DoorOpen,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/store';
import {
  InspectionTask,
  InspectionCategory,
} from '@/types';
import { cn } from '@/lib/utils';

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

export default function InspectionMobile() {
  const {
    inspectionTasks,
    currentUser,
    setInspectionItemResult,
    submitInspectionTask,
  } = useAppStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [taskRemark, setTaskRemark] = useState('');

  const actionableTasks = useMemo(
    () =>
      inspectionTasks
        .filter((t) => t.status !== 'completed')
        .sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (b.status === 'pending' && a.status !== 'pending') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
    [inspectionTasks]
  );

  const todayCount = useMemo(
    () => inspectionTasks.filter((t) => t.status !== 'completed').length,
    [inspectionTasks]
  );

  const selectedTask = inspectionTasks.find((t) => t.id === selectedId) || null;

  const handleSelect = (task: InspectionTask) => {
    setSelectedId(task.id);
    setTaskRemark(task.remark ?? '');
  };

  const handleBack = () => {
    setSelectedId(null);
    setTaskRemark('');
  };

  const handleSetResult = (
    taskId: string,
    itemId: string,
    result: 'normal' | 'abnormal'
  ) => {
    const item = selectedTask?.items.find((i) => i.id === itemId);
    setInspectionItemResult(taskId, itemId, result, item?.remark);
  };

  const handleAbnormalRemark = (taskId: string, itemId: string, value: string) => {
    setInspectionItemResult(taskId, itemId, 'abnormal', value);
  };

  const handleSubmit = () => {
    if (!selectedTask) return;
    const abnormalCount = selectedTask.items.filter((i) => i.result === 'abnormal').length;
    if (abnormalCount > 0) {
      const ok = window.confirm(
        `本次巡检发现 ${abnormalCount} 项异常，提交后将自动转报修单，是否确认提交？`
      );
      if (!ok) return;
    }
    submitInspectionTask(selectedTask.id, currentUser.name, taskRemark || undefined);
    handleBack();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-md bg-gray-50 min-h-screen shadow-xl flex flex-col">
        {selectedTask ? (
          <InspectionSheet
            task={selectedTask}
            taskRemark={taskRemark}
            onRemarkChange={setTaskRemark}
            onBack={handleBack}
            onSetResult={handleSetResult}
            onAbnormalRemark={handleAbnormalRemark}
            onSubmit={handleSubmit}
          />
        ) : (
          <>
            <div className="bg-gradient-to-br from-primary-800 to-primary-600 text-white px-5 pt-6 pb-8">
              <div className="flex items-center gap-2 mb-1">
                <Smartphone className="w-5 h-5" />
                <span className="text-sm text-primary-100">巡检作业（手机端）</span>
              </div>
              <h1 className="text-2xl font-bold">你好，{currentUser.name}</h1>
              <p className="text-sm text-primary-100 mt-1">
                今日待巡检任务 {todayCount} 项，请逐项打钩确认
              </p>
            </div>

            <div className="flex-1 px-4 py-5 space-y-3">
              {actionableTasks.length === 0 ? (
                <div className="text-center py-20">
                  <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无待巡检任务</p>
                  <p className="text-gray-400 text-sm mt-1">今日巡检任务已完成</p>
                </div>
              ) : (
                actionableTasks.map((task) => {
                  const CatIcon = CATEGORY_ICON[task.category];
                  const checked = task.items.filter((i) => i.result !== 'pending').length;
                  const total = task.items.length;
                  const abnormal = task.items.filter((i) => i.result === 'abnormal').length;
                  const pct = total ? (checked / total) * 100 : 0;
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleSelect(task)}
                      className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-4 active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', CATEGORY_COLOR[task.category])}>
                          <CatIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-gray-900 truncate">{task.planName}</h3>
                            <span
                              className={cn(
                                'badge flex-shrink-0',
                                task.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              )}
                            >
                              {task.status === 'pending' ? '待巡检' : '巡检中'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {task.area}
                          </p>
                          <div className="mt-2.5">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>巡检进度</span>
                              <span className={abnormal > 0 ? 'text-red-600 font-medium' : ''}>
                                {checked}/{total}
                                {abnormal > 0 && ` · 异常${abnormal}`}
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', abnormal > 0 ? 'bg-red-500' : 'bg-green-500')}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InspectionSheet({
  task,
  taskRemark,
  onRemarkChange,
  onBack,
  onSetResult,
  onAbnormalRemark,
  onSubmit,
}: {
  task: InspectionTask;
  taskRemark: string;
  onRemarkChange: (v: string) => void;
  onBack: () => void;
  onSetResult: (taskId: string, itemId: string, result: 'normal' | 'abnormal') => void;
  onAbnormalRemark: (taskId: string, itemId: string, value: string) => void;
  onSubmit: () => void;
}) {
  const CatIcon = CATEGORY_ICON[task.category];
  const checked = task.items.filter((i) => i.result !== 'pending').length;
  const total = task.items.length;
  const abnormalCount = task.items.filter((i) => i.result === 'abnormal').length;
  const allChecked = checked === total && total > 0;
  const pct = total ? (checked / total) * 100 : 0;

  return (
    <>
      <div className="bg-gradient-to-br from-primary-800 to-primary-600 text-white px-4 pt-5 pb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-primary-100 text-sm mb-3 active:opacity-70"
        >
          <ArrowLeft className="w-4 h-4" />
          返回任务列表
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <CatIcon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{task.planName}</h1>
            <p className="text-xs text-primary-100 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {task.area}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-primary-100 mb-1">
            <span>已检 {checked}/{total} 项</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', abnormalCount > 0 ? 'bg-red-300' : 'bg-green-300')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {task.scheduledDate}
          </span>
          <span className="font-mono">{task.taskNo}</span>
        </div>

        {task.items.map((item, idx) => {
          const isNormal = item.result === 'normal';
          const isAbnormal = item.result === 'abnormal';
          return (
            <div
              key={item.id}
              className={cn(
                'bg-white rounded-2xl border p-4 transition-colors',
                isAbnormal ? 'border-red-200' : isNormal ? 'border-green-100' : 'border-gray-100'
              )}
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="text-sm text-gray-400 mt-0.5">{idx + 1}.</span>
                <p className="text-sm font-medium text-gray-800 flex-1">{item.name}</p>
                {isAbnormal ? (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : isNormal ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSetResult(task.id, item.id, 'normal')}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95',
                    isNormal
                      ? 'bg-green-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  正常
                </button>
                <button
                  onClick={() => onSetResult(task.id, item.id, 'abnormal')}
                  className={cn(
                    'py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95',
                    isAbnormal
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  <XCircle className="w-4 h-4" />
                  异常
                </button>
              </div>

              {isAbnormal && (
                <div className="mt-3 animate-fade-in-up">
                  <label className="text-xs text-red-600 font-medium flex items-center gap-1 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    异常说明（将自动转报修单）
                  </label>
                  <textarea
                    value={item.remark ?? ''}
                    onChange={(e) => onAbnormalRemark(task.id, item.id, e.target.value)}
                    placeholder="请描述异常情况，如位置、现象等"
                    rows={2}
                    className="textarea-field text-sm border-red-200 focus:ring-red-400"
                  />
                </div>
              )}
            </div>
          );
        })}

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">巡检备注（选填）</label>
          <textarea
            value={taskRemark}
            onChange={(e) => onRemarkChange(e.target.value)}
            placeholder="整体巡检情况说明"
            rows={2}
            className="textarea-field text-sm"
          />
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        {abnormalCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 mb-2 justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
            本次发现 {abnormalCount} 项异常，提交后将自动转报修单
          </div>
        )}
        <button
          onClick={onSubmit}
          disabled={!allChecked}
          className={cn(
            'w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
            allChecked
              ? 'bg-primary-600 hover:bg-primary-700'
              : 'bg-gray-300 cursor-not-allowed'
          )}
        >
          <Send className="w-5 h-5" />
          {allChecked ? `提交巡检${abnormalCount > 0 ? `（${abnormalCount}项转报修）` : ''}` : `还需检查 ${total - checked} 项`}
        </button>
      </div>
    </>
  );
}
