import { useEffect, useState } from 'react';
import api from '../lib/api';

const SECTION_TYPES = {
  hero: { label: '🎬 Hero (capa)', defaultContent: {} },
  text: { label: '📝 Texto', defaultContent: { text: '' } },
  photos: { label: '📸 Fotos', defaultContent: { photos: [] } },
  timeline: { label: '📅 Linha do Tempo', defaultContent: { events: [] } },
  info: { label: 'ℹ️ Informações', defaultContent: { items: [] } },
  map: { label: '🗺 Mapa', defaultContent: { embedUrl: '' } },
};

export default function AdminSections() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // section being edited
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await api.get('/sections');
    setSections(data);
    setLoading(false);
  };

  const add = async (type) => {
    const def = SECTION_TYPES[type];
    await api.post('/sections', {
      type,
      title: '',
      content: { ...def.defaultContent },
      sortOrder: sections.length,
      isVisible: true,
    });
    setShowAdd(false);
    load();
  };

  const toggleVisibility = async (s) => {
    await api.patch(`/sections/${s.id}`, { isVisible: !s.isVisible });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Remover esta seção?')) return;
    await api.delete(`/sections/${id}`);
    load();
  };

  const move = async (id, direction) => {
    const idx = sections.findIndex(s => s.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const newSections = [...sections];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];
    const ids = newSections.map(s => s.id);
    await api.put('/sections/reorder', { ids });
    load();
  };

  if (loading) return <div className="text-gray-400">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-gray-800">Editor do Site</h1>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm font-medium hover:bg-amber-800">
          + Adicionar Seção
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Tipo de seção:</h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(SECTION_TYPES).map(([type, info]) => (
              <button key={type} onClick={() => add(type)}
                className="p-4 border rounded-xl hover:border-amber-500 text-left transition">
                <div className="text-lg">{info.label.split(' ')[0]}</div>
                <div className="text-xs text-gray-500">{info.label.split(' ').slice(1).join(' ')}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(false)} className="mt-4 text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
          <p className="text-4xl mb-4">📄</p>
          <p>Nenhuma seção ainda.</p>
          <p className="text-sm">Adicione seções para personalizar o site público.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, idx) => (
            <div key={s.id} className={`bg-white rounded-xl p-4 shadow-sm ${!s.isVisible ? 'opacity-50' : ''}`}>
              {editing?.id === s.id ? (
                <SectionEditor section={s} onSave={async (data) => {
                  await api.patch(`/sections/${s.id}`, data);
                  setEditing(null);
                  load();
                }} onCancel={() => setEditing(null)} />
              ) : (
                <div className="flex items-center gap-4">
                  {/* Move buttons */}
                  <div className="flex flex-col gap-1">
                    <button onClick={() => move(s.id, 'up')} disabled={idx === 0}
                      className="text-xs px-1 py-0.5 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30">▲</button>
                    <button onClick={() => move(s.id, 'down')} disabled={idx === sections.length - 1}
                      className="text-xs px-1 py-0.5 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-30">▼</button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{SECTION_TYPES[s.type]?.label || s.type}</span>
                      {s.title && <span className="text-sm font-medium text-gray-700 truncate">— {s.title}</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {s.type === 'text' && (s.content?.text || '').substring(0, 80)}
                      {s.type === 'photos' && `${(s.content?.photos || []).length} foto(s)`}
                      {s.type === 'timeline' && `${(s.content?.events || []).length} evento(s)`}
                      {s.type === 'info' && `${(s.content?.items || []).length} item(ns)`}
                      {s.type === 'map' && (s.content?.embedUrl ? 'Mapa configurado' : 'Sem link')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleVisibility(s)}
                      className={`text-xs px-2 py-1 rounded ${s.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.isVisible ? '👁' : '👁‍🗨'}
                    </button>
                    <button onClick={() => setEditing(s)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️</button>
                    <button onClick={() => remove(s.id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100">🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Inline section editor */
function SectionEditor({ section, onSave, onCancel }) {
  const [title, setTitle] = useState(section.title || '');
  const [content, setContent] = useState({ ...section.content });

  const updateField = (path, value) => {
    const keys = path.split('.');
    const newContent = { ...content };
    let obj = newContent;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    setContent(newContent);
  };

  const handleSave = () => onSave({ title, content });

  return (
    <div className="space-y-3">
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Título da seção (opcional)"
        className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />

      {section.type === 'text' && (
        <textarea value={content.text || ''} onChange={e => updateField('text', e.target.value)}
          placeholder="Texto da seção..." rows={4}
          className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      )}

      {section.type === 'photos' && (
        <div className="space-y-2">
          {(content.photos || []).map((url, i) => (
            <div key={i} className="flex gap-2">
              <input value={url} onChange={e => {
                const photos = [...(content.photos || [])];
                photos[i] = e.target.value;
                setContent({ ...content, photos });
              }} placeholder={`URL da foto ${i + 1}`}
                className="flex-1 px-3 py-2 border rounded-xl text-sm" />
              <button onClick={() => setContent({ ...content, photos: (content.photos || []).filter((_, j) => j !== i) })}
                className="text-red-400 text-sm px-2">✕</button>
            </div>
          ))}
          <button onClick={() => setContent({ ...content, photos: [...(content.photos || []), ''] })}
            className="text-sm text-amber-700 hover:underline">+ Adicionar foto</button>
        </div>
      )}

      {section.type === 'timeline' && (
        <div className="space-y-3">
          {(content.events || []).map((ev, i) => (
            <div key={i} className="border rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input value={ev.date} onChange={e => {
                  const events = [...(content.events || [])];
                  events[i] = { ...events[i], date: e.target.value };
                  setContent({ ...content, events });
                }} placeholder="Data (ex: Jan 2025)" className="flex-1 px-2 py-1 border rounded text-sm" />
                <button onClick={() => setContent({ ...content, events: (content.events || []).filter((_, j) => j !== i) })}
                  className="text-red-400 text-sm">✕</button>
              </div>
              <input value={ev.title} onChange={e => {
                const events = [...(content.events || [])];
                events[i] = { ...events[i], title: e.target.value };
                setContent({ ...content, events });
              }} placeholder="Título" className="w-full px-2 py-1 border rounded text-sm" />
              <input value={ev.text || ''} onChange={e => {
                const events = [...(content.events || [])];
                events[i] = { ...events[i], text: e.target.value };
                setContent({ ...content, events });
              }} placeholder="Descrição" className="w-full px-2 py-1 border rounded text-sm" />
            </div>
          ))}
          <button onClick={() => setContent({ ...content, events: [...(content.events || []), { date: '', title: '', text: '' }] })}
            className="text-sm text-amber-700 hover:underline">+ Adicionar evento</button>
        </div>
      )}

      {section.type === 'info' && (
        <div className="space-y-3">
          {(content.items || []).map((item, i) => (
            <div key={i} className="border rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input value={item.icon || ''} onChange={e => {
                  const items = [...(content.items || [])];
                  items[i] = { ...items[i], icon: e.target.value };
                  setContent({ ...content, items });
                }} placeholder="Ícone (emoji)" className="w-16 px-2 py-1 border rounded text-sm" />
                <input value={item.title} onChange={e => {
                  const items = [...(content.items || [])];
                  items[i] = { ...items[i], title: e.target.value };
                  setContent({ ...content, items });
                }} placeholder="Título" className="flex-1 px-2 py-1 border rounded text-sm" />
                <button onClick={() => setContent({ ...content, items: (content.items || []).filter((_, j) => j !== i) })}
                  className="text-red-400 text-sm">✕</button>
              </div>
              <input value={item.text || ''} onChange={e => {
                const items = [...(content.items || [])];
                items[i] = { ...items[i], text: e.target.value };
                setContent({ ...content, items });
              }} placeholder="Descrição" className="w-full px-2 py-1 border rounded text-sm" />
            </div>
          ))}
          <button onClick={() => setContent({ ...content, items: [...(content.items || []), { icon: '📌', title: '', text: '' }] })}
            className="text-sm text-amber-700 hover:underline">+ Adicionar item</button>
        </div>
      )}

      {section.type === 'map' && (
        <input value={content.embedUrl || ''} onChange={e => setContent({ ...content, embedUrl: e.target.value })}
          placeholder="URL do Google Maps (embed)"
          className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={handleSave}
          className="px-4 py-2 bg-amber-700 text-white rounded-xl text-sm hover:bg-amber-800">Salvar</button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 rounded-xl text-sm">Cancelar</button>
      </div>
    </div>
  );
}
