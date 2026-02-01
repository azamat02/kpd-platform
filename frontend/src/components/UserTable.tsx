import React from 'react';
import { User } from '../services/api';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onRegeneratePassword: (user: User) => void;
}

const CheckIcon: React.FC = () => (
  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MinusIcon: React.FC = () => (
  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const KeyIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, onRegeneratePassword }) => {
  if (users.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">Нет пользователей</p>
          <p className="text-slate-400 text-xs mt-1">Добавьте первого пользователя</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="table-header">Пользователь</th>
              <th className="table-header">Группа</th>
              <th className="table-header">Начальник</th>
              <th className="table-header">Логин</th>
              <th className="table-header text-center">Отчет</th>
              <th className="table-header text-center">KPI</th>
              <th className="table-header text-center">Доступ</th>
              <th className="table-header text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-slate-600">
                        {user.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.position}</p>
                    </div>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="badge-info">{user.group.name}</span>
                </td>
                <td className="table-cell">
                  <span className="text-sm text-slate-600">
                    {user.manager ? user.manager.fullName : <span className="text-slate-400">-</span>}
                  </span>
                </td>
                <td className="table-cell">
                  {user.login ? (
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600">
                      {user.login}
                    </code>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="table-cell text-center">
                  <div className="flex justify-center">
                    {user.submitsBasicReport ? <CheckIcon /> : <MinusIcon />}
                  </div>
                </td>
                <td className="table-cell text-center">
                  <div className="flex justify-center">
                    {user.submitsKpi ? <CheckIcon /> : <MinusIcon />}
                  </div>
                </td>
                <td className="table-cell text-center">
                  <div className="flex justify-center">
                    {user.canAccessPlatform ? <CheckIcon /> : <MinusIcon />}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <EditIcon />
                    </button>
                    {user.canAccessPlatform && (
                      <button
                        onClick={() => onRegeneratePassword(user)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Новый пароль"
                      >
                        <KeyIcon />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(user)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    </div>
  );
};

export default UserTable;
