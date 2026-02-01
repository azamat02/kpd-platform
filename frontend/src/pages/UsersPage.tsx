import React, { useState, useEffect } from 'react';
import { usersApi, groupsApi, User, Group } from '../services/api';
import Layout from '../components/Layout';
import UserTable from '../components/UserTable';
import UserForm from '../components/UserForm';

interface UserFormData {
  fullName: string;
  position: string;
  groupId: number;
  managerId: number | null;
  submitsBasicReport: boolean;
  submitsKpi: boolean;
  canAccessPlatform: boolean;
}

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [generatedLogin, setGeneratedLogin] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ user: User; password: string } | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, groupsRes] = await Promise.all([
        usersApi.getAll(),
        groupsApi.getAll(),
      ]);
      setUsers(usersRes.data);
      setGroups(groupsRes.data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingUser(null);
    setGeneratedPassword(null);
    setGeneratedLogin(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setGeneratedPassword(null);
    setGeneratedLogin(null);
    setShowForm(true);
  };

  const handleDelete = (user: User) => {
    setDeleteConfirm(user);
  };

  const handleRegeneratePassword = async (user: User) => {
    try {
      const response = await usersApi.regeneratePassword(user.id);
      setPasswordModal({
        user,
        password: response.data.generatedPassword,
      });
    } catch (err) {
      setError('Ошибка пересоздания пароля');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await usersApi.delete(deleteConfirm.id);
      await fetchData();
      setDeleteConfirm(null);
    } catch (err) {
      setError('Ошибка удаления пользователя');
    }
  };

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      let response;
      if (editingUser) {
        response = await usersApi.update(editingUser.id, data);
      } else {
        response = await usersApi.create(data);
      }

      if (response.data.generatedPassword || response.data.generatedLogin) {
        setGeneratedPassword(response.data.generatedPassword || null);
        setGeneratedLogin(response.data.generatedLogin || null);
      } else {
        setShowForm(false);
        setEditingUser(null);
        setGeneratedPassword(null);
        setGeneratedLogin(null);
      }

      await fetchData();
    } catch (err) {
      setError('Ошибка сохранения пользователя');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setGeneratedPassword(null);
    setGeneratedLogin(null);
  };

  // Stats
  const totalUsers = users.length;
  const withAccess = users.filter(u => u.canAccessPlatform).length;
  const withKpi = users.filter(u => u.submitsKpi).length;
  const withReport = users.filter(u => u.submitsBasicReport).length;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-slate-500">Загрузка...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Пользователи</h1>
          <p className="mt-1 text-sm text-slate-500">Управление сотрудниками и доступом</p>
        </div>
        <button onClick={handleCreate} className="btn-primary">
          <PlusIcon />
          <span className="ml-2">Добавить</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-400 hover:text-red-600 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Всего</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalUsers}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">С доступом</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{withAccess}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Сдают KPI</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{withKpi}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Сдают отчет</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{withReport}</p>
        </div>
      </div>

      {/* Table */}
      <UserTable
        users={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRegeneratePassword={handleRegeneratePassword}
      />

      {/* User Form Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          users={users}
          groups={groups}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          generatedPassword={generatedPassword}
          generatedLogin={generatedLogin}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
                Удалить пользователя?
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6">
                {deleteConfirm.fullName} будет удален без возможности восстановления
              </p>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button onClick={confirmDelete} className="btn-danger flex-1">
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setPasswordModal(null)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
                Новый пароль
              </h3>
              <p className="text-sm text-slate-500 text-center mb-4">
                для {passwordModal.user.fullName}
              </p>
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <code className="block text-center text-lg font-mono font-medium text-slate-900 select-all">
                  {passwordModal.password}
                </code>
              </div>
              <p className="text-xs text-slate-400 text-center mb-6">
                Сохраните пароль - он показывается только один раз
              </p>
              <button
                onClick={() => setPasswordModal(null)}
                className="btn-primary w-full"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UsersPage;
