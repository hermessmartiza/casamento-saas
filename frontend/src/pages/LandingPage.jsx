import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slug: '', coupleName: '', partner1Name: '', partner2Name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/wedding/register', form);
      localStorage.setItem('wedding_token', data.token);
      localStorage.setItem('wedding_slug', form.slug);
      navigate(`/${form.slug}/admin`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Hero */}
      <header className="text-center pt-20 pb-12 px-4">
        <h1 className="text-5xl md:text-6xl font-serif text-amber-900 mb-4">
          Seu casamento,<br />organizado com amor 💒
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A plataforma completa para planejar seu casamento: convidados, fornecedores, orçamento e cronograma — tudo em um só lugar.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button onClick={() => setShowForm(true)}
            className="px-8 py-4 bg-amber-700 text-white rounded-2xl text-lg font-medium hover:bg-amber-800 shadow-lg transition">
            Criar meu site grátis
          </button>
          <a href="/demo"
            className="px-8 py-4 border-2 border-amber-700 text-amber-700 rounded-2xl text-lg font-medium hover:bg-amber-50 transition">
            Ver demo
          </a>
        </div>
      </header>

      {/* Registration modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-serif text-center mb-6">Criar site do casamento</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input value={form.slug} onChange={e => setForm({...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                placeholder="Nome do site (ex: joao-e-maria)" required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input value={form.coupleName} onChange={e => setForm({...form, coupleName: e.target.value})}
                placeholder="Nome do casal (ex: João & Maria)" required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input value={form.partner1Name} onChange={e => setForm({...form, partner1Name: e.target.value})}
                placeholder="Nome do noivo" required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input value={form.partner2Name} onChange={e => setForm({...form, partner2Name: e.target.value})}
                placeholder="Nome da noiva" required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                placeholder="Senha de admin" required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-amber-700 text-white rounded-xl font-medium hover:bg-amber-800 disabled:opacity-50">
                {loading ? 'Criando...' : 'Criar site'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '👥', title: 'Convidados', desc: 'Gerencie sua lista, RSVP online, mesas e confirmações.' },
            { icon: '🤝', title: 'Fornecedores', desc: 'Cadastre e acompanhe contratos, pagamentos e contatos.' },
            { icon: '💰', title: 'Orçamento', desc: 'Controle estimado vs real, veja totais por categoria.' },
            { icon: '📅', title: 'Cronograma', desc: 'Tarefas organizadas por prioridade e prazo.' },
          ].map(f => (
            <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition text-center">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-medium text-gray-800 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-amber-50 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-serif text-amber-900 mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Crie seu site', desc: 'Escolha um nome, cadastre o casal e já tenha uma página online.' },
              { step: '2', title: 'Organize tudo', desc: 'Adicione convidados, fornecedores, orçamento e cronograma.' },
              { step: '3', title: 'Compartilhe', desc: 'Envie o link pros convidados confirmarem presença e presentearem.' },
            ].map(s => (
              <div key={s.step}>
                <div className="w-12 h-12 bg-amber-700 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">{s.step}</div>
                <h3 className="font-medium text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 px-4">
        <h2 className="text-3xl font-serif text-amber-900 mb-4">Pronto pra começar?</h2>
        <p className="text-gray-500 mb-8">Crie seu site de casamento em 1 minuto. Grátis.</p>
        <button onClick={() => setShowForm(true)}
          className="px-8 py-4 bg-amber-700 text-white rounded-2xl text-lg font-medium hover:bg-amber-800 shadow-lg transition">
          Criar meu site agora
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 border-t">
        Casamento SaaS — Planeje seu casamento com amor
      </footer>
    </div>
  );
}
