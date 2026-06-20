import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

export default function AdminDashboard() {
  const { slug } = useParams();
  const [wedding, setWedding] = useState(null);

  useEffect(() => {
    api.get('/wedding/me').then(r => {
      const w = r.data;
      setWedding(w);
      // Update slug in local storage
      localStorage.setItem('wedding_slug', w.slug);
    });
  }, []);

  if (!wedding) return <div className="text-gray-400">Carregando...</div>;

  const stats = [
    { label: 'Convidados', value: wedding._count?.guests || 0, icon: '👥', color: 'bg-blue-100 text-blue-800' },
    { label: 'Fornecedores', value: wedding._count?.vendors || 0, icon: '🤝', color: 'bg-green-100 text-green-800' },
    { label: 'Itens Orçamento', value: wedding._count?.budgetItems || 0, icon: '💰', color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Tarefas', value: wedding._count?.timelineTasks || 0, icon: '📅', color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-serif text-gray-800 mb-2">{wedding.coupleName}</h1>
      <p className="text-gray-500 mb-8">
        {wedding.weddingDate && `📅 ${new Date(wedding.weddingDate).toLocaleDateString('pt-BR')}`}
        {wedding.location && ` · 📍 ${wedding.location}`}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-6`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="text-sm opacity-70">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h3 className="font-medium text-gray-700 mb-4">Informações do Site</h3>
        <p className="text-sm text-gray-500">
          Link público: <a href={`/${wedding.slug}`} className="text-amber-700 underline" target="_blank">/{wedding.slug}</a>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Site {wedding.isPublic ? '🌐 público' : '🔒 privado'}
        </p>
      </div>
    </div>
  );
}
