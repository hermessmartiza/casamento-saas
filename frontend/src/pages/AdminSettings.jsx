import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminSettings() {
  const [wedding, setWedding] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [certExists, setCertExists] = useState(false);
  const [certUploading, setCertUploading] = useState(false);

  useEffect(() => {
    api.get('/wedding/me').then(r => {
      setWedding(r.data);
      setForm({
        coupleName: r.data.coupleName || '',
        partner1Name: r.data.partner1Name || '',
        partner2Name: r.data.partner2Name || '',
        weddingDate: r.data.weddingDate ? r.data.weddingDate.split('T')[0] : '',
        location: r.data.location || '',
        description: r.data.description || '',
        primaryColor: r.data.primaryColor || '#6D4720',
        accentColor: r.data.accentColor || '#8B6535',
        pixKey: r.data.pixKey || '',
        pricePerGuest: r.data.pricePerGuest || '',
        pricePerChild: r.data.pricePerChild || '',
        efiClientId: r.data.efiClientId || '',
        efiClientSecret: r.data.efiClientSecret || '',
        efiPixKey: r.data.efiPixKey || '',
        efiSandbox: r.data.efiSandbox !== false,
        isPublic: r.data.isPublic !== false,
      });
      setLoading(false);
    });
    api.get('/wedding/cert-status').then(r => setCertExists(r.data.exists)).catch(() => {});
  }, []);

  const handleSave = async () => {
    const data = {
      ...form,
      pricePerGuest: form.pricePerGuest ? parseFloat(form.pricePerGuest) : null,
      pricePerChild: form.pricePerChild ? parseFloat(form.pricePerChild) : null,
    };
    if (data.weddingDate) data.weddingDate = new Date(data.weddingDate).toISOString();
    await api.patch('/wedding/me', data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCertUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCertUploading(true);
    try {
      const formData = new FormData();
      formData.append('cert', file);
      await api.post('/wedding/cert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCertExists(true);
    } catch (err) {
      alert('Erro ao enviar certificado: ' + (err.response?.data?.error || err.message));
    }
    setCertUploading(false);
  };

  if (loading) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-gray-800">Configurações</h1>
        <button onClick={handleSave}
          className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800">
          {saved ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-4">Informações Básicas</h3>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.coupleName} onChange={e => setForm({...form, coupleName: e.target.value})}
              placeholder="Nome do casal" className="col-span-2 px-3 py-2 border rounded-xl" />
            <input value={form.partner1Name} onChange={e => setForm({...form, partner1Name: e.target.value})}
              placeholder="Noivo" className="px-3 py-2 border rounded-xl" />
            <input value={form.partner2Name} onChange={e => setForm({...form, partner2Name: e.target.value})}
              placeholder="Noiva" className="px-3 py-2 border rounded-xl" />
            <input type="date" value={form.weddingDate} onChange={e => setForm({...form, weddingDate: e.target.value})}
              className="px-3 py-2 border rounded-xl" />
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              placeholder="Local" className="px-3 py-2 border rounded-xl" />
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Descrição/mensagem" rows={3} className="col-span-2 px-3 py-2 border rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-xs text-gray-500">Cor Principal</label>
              <input type="color" value={form.primaryColor} onChange={e => setForm({...form, primaryColor: e.target.value})}
                className="w-full h-10 rounded-xl border cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Cor de Destaque</label>
              <input type="color" value={form.accentColor} onChange={e => setForm({...form, accentColor: e.target.value})}
                className="w-full h-10 rounded-xl border cursor-pointer" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublic} onChange={e => setForm({...form, isPublic: e.target.checked})}
                  className="w-5 h-5" />
                <span className="text-sm text-gray-600">Site público</span>
              </label>
            </div>
          </div>
        </div>

        {/* PIX + Gift */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-4">Chave PIX (presentes)</h3>
          <input value={form.pixKey} onChange={e => setForm({...form, pixKey: e.target.value})}
            placeholder="Chave PIX (email, CPF, telefone ou aleatória)"
            className="w-full px-3 py-2 border rounded-xl text-sm" />
          <p className="text-xs text-gray-400 mt-1">Aparece na página de confirmação de presença pros convidados presentearem.</p>
        </div>

        {/* Pricing + EFI */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-medium text-gray-700 mb-4">💰 Cobrança por Convidado</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure o valor por pessoa. Convidadas se registram em /{wedding?.slug}/register e pagam via PIX.
            Deixe 0 para entrada gratuita.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-gray-500">Valor por adulto (R$)</label>
              <input type="number" step="0.01" value={form.pricePerGuest} onChange={e => setForm({...form, pricePerGuest: e.target.value})}
                placeholder="0 = gratuito" className="w-full px-3 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Valor por criança (R$)</label>
              <input type="number" step="0.01" value={form.pricePerChild} onChange={e => setForm({...form, pricePerChild: e.target.value})}
                placeholder="0 = gratuito" className="w-full px-3 py-2 border rounded-xl" />
            </div>
          </div>

          <h4 className="font-medium text-gray-600 text-sm mb-3 mt-6">🔐 EFI Pay (obrigatório para cobrança)</h4>
          <div className="grid grid-cols-2 gap-4">
            <input value={form.efiClientId} onChange={e => setForm({...form, efiClientId: e.target.value})}
              placeholder="Client ID EFI" className="px-3 py-2 border rounded-xl text-sm" />
            <input value={form.efiClientSecret} onChange={e => setForm({...form, efiClientSecret: e.target.value})}
              placeholder="Client Secret EFI" type="password" className="px-3 py-2 border rounded-xl text-sm" />
            <input value={form.efiPixKey} onChange={e => setForm({...form, efiPixKey: e.target.value})}
              placeholder="Chave PIX EFI" className="px-3 py-2 border rounded-xl text-sm" />
            <label className="flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer">
              <input type="checkbox" checked={form.efiSandbox} onChange={e => setForm({...form, efiSandbox: e.target.checked})} />
              <span className="text-sm text-gray-600">Sandbox (testes)</span>
            </label>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-2">📎 Certificado .p12</p>
            <div className="flex items-center gap-3">
              <label className={`px-4 py-2 rounded-xl text-sm cursor-pointer transition ${
                certUploading ? 'bg-gray-300' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              }`}>
                {certUploading ? 'Enviando...' : certExists ? '🔄 Substituir' : '📤 Upload .p12'}
                <input type="file" accept=".p12,.pfx" onChange={handleCertUpload} className="hidden" disabled={certUploading} />
              </label>
              {certExists && <span className="text-sm text-green-600">✅ Certificado instalado</span>}
            </div>
            <p className="text-xs text-gray-400 mt-2">Obrigatório para produção (sandbox não precisa).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
