import { useState } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  Wrench,
  Edit,
  Trash2,
  X,
  Check,
  User,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { Worker, WorkerSkill, REPAIR_TYPES } from '@/types';
import { cn } from '@/lib/utils';

interface WorkerFormData {
  name: string;
  phone: string;
  skills: WorkerSkill[];
  status: Worker['status'];
}

const initialFormData: WorkerFormData = {
  name: '',
  phone: '',
  skills: [],
  status: '空闲',
};

const statusColors: Record<Worker['status'], string> = {
  空闲: 'bg-green-100 text-green-700 border-green-200',
  忙碌: 'bg-amber-100 text-amber-700 border-amber-200',
  休息: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function WorkerManagement() {
  const { workers, orders, addToast } = useAppStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState<WorkerFormData>(initialFormData);

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.includes(searchKeyword) ||
      w.phone.includes(searchKeyword) ||
      w.skills.some((s) => s.includes(searchKeyword))
  );

  const stats = {
    total: workers.length,
    idle: workers.filter((w) => w.status === '空闲').length,
    busy: workers.filter((w) => w.status === '忙碌').length,
    rest: workers.filter((w) => w.status === '休息').length,
    totalOrders: workers.reduce((sum, w) => sum + w.completedOrders, 0),
  };

  const getActiveOrders = (workerId: string) =>
    orders.filter(
      (o) => o.assigneeId === workerId && ['已派单', '已接单', '维修中'].includes(o.status)
    ).length;

  const openAddModal = () => {
    setEditingWorker(null);
    setFormData(initialFormData);
    setShowAddModal(true);
  };

  const openEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      name: worker.name,
      phone: worker.phone,
      skills: [...worker.skills],
      status: worker.status,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingWorker(null);
    setFormData(initialFormData);
  };

  const toggleSkill = (skill: WorkerSkill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      addToast('error', '请输入维修工姓名');
      return;
    }
    if (!formData.phone.trim()) {
      addToast('error', '请输入联系电话');
      return;
    }
    if (formData.skills.length === 0) {
      addToast('error', '请至少选择一项技能');
      return;
    }

    if (editingWorker) {
      addToast('success', `维修工 ${formData.name} 信息已更新`);
    } else {
      addToast('success', `维修工 ${formData.name} 添加成功`);
    }
    closeModal();
  };

  const handleDelete = (worker: Worker) => {
    if (getActiveOrders(worker.id) > 0) {
      addToast('error', '该维修工有正在进行的工单，无法删除');
      return;
    }
    addToast('info', `已删除维修工 ${worker.name}`);
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">维修工总数</p>
              <p className="text-2xl font-bold text-primary-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <User className="w-6 h-6 text-primary-700" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">空闲</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.idle}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">忙碌</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.busy}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">累计完成</p>
              <p className="text-2xl font-bold text-primary-800 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-700" />
            </div>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、电话、技能..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button onClick={openAddModal} className="btn-primary flex items-center justify-center gap-2">
            <UserPlus className="w-4 h-4" />
            添加维修工
          </button>
        </div>
      </div>

      {/* 维修工列表 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-3.5 text-sm font-semibold text-gray-600">维修工</th>
                <th className="text-left px-6 py-3.5 text-sm font-semibold text-gray-600">联系电话</th>
                <th className="text-left px-6 py-3.5 text-sm font-semibold text-gray-600">技能</th>
                <th className="text-left px-6 py-3.5 text-sm font-semibold text-gray-600">状态</th>
                <th className="text-left px-6 py-3.5 text-sm font-semibold text-gray-600">当前工单</th>
                <th className="text-left px-6 py-3.5 text-sm font-semibold text-gray-600">已完成</th>
                <th className="text-right px-6 py-3.5 text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-800 flex items-center justify-center text-white font-semibold text-sm">
                        {worker.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{worker.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-gray-600 text-sm">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {worker.phone}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary-50 text-primary-700 border border-primary-100"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('badge border', statusColors[worker.status])}>
                      {worker.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'font-semibold',
                        getActiveOrders(worker.id) > 0 ? 'text-amber-600' : 'text-gray-400'
                      )}
                    >
                      {getActiveOrders(worker.id)} 单
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-primary-800">{worker.completedOrders}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(worker)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(worker)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredWorkers.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-gray-400">暂无维修工数据</p>
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingWorker ? '编辑维修工' : '添加维修工'}
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入维修工姓名"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入联系电话"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  技能专长 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REPAIR_TYPES.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
                        formData.skills.includes(skill)
                          ? 'bg-primary-800 text-white border-primary-800 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400 hover:text-primary-700'
                      )}
                    >
                      {formData.skills.includes(skill) && (
                        <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      )}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">工作状态</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as Worker['status'] })
                  }
                  className="select-field"
                >
                  <option value="空闲">空闲</option>
                  <option value="忙碌">忙碌</option>
                  <option value="休息">休息</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} className="btn-primary flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                {editingWorker ? '保存修改' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
