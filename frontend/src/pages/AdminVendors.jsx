import { useEffect, useState } from 'react';
import api from '../lib/api';

const CATEGORIES = ['VENUE', 'CATERING', 'PHOTOGRAPHY', 'MUSIC', 'FLOWERS', 'DRESS', 'OTHER'];
const CAT_LABELS = { VENUE: '🏛 Local', CATERING: '🍽 Buffet', PHOTOGRAPHY: '📸 Fotografia', MUSIC: '🎵 Música', FLOWERS: '💐 Flores', DRESS: '👗 Vestido', OTHER: '📦 Outro' };

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'OTHER', contactName: '', email: '', phone: '', contractValue: 0, notes: '' });

  useEffect(() => { loadVendors(); }, []);

  const loadVendors = async () => {
    const { data } = await api.get('/vendors');
    setVendors(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/vendors', { ...form, contractValue: parseFloat(form.contractValue) || 0 });
    setForm({ name: '', category: 'OTHER', contactName: '', email: '', phone: '', contractValue: 0, notes: '' });
    setShowForm(false);
    loadVendors();
  };

  const deleteVendor = async (id) => {
    if (!confirm('Remover fornecedor?')) return;
    await api.delete(`/vendors/${id}`);
    loadVendors();
  };

  if (loading) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-gray-800">Fornecedores</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800">+ Adicionar</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 grid grid-cols-2 gap-4">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome *" required className="col-span-2 px-3 py-2 border rounded-xl" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-3 py-2 border rounded-xl">
            {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
          </select>
          <input type="number" step="0.01" value={form.contractValue} onChange={e => setForm({...form, contractValue: e.target.value})} placeholder="Valor contrato R$" className="px-3 py-2 border rounded-xl" />
          <input value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} placeholder="Contato" className="px-3 py-2 border rounded-xl" />
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="px-3 py-2 border rounded-xl" />
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Telefone" className="px-3 py-2 border rounded-xl" />
          <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Observações" className="col-span-2 px-3 py-2 border rounded-xl" />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {vendors.map(v => (
          <div key={v.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex-1">
              <span className="font-medium text-gray-800">{v.name}</span>
              <span className="text-xs ml-2 px-2 py-0.5 bg-gray-100 rounded-full">{CAT_LABELS[v.category] || v.category}</span>
              {v.contactName && <span className="text-xs text-gray-400 ml-2">· {v.contactName}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">R$ {v.contractValue.toFixed(2)}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : v.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                {v.paymentStatus === 'PAID' ? 'Pago' : v.paymentStatus === 'PARTIAL' ? 'Parcial' : 'Pendente'}
              </span>
              <button onClick={() => deleteVendor(v.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          </div>
        ))}
        {vendors.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum fornecedor cadastrado</p>}
      </div>
    </div>
  );
}
