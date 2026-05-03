import React from 'react';
import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a041a] text-white hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl fw-bold tracking-tighter stroke-text">MARVAL</h1>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Cotizador</p>
        </div>
        
        <nav className="flex-grow mt-6">
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">dashboard</span> Dashboard
              </Link>
            </li>
            <li>
              <Link href="/dashboard/quotes" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">description</span> Cotizaciones
              </Link>
            </li>
            <li>
              <Link href="/dashboard/clients" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">people</span> Clientes
              </Link>
            </li>
            <li>
              <Link href="/dashboard/products" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">inventory_2</span> Productos
              </Link>
            </li>
            <li>
              <Link href="/dashboard/tickets" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">support_agent</span> Soporte
              </Link>
            </li>
            <li>
              <Link href="/dashboard/logs" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">policy</span> Auditoría
              </Link>
            </li>

            <div className="px-6 py-4 mt-4">
              <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Productividad</p>
            </div>
            <li>
              <Link href="/dashboard/productivity/projects" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">folder</span> Mis Proyectos
              </Link>
            </li>
            <li>
              <Link href="/dashboard/productivity/tasks" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">task_alt</span> Tareas
              </Link>
            </li>
            <li>
              <Link href="/dashboard/productivity/notes" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">note_alt</span> Mis Notas
              </Link>
            </li>
            <li>
              <Link href="/dashboard/productivity/calendar" className="flex items-center px-6 py-3 hover:bg-white/10 transition-colors">
                <span className="material-icons mr-3 text-sm opacity-70">calendar_month</span> Calendario
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-6 border-t border-white/10 text-[10px] opacity-40 uppercase tracking-widest text-center">
          © 2026 Marval
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <h2 className="font-bold text-gray-800">Sistema de Cotizaciones</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-gray-800">{session.user.name}</div>
              <div className="text-[10px] text-gray-400">{session.user.email}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="text-slate-400 hover:text-red-500 transition-colors"
                title="Cerrar Sesión"
              >
                <span className="material-icons text-[20px]">logout</span>
              </button>
            </form>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
