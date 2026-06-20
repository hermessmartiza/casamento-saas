import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function AdminLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/wedding/login', { slug, password });
      localStorage.setItem('wedding_token', data.token);
      localStorage.setItem('wedding_slug', slug);
      navigate(`/${slug}/admin`);
    } catch {
      setError('Senha incorreta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-serif text-center mb-6">Área dos Noivos</h1>
        <p className="text-center text-gray-500 text-sm mb-6">{slug}</p>
        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-700 text-white rounded-xl font-medium hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
