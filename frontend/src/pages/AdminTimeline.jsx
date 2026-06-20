import { useEffect, useState } from 'react';
import api from '../lib/api';

const CATEGORIES = ['BEFORE_WEDDING', 'WEDDING_DAY', 'AFTER_WEDDING'];
const CAT_LABELS = { BEFORE_WEDDING: '📋 Antes', WEDDING_DAY: '💒 Dia D', AFTER_WEDDING: '🏖 Depois' };
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const PRI_COLORS = { LOW: 'bg-gray-100 text-gray-500', MEDIUM: 'bg-yellow-100 text-yellow-700', HIGH: 'bg-red-100 text-red-700' };

export default function AdminTimeline() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'BEFORE_WEDDING', priority: 'MEDIUM', dueDate: '', assignedTo: '', notes: '' });
  const [filter, setFilter] = useState('');

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    const { data } = await api.get('/timeline');
    setTasks(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/timeline', { ...form, status: 'PENDING' });
    setForm({ title: '', category: 'BEFORE_WEDDING', priority: 'MEDIUM', dueDate: '', assignedTo: '', notes: '' });
    setShowForm(false);
    loadTasks();
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === 'DONE' ? 'PENDING' : 'DONE';
    await api.patch(`/timeline/${task.id}`, { status: newStatus });
    loadTasks();
  };

  const deleteTask = async (id) => {
    if (!confirm('Remover tarefa?')) return;
    await api.delete(`/timeline/${id}`);
    loadTasks();
  };

  const filtered = filter ? tasks.filter(t => t.status === filter || t.category === filter) : tasks;

  const stats = { total: tasks.length, done: tasks.filter(t => t.status === 'DONE').length, inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length };

  if (loading) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-gray-800">Cronograma</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800">+ Adicionar</button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-sm text-gray-500">Progresso:</span>
          <span className="text-sm font-medium">{stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${stats.total > 0 ? (stats.done / stats.total * 100) : 0}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['', 'PENDING', 'IN_PROGRESS', 'DONE', 'BEFORE_WEDDING', 'WEDDING_DAY', 'AFTER_WEDDING'].map(f => (
          <button key={f}
            onClick={() => setFilter(filter === f ? '' : f)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {f || 'Todas'}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 grid grid-cols-2 gap-4">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Título *" required className="col-span-2 px-3 py-2 border rounded-xl" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-3 py-2 border rounded-xl">
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="px-3 py-2 border rounded-xl">
            {PRIORITIES.map(p => <option key={p} value={p}>{p === 'HIGH' ? '🔴 Alta' : p === 'MEDIUM' ? '🟡 Média' : '🟢 Baixa'}</option>)}
          </select>
          <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="px-3 py-2 border rounded-xl" />
          <input value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} placeholder="Responsável" className="px-3 py-2 border rounded-xl" />
          <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Observações" className="col-span-2 px-3 py-2 border rounded-xl" />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {filtered.map(task => (
          <div key={task.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-center justify-between ${task.status === 'DONE' ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3 flex-1">
              <button onClick={() => toggleStatus(task)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                {task.status === 'DONE' && '✓'}
              </button>
              <div>
                <span className={`font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                <div className="flex gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${PRI_COLORS[task.priority]}`}>{task.priority}</span>
                  <span className="text-xs text-gray-400">{CAT_LABELS[task.category]}</span>
                  {task.dueDate && <span className="text-xs text-gray-400">📅 {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>}
                  {task.assignedTo && <span className="text-xs text-gray-400">👤 {task.assignedTo}</span>}
                </div>
              </div>
            </div>
            <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 text-sm ml-4">✕</button>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">Nenhuma tarefa encontrada</p>}
      </div>
    </div>
  );
}
