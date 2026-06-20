import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

export default function SelfRegisterPage() {
  const { slug } = useParams();
  const [wedding, setWedding] = useState(null);
  const [step, setStep] = useState('form'); // form | payment | done
  const [form, setForm] = useState({ name: '', email: '', phone: '', adultCount: 1, childCount: 0, dietaryRestrictions: '' });
  const [pix, setPix] = useState(null);
  const [amount, setAmount] = useState(0);
  const [guestId, setGuestId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/wedding/public/${slug}`)
      .then(r => setWedding(r.data))
      .catch(() => setWedding(null));
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/guests/self-register/${slug}`, form);
      setGuestId(data.guest.id);
      if (data.paymentRequired) {
        if (data.pix) {
          setPix(data.pix);
          setAmount(data.amount);
          setStep('payment');
        } else {
          setError(data.pixError || 'Erro ao gerar pagamento');
          setStep('done');
        }
      } else {
        setStep('done');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao registrar');
    }
    setLoading(false);
  };

  // Poll payment status
  useEffect(() => {
    if (step !== 'payment' || !guestId) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/guests/check-payment/${guestId}`);
        if (data.status === 'PAID') {
          setStep('done');
          clearInterval(interval);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [step, guestId]);

  const copyPix = () => {
    if (!pix?.pixCode) return;
    navigator.clipboard.writeText(pix.pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!wedding) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;

  const pricePerGuest = wedding.pricePerGuest || 0;
  const pricePerChild = wedding.pricePerChild || 0;
  const hasPrice = pricePerGuest > 0;
  const estimatedTotal = (form.adultCount * pricePerGuest) + (form.childCount * pricePerChild);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-center py-10 px-4" style={{ backgroundColor: wedding.primaryColor, color: '#fff' }}>
        <h1 className="text-3xl font-serif mb-2">{wedding.coupleName}</h1>
        <p className="text-lg opacity-80">Confirme sua presença</p>
        {wedding.weddingDate && (
          <p className="text-sm opacity-70 mt-1">
            {new Date(wedding.weddingDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {step === 'done' ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-serif mb-2">Presença Confirmada!</h2>
            <p className="text-gray-500">{form.name}, sua presença foi registrada com sucesso.</p>
            {form.adultCount > 1 && <p className="text-sm text-gray-400 mt-2">{form.adultCount} adultos</p>}
            {form.childCount > 0 && <p className="text-sm text-gray-400">{form.childCount} criança(s)</p>}
            <p className="text-sm text-gray-400 mt-4">Nos vemos no grande dia! 💒</p>
          </div>
        ) : step === 'payment' ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-serif mb-4">Pagamento</h2>
            <p className="text-3xl font-bold text-amber-700 mb-6">
              R$ {amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {form.adultCount} adulto(s) × R$ {pricePerGuest.toFixed(2)}
              {form.childCount > 0 && ` + ${form.childCount} criança(s) × R$ ${pricePerChild.toFixed(2)}`}
            </p>

            {pix?.qrcode && (
              <img src={pix.qrcode} alt="QR Code PIX" className="w-48 h-48 mx-auto mb-4 border rounded-xl" />
            )}

            {pix?.pixCode && (
              <div>
                <p className="text-sm text-gray-500 mb-2">PIX Copia e Cola:</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-gray-100 p-3 rounded-xl text-xs break-all text-left">{pix.pixCode}</code>
                  <button onClick={copyPix}
                    className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm hover:bg-amber-800 whitespace-nowrap">
                    {copied ? '✓ Copiado' : '📋 Copiar'}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700">
              ⏳ Aguardando pagamento... Assim que o PIX for confirmado, sua presença será registrada automaticamente.
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-serif text-center mb-6">Registrar Presença</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Seu nome completo *" required
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="Email" type="email"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                placeholder="Telefone / WhatsApp"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />

              {hasPrice && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800 mb-3">Valores:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Adultos (R$ {pricePerGuest.toFixed(2)} cada)</label>
                      <select value={form.adultCount} onChange={e => setForm({...form, adultCount: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-xl mt-1 bg-white">
                        {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Crianças {pricePerChild > 0 ? `(R$ ${pricePerChild.toFixed(2)})` : '(grátis)'}</label>
                      <select value={form.childCount} onChange={e => setForm({...form, childCount: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-xl mt-1 bg-white">
                        {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                  {estimatedTotal > 0 && (
                    <p className="text-lg font-bold text-amber-800 mt-3 text-center">
                      Total: R$ {estimatedTotal.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <input value={form.dietaryRestrictions} onChange={e => setForm({...form, dietaryRestrictions: e.target.value})}
                placeholder="Restrições alimentares (opcional)"
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500" />

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-medium text-lg transition"
                style={{ backgroundColor: wedding.primaryColor }}>
                {loading ? 'Registrando...' : hasPrice && estimatedTotal > 0 ? `Confirmar e Pagar R$ ${estimatedTotal.toFixed(2)}` : 'Confirmar Presença ✨'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
