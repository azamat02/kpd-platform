import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EvaluationForm from '../components/EvaluationForm';
import {
  evaluationsApi,
  PendingSubordinate,
  EvaluationPeriod,
  EvaluationScores,
  EvaluationComments,
  Evaluation,
} from '../services/api';

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const getResultColor = (averageScore: number): string => {
  if (averageScore >= 4.5) return 'text-green-600';
  if (averageScore >= 3.5) return 'text-blue-600';
  if (averageScore >= 2.5) return 'text-amber-600';
  return 'text-red-600';
};

const EvaluationsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [period, setPeriod] = useState<EvaluationPeriod | null>(null);
  const [subordinates, setSubordinates] = useState<PendingSubordinate[]>([]);
  const [selectedSubordinate, setSelectedSubordinate] = useState<PendingSubordinate | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<Evaluation | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadData = async () => {
    try {
      const response = await evaluationsApi.getPending();
      setPeriod(response.data.period);
      setSubordinates(response.data.subordinates);
    } catch (error) {
      console.error('Failed to load evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenForm = async (subordinate: PendingSubordinate) => {
    // If already evaluated, load existing evaluation
    if (subordinate.evaluation) {
      try {
        const response = await evaluationsApi.getOne(subordinate.evaluation.id);
        setExistingEvaluation(response.data);
      } catch (error) {
        console.error('Failed to load evaluation:', error);
      }
    } else {
      setExistingEvaluation(null);
    }
    setSelectedSubordinate(subordinate);
  };

  const handleSubmitEvaluation = async (scores: EvaluationScores, comments: EvaluationComments) => {
    if (!period || !selectedSubordinate) return;

    setIsSaving(true);
    try {
      await evaluationsApi.create({
        periodId: period.id,
        evaluateeId: selectedSubordinate.id,
        scores,
        comments,
      });
      await loadData();
      setSelectedSubordinate(null);
      setExistingEvaluation(null);
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      alert('Ошибка при сохранении оценки');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const evaluatedCount = subordinates.filter((s) => s.evaluation).length;
  const totalCount = subordinates.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-slate-500">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="text-lg font-semibold text-slate-900">KPD Platform</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/portal')}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                Моя страница
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <LogoutIcon />
                <span>Выход</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Оценка сотрудников</h1>
            <p className="text-slate-500 mt-1">
              {user.fullName} · {user.position}
            </p>
          </div>

          {isLoading ? (
            <div className="card p-12 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                <p className="mt-4 text-sm text-slate-500">Загрузка...</p>
              </div>
            </div>
          ) : !period ? (
            <div className="card p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon />
                </div>
                <p className="text-slate-900 font-medium">Нет активного периода оценки</p>
                <p className="text-slate-500 text-sm mt-1">
                  Администратор еще не создал период для оценки сотрудников
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Period Info */}
              <div className="card p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{period.name}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(period.startDate)} — {formatDate(period.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {evaluatedCount} / {totalCount}
                    </p>
                    <p className="text-sm text-slate-500">оценено</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {totalCount > 0 && (
                  <div className="mt-4">
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${(evaluatedCount / totalCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Subordinates List */}
              <div className="card">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-lg font-semibold text-slate-900">Подчиненные</h2>
                </div>

                {subordinates.length === 0 ? (
                  <div className="p-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <UsersIcon />
                      </div>
                      <p className="text-slate-500">Нет подчиненных для оценки</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {subordinates.map((sub) => (
                      <div
                        key={sub.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-slate-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-slate-600">
                              {sub.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{sub.fullName}</p>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-sm text-slate-500">{sub.position}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-xs text-slate-400">{sub.group.name}</span>
                              <span className="badge-gray text-xs">
                                {sub.formType === 'manager' ? 'Форма 1' : 'Форма 2'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {sub.evaluation ? (
                            <>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${getResultColor(sub.evaluation.averageScore)}`}>
                                  {sub.evaluation.averageScore.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-400">оценка</p>
                              </div>
                              <span className="badge-success flex items-center space-x-1">
                                <CheckIcon />
                                <span>Оценен</span>
                              </span>
                              <button
                                onClick={() => handleOpenForm(sub)}
                                className="btn-secondary text-sm"
                              >
                                Изменить
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="badge-warning flex items-center space-x-1">
                                <ClockIcon />
                                <span>Не оценен</span>
                              </span>
                              <button
                                onClick={() => handleOpenForm(sub)}
                                className="btn-primary text-sm"
                              >
                                Оценить
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Evaluation Form Modal */}
      {selectedSubordinate && period && (
        <EvaluationForm
          period={period}
          subordinate={selectedSubordinate}
          existingScores={existingEvaluation?.scores}
          existingComments={existingEvaluation?.comments}
          onSubmit={handleSubmitEvaluation}
          onCancel={() => {
            setSelectedSubordinate(null);
            setExistingEvaluation(null);
          }}
          isLoading={isSaving}
        />
      )}
    </div>
  );
};

export default EvaluationsPage;
