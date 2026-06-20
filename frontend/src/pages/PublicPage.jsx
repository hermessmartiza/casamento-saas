import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';

function HeroSection({ wedding }) {
  return (
    <div className="relative min-h-96 flex items-center justify-center bg-cover bg-center"
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
        {wedding.location && <p className="text-lg opacity-80">📍 {wedding.location}</p>}
      </div>
    </div>
  );
}

function TextSection({ section }) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      {section.title && <h2 className="text-2xl font-serif text-center mb-6">{section.title}</h2>}
      <div className="text-gray-700 leading-relaxed whitespace-pre-line text-center">{section.content?.text || ''}</div>
    </div>
  );
}

function PhotosSection({ section }) {
  const photos = section.content?.photos || [];
  if (photos.length === 0) return null;
  return (
    <div className="py-12 px-4 bg-gray-50">
      {section.title && <h2 className="text-2xl font-serif text-center mb-8">{section.title}</h2>}
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((url, i) => (
          <img key={i} src={url} alt="" className="w-full h-64 object-cover rounded-xl shadow-sm" />
        ))}
      </div>
    </div>
  );
}

function TimelineStorySection({ section }) {
  const events = section.content?.events || [];
  if (events.length === 0) return null;
  return (
    <div className="py-12 px-4">
      {section.title && <h2 className="text-2xl font-serif text-center mb-8">{section.title}</h2>}
      <div className="max-w-2xl mx-auto relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-amber-200" />
        <div className="space-y-8">
          {events.map((ev, i) => (
            <div key={i} className="relative pl-12">
              <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-amber-500 border-4 border-white shadow" />
              <span className="text-xs font-medium text-amber-700">{ev.date}</span>
              <h3 className="font-medium text-gray-800">{ev.title}</h3>
              {ev.text && <p className="text-sm text-gray-500 mt-1">{ev.text}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoSection({ section }) {
  const items = section.content?.items || [];
  if (items.length === 0) return null;
  return (
    <div className="py-12 px-4 bg-amber-50">
      {section.title && <h2 className="text-2xl font-serif text-center mb-8">{section.title}</h2>}
      <div className="max-w-2xl mx-auto grid gap-4">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm flex items-start gap-4">
            <span className="text-2xl">{item.icon || '📌'}</span>
            <div>
              <h3 className="font-medium text-gray-800">{item.title}</h3>
              {item.text && <p className="text-sm text-gray-500 mt-1">{item.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapSection({ section }) {
  const url = section.content?.embedUrl || section.content?.url;
  if (!url) return null;
  return (
    <div className="py-12 px-4">
      {section.title && <h2 className="text-2xl font-serif text-center mb-8">{section.title}</h2>}
      <div className="max-w-3xl mx-auto rounded-xl overflow-hidden shadow-sm">
        <iframe src={url} width="100%" height="350" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
    </div>
  );
}

const SECTION_RENDERERS = {
  hero: HeroSection,
  text: TextSection,
  photos: PhotosSection,
  timeline: TimelineStorySection,
  info: InfoSection,
  map: MapSection,
};

export default function PublicPage() {
  const { slug } = useParams();
  const [wedding, setWedding] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/wedding/public/${slug}`),
      api.get(`/sections/public/${slug}`),
    ]).then(([wRes, sRes]) => {
      setWedding(wRes.data);
      setSections(sRes.data);
    }).catch(() => setWedding(null))
    .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Carregando...</div>;
  if (!wedding) return <div className="min-h-screen flex items-center justify-center text-gray-400">Casamento não encontrado</div>;

  const style = { '--primary': wedding.primaryColor, '--accent': wedding.accentColor };

  return (
    <div className="min-h-screen" style={style}>
      {sections.length === 0 ? (
        <HeroSection wedding={wedding} />
      ) : (
        sections.map(s => {
          const Renderer = SECTION_RENDERERS[s.type];
          if (!Renderer) return null;
          return <Renderer key={s.id} section={s} wedding={wedding} />;
        })
      )}

      {/* CTA buttons - always show */}
      <div className="text-center py-12 px-4 space-y-4">
        <a href={`/${slug}/rsvp`}
          className="inline-block px-8 py-4 rounded-full text-white font-medium text-lg shadow-lg hover:shadow-xl transition"
          style={{ backgroundColor: wedding.primaryColor }}>
          ✨ Confirmar Presença
        </a>
        <br />
        <a href={`/${slug}/admin/login`}
          className="inline-block px-6 py-3 rounded-full text-white font-medium text-sm opacity-70 hover:opacity-100"
          style={{ backgroundColor: wedding.primaryColor }}>
          Área dos Noivos
        </a>
      </div>
    </div>
  );
}
