import { useEffect, useState } from 'react';
import api from '../lib/api';

const CATEGORIES = ['VENUE', 'CATERING', 'PHOTOGRAPHY', 'MUSIC', 'DRESS', 'DECORATION', 'INVITATIONS', 'TRANSPORT', 'OTHER'];
const CAT_LABELS = { VENUE: '🏛 Local', CATERING: '🍽 Buffet', PHOTOGRAPHY: '📸 Foto', MUSIC: '🎵 Música', DRESS: '👗 Vestido', DECORATION: '🌸 Decoração', INVITATIONS: '💌 Convites', TRANSPORT: '🚗 Transporte', OTHER: '📦 Outro' };

export default function AdminBudget() {
  const [data, setData] = useState({ items: [], totalEstimated: 0, totalActual: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', category: 'OTHER', estimatedAmount: 0, actualAmount: 0, isPaid: false });

  useEffect(() => { loadBudget(); }, []);

  const loadBudget = async () => {
    const { data } = await api.get('/budget');
    setData(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/budget', { ...form, estimatedAmount: parseFloat(form.estimatedAmount) || 0, actualAmount: parseFloat(form.actualAmount) || 0 });
    setForm({ description: '', category: 'OTHER', estimatedAmount: 0, actualAmount: 0, isPaid: false });
    setShowForm(false);
    loadBudget();
  };

  const togglePaid = async (item) => {
    await api.patch(`/budget/${item.id}`, { isPaid: !item.isPaid, paidDate: !item.isPaid ? new Date().toISOString() : null });
    loadBudget();
  };

  const deleteItem = async (id) => {
    if (!confirm('Remover item?')) return;
    await api.delete(`/budget/${id}`);
    loadBudget();
  };

  const remaining = data.totalEstimated - data.totalActual;

  if (loading) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-gray-800">Orçamento</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800">+ Adicionar</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-gray-500">Estimado</p>
          <p className="text-2xl font-bold text-gray-800">R$ {data.totalEstimated.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-gray-500">Gasto</p>
          <p className="text-2xl font-bold text-amber-700">R$ {data.totalActual.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm text-gray-500">Saldo</p>
          <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {remaining.toFixed(2)}
          </p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 grid grid-cols-2 gap-4">
          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Descrição *" required className="col-span-2 px-3 py-2 border rounded-xl" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-3 py-2 border rounded-xl">
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <input type="number" step="0.01" value={form.estimatedAmount} onChange={e => setForm({...form, estimatedAmount: e.target.value})} placeholder="Valor estimado R$" className="px-3 py-2 border rounded-xl" />
          <input type="number" step="0.01" value={form.actualAmount} onChange={e => setForm({...form, actualAmount: e.target.value})} placeholder="Valor real R$" className="px-3 py-2 border rounded-xl" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.isPaid} onChange={e => setForm({...form, isPaid: e.target.checked})} /> Já pago
          </label>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {data.items.map(item => (
          <div key={item.id} className={`bg-white rounded-xl p-4 shadow-sm flex items-center justify-between ${item.isPaid ? 'opacity-60' : ''}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button onClick={() => togglePaid(item)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${item.isPaid ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                  {item.isPaid && '✓'}
                </button>
                <span className={`font-medium ${item.isPaid ? 'line-through text-gray-400' : 'text-gray-800'}`}>{item.description}</span>
              </div>
              <span className="text-xs ml-7 px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">{CAT_LABELS[item.category] || item.category}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Est: R$ {item.estimatedAmount.toFixed(2)}</span>
              <span className="text-sm font-medium text-gray-800">Real: R$ {item.actualAmount.toFixed(2)}</span>
              <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          </div>
        ))}
        {data.items.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum item no orçamento</p>}
      </div>
    </div>
  );
}
