import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
  evaluationPeriodsApi,
  EvaluationPeriod,
  CreatePeriodData,
  UpdatePeriodData,
} from '../services/api';

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

interface PeriodFormProps {
  period?: EvaluationPeriod;
  onSave: (data: CreatePeriodData | UpdatePeriodData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const PeriodForm: React.FC<PeriodFormProps> = ({ period, onSave, onCancel, isLoading }) => {
  const [name, setName] = useState(period?.name || '');
  const [startDate, setStartDate] = useState(
    period ? new Date(period.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    period ? new Date(period.endDate).toISOString().split('T')[0] : ''
  );
  const [isActive, setIsActive] = useState(period?.isActive ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, startDate, endDate, isActive });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {period ? 'Редактировать период' : 'Новый период оценки'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Название периода
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Q1 2024, Январь 2024"
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Дата начала
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Дата окончания
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-500"
            />
            <label htmlFor="isActive" className="text-sm text-slate-700">
              Период активен (доступен для оценки)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EvaluationPeriodsPage: React.FC = () => {
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EvaluationPeriod | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<EvaluationPeriod | null>(null);

  const loadPeriods = async () => {
    try {
      const response = await evaluationPeriodsApi.getAll();
      setPeriods(response.data);
    } catch (error) {
      console.error('Failed to load periods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const handleSave = async (data: CreatePeriodData | UpdatePeriodData) => {
    setIsSaving(true);
    try {
      if (editingPeriod) {
        await evaluationPeriodsApi.update(editingPeriod.id, data);
      } else {
        await evaluationPeriodsApi.create(data as CreatePeriodData);
      }
      await loadPeriods();
      setShowForm(false);
      setEditingPeriod(undefined);
    } catch (error) {
      console.error('Failed to save period:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (period: EvaluationPeriod) => {
    try {
      await evaluationPeriodsApi.delete(period.id);
      await loadPeriods();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete period:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Периоды оценки</h1>
            <p className="text-slate-500 mt-1">
              Управление периодами оценки сотрудников
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPeriod(undefined);
              setShowForm(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <PlusIcon />
            <span>Новый период</span>
          </button>
        </div>

        {/* Periods List */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            </div>
          ) : periods.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon />
              </div>
              <p className="text-slate-500">Нет периодов оценки</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary mt-4"
              >
                Создать первый период
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Период
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Даты
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Статус
                    </th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Оценок
                    </th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periods.map((period) => (
                    <tr key={period.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">{period.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(period.startDate)} — {formatDate(period.endDate)}
                      </td>
                      <td className="px-6 py-4">
                        {period.isActive ? (
                          <span className="badge-success">Активен</span>
                        ) : (
                          <span className="badge-gray">Завершен</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {period._count?.evaluations || 0}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setEditingPeriod(period);
                              setShowForm(true);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
                            title="Редактировать"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(period)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600"
                            title="Удалить"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Period Form Modal */}
      {showForm && (
        <PeriodForm
          period={editingPeriod}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingPeriod(undefined);
          }}
          isLoading={isSaving}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Удалить период?
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Период «{deleteConfirm.name}» и все связанные оценки будут удалены.
              Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-danger"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EvaluationPeriodsPage;
