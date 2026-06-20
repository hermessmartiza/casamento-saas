import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

export default function RsvpPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const guestIdParam = searchParams.get('id');

  const [wedding, setWedding] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [pixKey, setPixKey] = useState('');
  const [searchName, setSearchName] = useState('');
  const [results, setResults] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState('');
  const [plusOneName, setPlusOneName] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/wedding/public/${slug}`)
      .then(r => {
        setWedding(r.data);
        setPixKey(r.data.pixKey || '');
      })
      .catch(() => setWedding(null));

    api.get(`/gifts/public/${slug}`)
      .then(r => {
        setGifts(r.data.gifts || []);
        if (r.data.pixKey) setPixKey(r.data.pixKey);
      })
      .catch(() => {});

    if (guestIdParam) {
      api.get(`/guests/public/${slug}?guestId=${guestIdParam}`)
        .then(r => {
          if (r.data) {
            setSelectedGuest(r.data);
            setRsvpStatus(r.data.rsvpStatus);
            setPlusOneName(r.data.plusOneName || '');
            setDietaryRestrictions(r.data.dietaryRestrictions || '');
          }
        }).catch(() => {});
    }
  }, [slug, guestIdParam]);

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/guests/public/${slug}?name=${encodeURIComponent(searchName)}`);
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleRsvp = async () => {
    if (!selectedGuest || !rsvpStatus) return;
    setLoading(true);
    try {
      await api.patch(`/guests/rsvp/${selectedGuest.id}`, {
        rsvpStatus, plusOneName: selectedGuest.plusOne ? plusOneName : undefined,
        dietaryRestrictions: dietaryRestrictions || undefined,
      });
      setMessage(rsvpStatus === 'CONFIRMED' ? '✅ Presença confirmada! Veja nossa lista de presentes abaixo 💝' : '📝 Obrigado por avisar!');
    } catch { setMessage('❌ Erro. Tente novamente.'); }
    setLoading(false);
  };

  const copyPix = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!wedding) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-center py-12 px-4" style={{ backgroundColor: wedding.primaryColor, color: '#fff' }}>
        <h1 className="text-3xl font-serif mb-2">{wedding.coupleName}</h1>
        <p className="text-lg opacity-80">Confirme sua presença</p>
        {wedding.weddingDate && (
          <p className="text-sm opacity-70 mt-1">{new Date(wedding.weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {message ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-lg text-center mb-6">{message}</p>
            {message.includes('Confirmada') && (
              <div className="space-y-8">
                {pixKey && (
                  <div className="bg-green-50 rounded-2xl p-6 text-center">
                    <p className="text-sm text-gray-600 mb-3">💝 Quer nos presentear? Use nosso PIX:</p>
                    <div className="flex items-center gap-2 max-w-xs mx-auto">
                      <code className="flex-1 bg-white px-3 py-2 rounded-lg text-xs break-all border">{pixKey}</code>
                      <button onClick={copyPix} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-green-700">
                        {copied ? '✓ Copiado' : '📋 Copiar'}
                      </button>
                    </div>
                  </div>
                )}
                {gifts.length > 0 && (
                  <div>
                    <h3 className="text-center font-serif text-lg mb-4">🎁 Lista de Presentes</h3>
                    <div className="space-y-3">
                      {gifts.map(g => (
                        <div key={g.id} className="bg-white border rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{g.name}</p>
                            {g.description && <p className="text-sm text-gray-500">{g.description}</p>}
                            {g.price && <p className="text-sm font-medium text-amber-700">R$ {g.price.toFixed(2)}</p>}
                          </div>
                          {g.linkUrl && (
                            <a href={g.linkUrl} target="_blank" rel="noopener"
                              className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200">
                              Comprar
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => { setMessage(''); setSelectedGuest(null); setResults([]); }}
                  className="block mx-auto text-amber-700 underline text-sm">Confirmar outro convidado</button>
              </div>
            )}
          </div>
        ) : selectedGuest ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-serif text-center mb-2">Olá, {selectedGuest.name}!</h2>
            {selectedGuest.plusOne && <p className="text-sm text-gray-500 text-center mb-6">Você tem direito a 1 acompanhante</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sua presença:</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ value: 'CONFIRMED', label: '✅ Confirmado', color: 'border-green-500 bg-green-50' },
                    { value: 'DECLINED', label: '❌ Recusado', color: 'border-red-500 bg-red-50' }]
                    .map(opt => (
                      <button key={opt.value} onClick={() => setRsvpStatus(opt.value)}
                        className={`p-4 rounded-xl border-2 text-center transition ${rsvpStatus === opt.value ? opt.color : 'border-gray-200 hover:border-gray-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                </div>
              </div>
              {selectedGuest.plusOne && rsvpStatus === 'CONFIRMED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do acompanhante:</label>
                  <input value={plusOneName} onChange={e => setPlusOneName(e.target.value)} placeholder="Nome" className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restrições alimentares:</label>
                <input value={dietaryRestrictions} onChange={e => setDietaryRestrictions(e.target.value)} placeholder="Ex: vegetariano, alergia a nozes..." className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button onClick={handleRsvp} disabled={loading || !rsvpStatus}
                className="w-full py-3 rounded-xl text-white font-medium transition"
                style={{ backgroundColor: rsvpStatus ? wedding.primaryColor : '#ccc' }}>
                {loading ? 'Enviando...' : 'Confirmar'}
              </button>
              <button onClick={() => { setSelectedGuest(null); setResults([]); }} className="w-full text-sm text-gray-400 hover:text-gray-600">Voltar</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <p className="text-gray-500 text-center mb-6">Digite seu nome para confirmar presença</p>
            <div className="flex gap-2">
              <input value={searchName} onChange={e => setSearchName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Seu nome" className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" autoFocus />
              <button onClick={handleSearch} disabled={loading} className="px-6 py-3 bg-amber-700 text-white rounded-xl font-medium hover:bg-amber-800 disabled:opacity-50">Buscar</button>
            </div>
            {results.length > 0 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-500 mb-2">Selecione seu nome:</p>
                {results.map(g => (
                  <button key={g.id} onClick={() => { setSelectedGuest(g); setRsvpStatus(g.rsvpStatus); setPlusOneName(g.plusOneName || ''); setDietaryRestrictions(g.dietaryRestrictions || ''); }}
                    className="w-full text-left px-4 py-3 rounded-xl border hover:border-amber-500 transition flex items-center justify-between">
                    <span>{g.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${g.rsvpStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' : g.rsvpStatus === 'DECLINED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      {g.rsvpStatus === 'CONFIRMED' ? 'Confirmado' : g.rsvpStatus === 'DECLINED' ? 'Recusado' : 'Pendente'}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {results.length === 0 && searchName && !loading && <p className="text-center text-gray-400 mt-4">Nenhum convidado encontrado.</p>}
          </div>
        )}

        {/* Gifts & PIX section visible to anyone */}
        {!message && (
          <div className="mt-12 space-y-8">
            {pixKey && (
              <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                <h3 className="font-serif text-lg mb-3">💝 Presente em dinheiro</h3>
                <p className="text-sm text-gray-500 mb-3">PIX dos noivos:</p>
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-xs break-all">{pixKey}</code>
                  <button onClick={copyPix} className="bg-amber-700 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-amber-800">
                    {copied ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            )}
            {gifts.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-serif text-lg mb-4 text-center">🎁 Lista de Presentes</h3>
                <div className="space-y-3">
                  {gifts.map(g => (
                    <div key={g.id} className="border rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{g.name}</p>
                        {g.description && <p className="text-sm text-gray-500">{g.description}</p>}
                        {g.price && <p className="text-sm font-medium text-amber-700">R$ {g.price.toFixed(2)}</p>}
                      </div>
                      {g.linkUrl && (
                        <a href={g.linkUrl} target="_blank" rel="noopener"
                          className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200">Comprar</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
