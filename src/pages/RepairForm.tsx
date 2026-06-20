import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { REPAIR_TYPES, URGENCY_LEVELS } from '@/types';
import type { RepairType, UrgencyLevel } from '@/types';
import { checkPropertyFeeStatus } from '@/utils';
import { cn } from '@/lib/utils';
import {
  Home,
  User,
  Phone,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Building2,
  Wallet,
} from 'lucide-react';

interface FormData {
  roomNumber: string;
  ownerName: string;
  ownerPhone: string;
  repairType: RepairType;
  urgency: UrgencyLevel;
  description: string;
}

interface FormErrors {
  roomNumber?: string;
  ownerName?: string;
  ownerPhone?: string;
  description?: string;
}

function getUrgencyRadioStyle(urgency: UrgencyLevel, isSelected: boolean) {
  const baseStyle = 'flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 cursor-pointer transition-all duration-200';
  if (!isSelected) {
    return `${baseStyle} border-gray-200 bg-white hover:border-gray-300`;
  }
  switch (urgency) {
    case '普通':
      return `${baseStyle} border-gray-500 bg-gray-50`;
    case '紧急':
      return `${baseStyle} border-orange-500 bg-orange-50`;
    case '非常紧急':
      return `${baseStyle} border-red-500 bg-red-50`;
  }
}

function getUrgencyDotColor(urgency: UrgencyLevel) {
  switch (urgency) {
    case '普通':
      return 'bg-gray-500';
    case '紧急':
      return 'bg-orange-500';
    case '非常紧急':
      return 'bg-red-500';
  }
}

export default function RepairForm() {
  const createOrder = useAppStore((s) => s.createOrder);
  const toasts = useAppStore((s) => s.toasts);
  const propertyFees = useAppStore((s) => s.propertyFees);

  const [formData, setFormData] = useState<FormData>({
    roomNumber: '',
    ownerName: '',
    ownerPhone: '',
    repairType: '水电',
    urgency: '普通',
    description: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrderNo, setCreatedOrderNo] = useState('');

  const propertyFeeCheck = useMemo(() => {
    const keyword = formData.roomNumber.trim().toLowerCase();
    if (!keyword) return null;
    const record = propertyFees.find(
      (p) => p.roomNumber.trim().toLowerCase() === keyword
    );
    return checkPropertyFeeStatus(record);
  }, [formData.roomNumber, propertyFees]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = '请输入房号';
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = '请输入报修人姓名';
    }

    if (!formData.ownerPhone.trim()) {
      newErrors.ownerPhone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.ownerPhone.trim())) {
      newErrors.ownerPhone = '请输入正确的手机号码';
    }

    if (!formData.description.trim()) {
      newErrors.description = '请输入问题描述';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = '问题描述至少需要5个字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const order = createOrder(formData);
      setCreatedOrderNo(order.orderNo);
      setShowSuccess(true);
      setFormData({
        roomNumber: '',
        ownerName: '',
        ownerPhone: '',
        repairType: '水电',
        urgency: '普通',
        description: '',
      });
      setTimeout(() => setShowSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      roomNumber: '',
      ownerName: '',
      ownerPhone: '',
      repairType: '水电',
      urgency: '普通',
      description: '',
    });
    setErrors({});
    setShowSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">物业报修登记</h1>
          <p className="text-primary-200">请填写报修信息，我们将尽快安排维修</p>
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 opacity-0 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">提交成功！</h3>
                <p className="text-sm text-green-700 mt-1">
                  您的报修工单已提交，工单编号：<span className="font-mono font-bold">{createdOrderNo}</span>
                </p>
                <p className="text-sm text-green-600 mt-1">物业工作人员将尽快与您联系</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="bg-primary-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">报修信息</h2>
            <p className="text-sm text-primary-200 mt-0.5">带 <span className="text-red-400">*</span> 为必填项</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <Home className="w-4 h-4 text-primary-600" />
                  房号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => handleChange('roomNumber', e.target.value)}
                  placeholder="如：3栋1单元501"
                  className={`input-field ${errors.roomNumber ? 'border-red-400 focus:ring-red-500' : ''}`}
                />
                {errors.roomNumber && (
                  <p className="mt-1 text-xs text-red-500">{errors.roomNumber}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  <User className="w-4 h-4 text-primary-600" />
                  报修人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => handleChange('ownerName', e.target.value)}
                  placeholder="请输入您的姓名"
                  className={`input-field ${errors.ownerName ? 'border-red-400 focus:ring-red-500' : ''}`}
                />
                {errors.ownerName && (
                  <p className="mt-1 text-xs text-red-500">{errors.ownerName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <Phone className="w-4 h-4 text-primary-600" />
                联系电话 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.ownerPhone}
                onChange={(e) => handleChange('ownerPhone', e.target.value)}
                placeholder="请输入11位手机号码"
                maxLength={11}
                className={`input-field ${errors.ownerPhone ? 'border-red-400 focus:ring-red-500' : ''}`}
              />
              {errors.ownerPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.ownerPhone}</p>
              )}
            </div>

            {propertyFeeCheck && propertyFeeCheck.record && (
              <div
                className={cn(
                  'rounded-lg border p-3',
                  propertyFeeCheck.level === 'danger'
                    ? 'bg-orange-50 border-orange-200'
                    : propertyFeeCheck.level === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-green-50 border-green-200'
                )}
              >
                <div className="flex items-start gap-2">
                  {propertyFeeCheck.level === 'normal' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0',
                        propertyFeeCheck.level === 'danger' ? 'text-orange-600' : 'text-yellow-600'
                      )}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Wallet className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500">物业费缴纳状态</span>
                      <span
                        className={cn(
                          'badge',
                          propertyFeeCheck.level === 'danger'
                            ? 'bg-orange-100 text-orange-700'
                            : propertyFeeCheck.level === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        )}
                      >
                        {propertyFeeCheck.record.status}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-sm mt-1',
                        propertyFeeCheck.level === 'danger'
                          ? 'text-orange-700'
                          : propertyFeeCheck.level === 'warning'
                          ? 'text-yellow-700'
                          : 'text-green-700'
                      )}
                    >
                      {propertyFeeCheck.message}
                    </p>
                    {propertyFeeCheck.level === 'danger' && (
                      <p className="text-xs text-gray-500 mt-1">
                        欠费已超过3个月，已标记提示。本次报修正常受理，不受影响，请同步提醒业主尽快缴费。
                      </p>
                    )}
                    {propertyFeeCheck.level === 'warning' && (
                      <p className="text-xs text-gray-500 mt-1">
                        提示信息，不影响报修受理。
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 text-primary-600" />
                报修类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.repairType}
                onChange={(e) => handleChange('repairType', e.target.value as RepairType)}
                className="select-field"
              >
                {REPAIR_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <AlertTriangle className="w-4 h-4 text-primary-600" />
                紧急程度 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {URGENCY_LEVELS.map((level) => (
                  <div
                    key={level}
                    onClick={() => handleChange('urgency', level)}
                    className={getUrgencyRadioStyle(level, formData.urgency === level)}
                  >
                    <div className={`w-3 h-3 rounded-full ${getUrgencyDotColor(level)}`} />
                    <span className="text-sm font-medium text-gray-700">{level}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                <span className="text-gray-400">提示：</span>
                <span className="text-red-600">非常紧急</span> 用于涉及安全隐患或严重影响生活的情况
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-4 h-4 text-primary-600" />
                问题描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="请详细描述需要维修的问题，如具体位置、故障现象等..."
                rows={5}
                className={`textarea-field ${errors.description ? 'border-red-400 focus:ring-red-500' : ''}`}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-xs text-red-500">{errors.description}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-400">{formData.description.length}/500</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交报修
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary px-6 py-3"
              >
                重置
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-primary-300 text-sm mt-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          如有紧急情况，请拨打物业24小时服务热线：400-888-8888
        </p>
      </div>
    </div>
  );
}
