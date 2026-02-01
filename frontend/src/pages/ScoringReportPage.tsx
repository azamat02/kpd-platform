import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import {
  groupScoresApi,
  evaluationPeriodsApi,
  EvaluationPeriod,
  GroupSummaryItem,
  ScoreDistribution,
} from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Icons
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ChartBarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Get score color class based on score value
const getScoreColorClass = (score: number | null): string => {
  if (score === null) return 'bg-slate-100 text-slate-500';
  if (score >= 4.5) return 'bg-green-100 text-green-700';
  if (score >= 3.5) return 'bg-blue-100 text-blue-700';
  if (score >= 2.5) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const getScoreCategory = (score: number | null): string => {
  if (score === null) return 'Не оценено';
  if (score >= 4.5) return 'Эффективно';
  if (score >= 3.5) return 'Надлежаще';
  if (score >= 2.5) return 'Удовлетворительно';
  return 'Неудовлетворительно';
};

// Pie chart colors
const PIE_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: 'default' | 'green' | 'blue' | 'yellow' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtitle, color = 'default' }) => {
  const colorClasses = {
    default: 'bg-slate-100 text-slate-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

const ScoringReportPage: React.FC = () => {
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState<EvaluationPeriod | null>(null);

  // Summary data
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [groupsEvaluated, setGroupsEvaluated] = useState(0);
  const [employeesEvaluated, setEmployeesEvaluated] = useState(0);
  const [managerFormAvg, setManagerFormAvg] = useState<number | null>(null);
  const [employeeFormAvg, setEmployeeFormAvg] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupSummaryItem[]>([]);
  const [distribution, setDistribution] = useState<ScoreDistribution>({
    excellent: 0,
    good: 0,
    satisfactory: 0,
    poor: 0,
  });

  // Load periods
  useEffect(() => {
    const loadPeriods = async () => {
      try {
        const response = await evaluationPeriodsApi.getAll();
        setPeriods(response.data);
        const activePeriod = response.data.find((p) => p.isActive);
        if (activePeriod) {
          setSelectedPeriodId(activePeriod.id);
        } else if (response.data.length > 0) {
          setSelectedPeriodId(response.data[0].id);
        }
      } catch (error) {
        console.error('Failed to load periods:', error);
      }
    };
    loadPeriods();
  }, []);

  // Load summary data when period changes
  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const response = await groupScoresApi.getSummary(selectedPeriodId || undefined);
        const data = response.data;
        setCurrentPeriod(data.period);
        setOverallScore(data.overallScore);
        setGroupsEvaluated(data.groupsEvaluated);
        setEmployeesEvaluated(data.employeesEvaluated);
        setManagerFormAvg(data.managerFormAvg);
        setEmployeeFormAvg(data.employeeFormAvg);
        setGroups(data.groups);
        setDistribution(data.distribution);
      } catch (error) {
        console.error('Failed to load summary:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSummary();
  }, [selectedPeriodId]);

  // Prepare chart data
  const barChartData = groups
    .filter((g) => g.score !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10)
    .map((g) => ({
      name: g.name.length > 15 ? g.name.slice(0, 15) + '...' : g.name,
      fullName: g.name,
      score: g.score,
    }));

  const pieChartData = [
    { name: 'Эффективно (4.5+)', value: distribution.excellent },
    { name: 'Надлежаще (3.5-4.5)', value: distribution.good },
    { name: 'Удовлетворительно (2.5-3.5)', value: distribution.satisfactory },
    { name: 'Неудовлетворительно (<2.5)', value: distribution.poor },
  ].filter((d) => d.value > 0);

  // Export to Excel
  const handleExportExcel = useCallback(() => {
    if (!currentPeriod) return;

    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Сводный отчёт по скорингу'],
      [''],
      ['Период', currentPeriod.name],
      ['Общий балл', overallScore !== null ? overallScore.toFixed(2) : 'Нет данных'],
      ['Групп оценено', groupsEvaluated],
      ['Сотрудников оценено', employeesEvaluated],
      ['Средний балл (Приложение 1)', managerFormAvg !== null ? managerFormAvg.toFixed(2) : 'Нет данных'],
      ['Средний балл (Приложение 2)', employeeFormAvg !== null ? employeeFormAvg.toFixed(2) : 'Нет данных'],
      [''],
      ['Распределение по категориям'],
      ['Эффективно (4.5+)', distribution.excellent],
      ['Надлежаще (3.5-4.5)', distribution.good],
      ['Удовлетворительно (2.5-3.5)', distribution.satisfactory],
      ['Неудовлетворительно (<2.5)', distribution.poor],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

    // Groups sheet
    const groupsData = [
      ['Группа', 'Руководитель', 'Всего сотрудников', 'Оценено', 'Средний балл', 'Категория'],
      ...groups.map((g) => [
        g.name,
        g.leader || '—',
        g.userCount,
        g.evaluatedCount,
        g.score !== null ? g.score.toFixed(2) : '—',
        getScoreCategory(g.score),
      ]),
    ];
    const groupsSheet = XLSX.utils.aoa_to_sheet(groupsData);
    XLSX.utils.book_append_sheet(workbook, groupsSheet, 'Группы');

    // Download
    const fileName = `scoring_report_${currentPeriod.name.replace(/\s/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [currentPeriod, overallScore, groupsEvaluated, employeesEvaluated, managerFormAvg, employeeFormAvg, groups, distribution]);

  // Export to PDF
  const handleExportPdf = useCallback(() => {
    if (!currentPeriod) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Scoring Report / Otchet po skoringu', 14, 22);

    doc.setFontSize(12);
    doc.text(`Period: ${currentPeriod.name}`, 14, 32);

    // Summary stats
    doc.setFontSize(10);
    const stats = [
      `Overall Score: ${overallScore !== null ? overallScore.toFixed(2) : 'N/A'}`,
      `Groups Evaluated: ${groupsEvaluated}`,
      `Employees Evaluated: ${employeesEvaluated}`,
      `Manager Form Avg: ${managerFormAvg !== null ? managerFormAvg.toFixed(2) : 'N/A'}`,
      `Employee Form Avg: ${employeeFormAvg !== null ? employeeFormAvg.toFixed(2) : 'N/A'}`,
    ];
    stats.forEach((stat, i) => {
      doc.text(stat, 14, 42 + i * 6);
    });

    // Distribution
    doc.text('Score Distribution:', 14, 78);
    doc.text(`Excellent (4.5+): ${distribution.excellent}`, 14, 84);
    doc.text(`Good (3.5-4.5): ${distribution.good}`, 14, 90);
    doc.text(`Satisfactory (2.5-3.5): ${distribution.satisfactory}`, 14, 96);
    doc.text(`Poor (<2.5): ${distribution.poor}`, 14, 102);

    // Groups table
    autoTable(doc, {
      startY: 112,
      head: [['Group', 'Leader', 'Total', 'Evaluated', 'Score', 'Category']],
      body: groups.map((g) => [
        g.name,
        g.leader || '-',
        g.userCount,
        g.evaluatedCount,
        g.score !== null ? g.score.toFixed(2) : '-',
        getScoreCategory(g.score),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 51, 51] },
    });

    // Download
    const fileName = `scoring_report_${currentPeriod.name.replace(/\s/g, '_')}.pdf`;
    doc.save(fileName);
  }, [currentPeriod, overallScore, groupsEvaluated, employeesEvaluated, managerFormAvg, employeeFormAvg, groups, distribution]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Сводный отчёт по скорингу</h1>
            <p className="text-slate-500 mt-1">Статистика и аналитика по оценкам сотрудников</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriodId || ''}
              onChange={(e) => setSelectedPeriodId(e.target.value ? parseInt(e.target.value) : null)}
              className="input w-48"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name} {period.isActive && '(активен)'}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportExcel}
              disabled={isLoading || !currentPeriod}
              className="btn-secondary flex items-center gap-2"
            >
              <DownloadIcon />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isLoading || !currentPeriod}
              className="btn-secondary flex items-center gap-2"
            >
              <DownloadIcon />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Общий балл организации"
                value={overallScore !== null ? overallScore.toFixed(2) : '—'}
                icon={<ChartBarIcon />}
                subtitle={getScoreCategory(overallScore)}
                color={
                  overallScore === null
                    ? 'default'
                    : overallScore >= 4.5
                    ? 'green'
                    : overallScore >= 3.5
                    ? 'blue'
                    : overallScore >= 2.5
                    ? 'yellow'
                    : 'red'
                }
              />
              <StatCard
                title="Групп оценено"
                value={groupsEvaluated}
                icon={<BuildingIcon />}
                subtitle={`из ${groups.length} всего`}
                color="blue"
              />
              <StatCard
                title="Сотрудников оценено"
                value={employeesEvaluated}
                icon={<UsersIcon />}
                color="green"
              />
              <StatCard
                title="Приложение 1 / Приложение 2"
                value={`${managerFormAvg !== null ? managerFormAvg.toFixed(2) : '—'} / ${
                  employeeFormAvg !== null ? employeeFormAvg.toFixed(2) : '—'
                }`}
                icon={<DocumentIcon />}
                subtitle="Средние баллы по формам"
                color="default"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Топ-10 групп по баллам</h3>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 5]} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, 'Балл']}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            const item = payload[0] as { payload?: { fullName?: string } };
                            return item?.payload?.fullName || String(label);
                          }
                          return String(label);
                        }}
                      />
                      <Bar
                        dataKey="score"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    Нет данных для отображения
                  </div>
                )}
              </div>

              {/* Pie Chart */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Распределение по категориям</h3>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-slate-500">
                    Нет данных для отображения
                  </div>
                )}
              </div>
            </div>

            {/* Groups Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Оценки по группам</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                        Группа
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                        Руководитель
                      </th>
                      <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                        Сотрудники
                      </th>
                      <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                        Оценено
                      </th>
                      <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                        Средний балл
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">
                        Статус
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groups.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                          Нет данных по группам
                        </td>
                      </tr>
                    ) : (
                      groups.map((group) => (
                        <tr key={group.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-medium text-slate-900">{group.name}</td>
                          <td className="px-6 py-4 text-slate-600">{group.leader || '—'}</td>
                          <td className="px-6 py-4 text-center text-slate-600">{group.userCount}</td>
                          <td className="px-6 py-4 text-center text-slate-600">{group.evaluatedCount}</td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getScoreColorClass(
                                group.score
                              )}`}
                            >
                              {group.score !== null ? group.score.toFixed(2) : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{getScoreCategory(group.score)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ScoringReportPage;
