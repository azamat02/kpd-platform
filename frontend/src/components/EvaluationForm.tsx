import React, { useState } from 'react';
import {
  EvaluationPeriod,
  PendingSubordinate,
  FormType,
  EvaluationScores,
  EvaluationComments,
} from '../services/api';

// Параметры для формы руководителей
const MANAGER_PARAMS = [
  {
    key: 'quality',
    name: 'Обеспечение качественного выполнения задач в курируемых подразделениях',
    hint: 'Оценка качества работы подразделений под руководством оцениваемого',
  },
  {
    key: 'deadlines',
    name: 'Обеспечение соблюдения сроков выполнения задач в курируемых подразделениях',
    hint: 'Своевременность выполнения задач в подчиненных подразделениях',
  },
  {
    key: 'leadership',
    name: 'Лидерство и навыки принятия решений',
    hint: 'Способность принимать решения, мотивировать команду и вести за собой',
  },
  {
    key: 'discipline',
    name: 'Соблюдение трудовой дисциплины',
    hint: 'Соблюдение правил внутреннего трудового распорядка',
  },
  {
    key: 'noViolations',
    name: 'Отсутствие дисциплинарных взысканий',
    hint: 'Отсутствие замечаний, выговоров и других взысканий в оценочном периоде',
  },
];

// Параметры для формы сотрудников
const EMPLOYEE_PARAMS = [
  {
    key: 'quality',
    name: 'Качество выполнения функциональных обязанностей',
    hint: 'Соответствие результатов работы установленным требованиям и стандартам',
  },
  {
    key: 'deadlines',
    name: 'Соблюдение сроков выполнения задач',
    hint: 'Своевременность выполнения поставленных задач',
  },
  {
    key: 'initiative',
    name: 'Самостоятельность и инициативность',
    hint: 'Способность работать без постоянного контроля, предлагать идеи и решения',
  },
  {
    key: 'discipline',
    name: 'Соблюдение трудовой дисциплины',
    hint: 'Соблюдение правил внутреннего трудового распорядка',
  },
  {
    key: 'noViolations',
    name: 'Отсутствие дисциплинарных взысканий',
    hint: 'Отсутствие замечаний, выговоров и других взысканий в оценочном периоде',
  },
];

// Расчет результата по средней оценке
const getResultText = (averageScore: number): string => {
  if (averageScore >= 4.5) {
    return 'Выполняет функциональные обязанности эффективно';
  } else if (averageScore >= 3.5) {
    return 'Выполняет функциональные обязанности надлежащим образом';
  } else if (averageScore >= 2.5) {
    return 'Выполняет функциональные обязанности удовлетворительно';
  } else {
    return 'Выполняет функциональные обязанности неудовлетворительно';
  }
};

const getResultColor = (averageScore: number): string => {
  if (averageScore >= 4.5) return 'text-green-600 bg-green-50';
  if (averageScore >= 3.5) return 'text-blue-600 bg-blue-50';
  if (averageScore >= 2.5) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
};

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface EvaluationFormProps {
  period: EvaluationPeriod;
  subordinate: PendingSubordinate;
  existingScores?: EvaluationScores;
  existingComments?: EvaluationComments | null;
  onSubmit: (scores: EvaluationScores, comments: EvaluationComments) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({
  period,
  subordinate,
  existingScores,
  existingComments,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const formType: FormType = subordinate.formType;
  const params = formType === 'manager' ? MANAGER_PARAMS : EMPLOYEE_PARAMS;

  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (existingScores) {
      return { ...existingScores };
    }
    const initial: Record<string, number> = {};
    params.forEach((p) => {
      initial[p.key] = 0;
    });
    return initial;
  });

  const [comments, setComments] = useState<Record<string, string>>(() => {
    if (existingComments) {
      return { ...existingComments };
    }
    const initial: Record<string, string> = {};
    params.forEach((p) => {
      initial[p.key] = '';
    });
    return initial;
  });

  const [hoveredParam, setHoveredParam] = useState<string | null>(null);

  // Calculate average score
  const averageScore =
    params.reduce((sum, p) => sum + (scores[p.key] || 0), 0) / params.length;
  const roundedAverage = Math.round(averageScore * 100) / 100;
  const resultText = getResultText(roundedAverage);

  const handleScoreChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
      setScores((prev) => ({ ...prev, [key]: numValue }));
    } else if (value === '' || value === '0') {
      setScores((prev) => ({ ...prev, [key]: 0 }));
    }
  };

  const handleCommentChange = (key: string, value: string) => {
    setComments((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all scores are filled (1-5, not 0)
    for (const param of params) {
      if (!scores[param.key] || scores[param.key] < 1 || scores[param.key] > 5) {
        alert(`Пожалуйста, заполните оценку для: ${param.name}`);
        return;
      }
    }

    await onSubmit(scores as unknown as EvaluationScores, comments as unknown as EvaluationComments);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Оценка сотрудника
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Период: {period.name}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Employee Info */}
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-slate-200">
                <span className="text-lg font-semibold text-slate-600">
                  {subordinate.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{subordinate.fullName}</p>
                <p className="text-sm text-slate-500">{subordinate.position}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="badge-info text-xs">{subordinate.group.name}</span>
                  <span className="badge-gray text-xs">
                    {formType === 'manager' ? 'Форма 1 (Руководитель)' : 'Форма 2 (Сотрудник)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Parameters */}
          <div className="p-6 space-y-6 max-h-[50vh] overflow-y-auto">
            {params.map((param, index) => (
              <div key={param.key} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-2">
                    <span className="text-sm font-medium text-slate-500 w-6 pt-0.5">
                      {index + 1}.
                    </span>
                    <div>
                      <label className="text-sm font-medium text-slate-900">
                        {param.name}
                      </label>
                      <div
                        className="relative inline-block ml-2"
                        onMouseEnter={() => setHoveredParam(param.key)}
                        onMouseLeave={() => setHoveredParam(null)}
                      >
                        <span className="text-slate-400 cursor-help">
                          <InfoIcon />
                        </span>
                        {hoveredParam === param.key && (
                          <div className="absolute left-0 top-6 z-10 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-lg">
                            {param.hint}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleScoreChange(param.key, String(value))}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                          scores[param.key] === value
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ml-8">
                  <input
                    type="text"
                    value={comments[param.key]}
                    onChange={(e) => handleCommentChange(param.key, e.target.value)}
                    placeholder="Комментарий (опционально)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Result Summary */}
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Средняя оценка</p>
                <p className="text-3xl font-bold text-slate-900">{roundedAverage.toFixed(2)}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getResultColor(roundedAverage)}`}>
                <p className="text-sm font-medium">{resultText}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 p-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить оценку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationForm;
