import { useState } from 'react';
import { Plus, Trash2, Package, Calculator } from 'lucide-react';
import { MaterialItem } from '@/types';
import { formatCurrency } from '@/utils';
import { cn } from '@/lib/utils';

interface MaterialFormProps {
  materials: MaterialItem[];
  onAdd: (material: Omit<MaterialItem, 'id' | 'totalPrice'>) => void;
  onRemove: (materialId: string) => void;
  readonly?: boolean;
}

interface NewMaterial {
  name: string;
  quantity: string;
  unitPrice: string;
}

export default function MaterialForm({
  materials,
  onAdd,
  onRemove,
  readonly = false,
}: MaterialFormProps) {
  const [newMaterial, setNewMaterial] = useState<NewMaterial>({
    name: '',
    quantity: '',
    unitPrice: '',
  });
  const [errors, setErrors] = useState<Partial<NewMaterial>>({});

  const validate = (): boolean => {
    const newErrors: Partial<NewMaterial> = {};

    if (!newMaterial.name.trim()) {
      newErrors.name = '请输入耗材名称';
    }
    if (!newMaterial.quantity || Number(newMaterial.quantity) <= 0) {
      newErrors.quantity = '请输入有效数量';
    }
    if (!newMaterial.unitPrice || Number(newMaterial.unitPrice) < 0) {
      newErrors.unitPrice = '请输入有效单价';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;

    onAdd({
      name: newMaterial.name.trim(),
      quantity: Number(newMaterial.quantity),
      unitPrice: Number(newMaterial.unitPrice),
    });

    setNewMaterial({ name: '', quantity: '', unitPrice: '' });
    setErrors({});
  };

  const totalAmount = materials.reduce((sum, m) => sum + m.totalPrice, 0);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-primary-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            耗材登记
          </h2>
          <p className="text-sm text-gray-500 mt-1">记录维修过程中使用的耗材</p>
        </div>
        {materials.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg">
            <Calculator className="w-4 h-4 text-primary-600" />
            <span className="text-sm text-gray-600">合计：</span>
            <span className="text-lg font-bold text-primary-800">{formatCurrency(totalAmount)}</span>
          </div>
        )}
      </div>

      {!readonly && (
        <div className="bg-primary-50/50 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">耗材名称</label>
              <input
                type="text"
                value={newMaterial.name}
                onChange={(e) => {
                  setNewMaterial({ ...newMaterial, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="如：LED灯管"
                className={cn(
                  'input-field',
                  errors.name && 'border-red-300 focus:ring-red-500'
                )}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
              <input
                type="number"
                value={newMaterial.quantity}
                onChange={(e) => {
                  setNewMaterial({ ...newMaterial, quantity: e.target.value });
                  if (errors.quantity) setErrors({ ...errors, quantity: undefined });
                }}
                placeholder="0"
                min="1"
                className={cn(
                  'input-field',
                  errors.quantity && 'border-red-300 focus:ring-red-500'
                )}
              />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity}</p>}
            </div>
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">单价 (元)</label>
              <input
                type="number"
                value={newMaterial.unitPrice}
                onChange={(e) => {
                  setNewMaterial({ ...newMaterial, unitPrice: e.target.value });
                  if (errors.unitPrice) setErrors({ ...errors, unitPrice: undefined });
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={cn(
                  'input-field',
                  errors.unitPrice && 'border-red-300 focus:ring-red-500'
                )}
              />
              {errors.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.unitPrice}</p>}
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button
                type="button"
                onClick={handleAdd}
                className="w-full sm:w-auto btn-primary flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:hidden">添加</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{readonly ? '暂无耗材记录' : '暂无耗材，点击上方添加'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  耗材名称
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  单价
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  小计
                </th>
                {!readonly && (
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-gray-900">{material.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">{material.quantity}</td>
                  <td className="py-3 px-4 text-sm text-gray-700 text-right">
                    {formatCurrency(material.unitPrice)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-primary-700 text-right">
                    {formatCurrency(material.totalPrice)}
                  </td>
                  {!readonly && (
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(material.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            {materials.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-primary-200 bg-primary-50/50">
                  <td className="py-3 px-4 text-sm font-semibold text-gray-700" colSpan={3}>
                    合计
                  </td>
                  <td className="py-3 px-4 text-lg font-bold text-primary-800 text-right">
                    {formatCurrency(totalAmount)}
                  </td>
                  {!readonly && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
