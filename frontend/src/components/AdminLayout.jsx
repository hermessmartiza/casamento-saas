import { Outlet, useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('wedding_token');

  useEffect(() => {
    if (!token) navigate(`/${slug}/admin/login`);
  }, [token, slug, navigate]);

  if (!token) return null;

  const navItems = [
    { path: `/${slug}/admin`, label: 'Dashboard', icon: '📊' },
    { path: `/${slug}/admin/guests`, label: 'Convidados', icon: '👥' },
    { path: `/${slug}/admin/vendors`, label: 'Fornecedores', icon: '🤝' },
    { path: `/${slug}/admin/budget`, label: 'Orçamento', icon: '💰' },
    { path: `/${slug}/admin/timeline`, label: 'Cronograma', icon: '📅' },
    { path: `/${slug}/admin/sections`, label: 'Editor do Site', icon: '🎨' },
    { path: `/${slug}/admin/settings`, label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-serif text-amber-800">{slug}</h1>
        </div>
        <nav className="px-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition ${
                location.pathname === item.path
                  ? 'bg-amber-100 text-amber-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-8 left-0 w-64 px-4">
          <button
            onClick={() => { localStorage.clear(); navigate(`/${slug}/admin/login`); }}
            className="w-full py-2 text-sm text-gray-400 hover:text-red-500 text-center"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
