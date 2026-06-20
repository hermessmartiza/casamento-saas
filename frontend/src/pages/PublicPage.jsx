import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

export default function PublicPage() {
  const { slug } = useParams();
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/wedding/public/${slug}`)
      .then(r => setWedding(r.data))
      .catch(() => setWedding(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;
  if (!wedding) return <div className="min-h-screen flex items-center justify-center text-gray-400">Casamento não encontrado</div>;

  const style = {
    '--primary': wedding.primaryColor,
    '--accent': wedding.accentColor,
  };

  return (
    <div className="min-h-screen" style={style}>
      {/* Hero */}
      <div className="relative h-96 flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: wedding.coverImage ? `url(${wedding.coverImage})` : `linear-gradient(135deg, ${wedding.primaryColor}, ${wedding.accentColor})` }}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative text-center text-white z-10 px-4">
          <h1 className="text-5xl font-serif mb-4">{wedding.coupleName}</h1>
          <p className="text-xl">{wedding.partner1Name} & {wedding.partner2Name}</p>
          {wedding.weddingDate && (
            <p className="text-lg mt-4 opacity-80">
              {new Date(wedding.weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {wedding.location && <p className="text-lg opacity-80">{wedding.location}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-16 px-4">
        {wedding.description && (
          <p className="text-lg text-gray-700 leading-relaxed text-center">{wedding.description}</p>
        )}
        <div className="mt-12 text-center space-y-4">
          <a
            href={`/${slug}/rsvp`}
            className="inline-block px-8 py-4 rounded-full text-white font-medium text-lg shadow-lg hover:shadow-xl transition"
            style={{ backgroundColor: wedding.primaryColor }}
          >
            ✨ Confirmar Presença
          </a>
          <br />
          <a
            href={`/${slug}/admin/login`}
            className="inline-block px-6 py-3 rounded-full text-white font-medium text-sm opacity-80 hover:opacity-100"
            style={{ backgroundColor: wedding.primaryColor }}
          >
            Área dos Noivos
          </a>
        </div>
      </div>
    </div>
  );
}
