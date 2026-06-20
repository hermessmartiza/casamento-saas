import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', side: 'BOTH', category: 'FRIEND', email: '', phone: '' });
  const [filter, setFilter] = useState('');

  useEffect(() => { loadGuests(); }, []);

  const loadGuests = async () => {
    const { data } = await api.get('/guests');
    setGuests(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/guests', form);
    setForm({ name: '', side: 'BOTH', category: 'FRIEND', email: '', phone: '' });
    setShowForm(false);
    loadGuests();
  };

  const toggleRsvp = async (guest, status) => {
    await api.patch(`/guests/${guest.id}`, { rsvpStatus: status });
    loadGuests();
  };

  const deleteGuest = async (id) => {
    if (!confirm('Remover convidado?')) return;
    await api.delete(`/guests/${id}`);
    loadGuests();
  };

  const statusColors = {
    CONFIRMED: 'bg-green-100 text-green-700',
    DECLINED: 'bg-red-100 text-red-700',
    MAYBE: 'bg-yellow-100 text-yellow-700',
    PENDING: 'bg-gray-100 text-gray-500',
  };

  const filtered = filter
    ? guests.filter(g => g.rsvpStatus === filter || g.side === filter || g.category === filter)
    : guests;

  const counts = { total: guests.length, confirmed: guests.filter(g => g.rsvpStatus === 'CONFIRMED').length,
    declined: guests.filter(g => g.rsvpStatus === 'DECLINED').length, pending: guests.filter(g => g.rsvpStatus === 'PENDING').length };

  if (loading) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-gray-800">Convidados</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800"
        >
          + Adicionar
        </button>
      </div>

      {/* Counts */}
      <div className="flex gap-4 mb-6">
        <span className="text-sm text-gray-500">Total: <strong>{counts.total}</strong></span>
        <span className="text-sm text-green-600">Confirmados: <strong>{counts.confirmed}</strong></span>
        <span className="text-sm text-red-600">Recusados: <strong>{counts.declined}</strong></span>
        <span className="text-sm text-gray-400">Pendentes: <strong>{counts.pending}</strong></span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['', 'CONFIRMED', 'DECLINED', 'PENDING', 'GROOM', 'BRIDE', 'BOTH', 'FAMILY', 'FRIEND'].map(f => (
          <button key={f}
            onClick={() => setFilter(filter === f ? '' : f)}
            className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {f || 'Todos'}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-6 grid grid-cols-2 gap-4">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome *" required className="col-span-2 px-3 py-2 border rounded-xl" />
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="px-3 py-2 border rounded-xl" />
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Telefone" className="px-3 py-2 border rounded-xl" />
          <select value={form.side} onChange={e => setForm({...form, side: e.target.value})} className="px-3 py-2 border rounded-xl">
            <option value="GROOM">Noivo</option><option value="BRIDE">Noiva</option><option value="BOTH">Ambos</option>
          </select>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="px-3 py-2 border rounded-xl">
            <option value="FAMILY">Família</option><option value="FRIEND">Amigo</option><option value="COWORKER">Trabalho</option><option value="OTHER">Outro</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm">Salvar</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Cancelar</button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.map(g => (
          <div key={g.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex-1">
              <span className="font-medium text-gray-800">{g.name}</span>
              <div className="text-xs text-gray-400 mt-1">
                {g.email && `${g.email} · `}
                {g.side === 'GROOM' ? '🤵 Noivo' : g.side === 'BRIDE' ? '👰 Noiva' : '💍 Ambos'}
                {' · '}{g.category}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[g.rsvpStatus]}`}>
                {g.rsvpStatus}
              </span>
              <select value={g.rsvpStatus} onChange={e => toggleRsvp(g, e.target.value)}
                className="text-xs border rounded-lg px-2 py-1">
                <option value="PENDING">Pendente</option>
                <option value="CONFIRMED">Confirmado</option>
                <option value="DECLINED">Recusado</option>
                <option value="MAYBE">Talvez</option>
              </select>
              <button onClick={() => deleteGuest(g.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-400 py-8">Nenhum convidado encontrado</p>}
      </div>
    </div>
  );
}
