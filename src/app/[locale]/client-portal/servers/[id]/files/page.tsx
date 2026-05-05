'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface FileItem {
  type: '-' | 'd' | 'l';
  name: string;
  size: number;
  modifyTime: number;
  accessTime: number;
  rights: { user: string; group: string; other: string };
  owner: number;
  group: number;
}

const swalTheme = {
  background: '#0a041a',
  color: '#cbd5e1',
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#1e293b',
  customClass: {
    popup: 'rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-xl',
    title: 'text-2xl font-black tracking-tight text-white',
    htmlContainer: 'text-slate-400 text-sm font-medium',
    confirmButton: 'rounded-xl px-6 py-3 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95',
    cancelButton: 'rounded-xl px-6 py-3 font-bold text-xs uppercase tracking-widest transition-all hover:bg-white/5 active:scale-95',
    input: 'bg-black/40 border border-white/10 rounded-xl text-white px-4 py-3 focus:border-blue-500/50 outline-none transition-all'
  }
};

export default function FileManagerPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.id as string;

  const [authModal, setAuthModal] = useState(true);
  const [password, setPassword] = useState('');
  const [credentials, setCredentials] = useState({ username: 'root', password: '' });

  const [currentPath, setCurrentPath] = useState('/root');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editor State
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Downloading State
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const fetchFiles = async (path: string, creds = credentials) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          path,
          credentials: creds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al obtener archivos');
      
      const sorted = (data.data || []).sort((a: FileItem, b: FileItem) => {
        if (a.type === 'd' && b.type !== 'd') return -1;
        if (a.type !== 'd' && b.type === 'd') return 1;
        return a.name.localeCompare(b.name);
      });

      setFiles(sorted);
      setCurrentPath(path);
      setAuthModal(false);
    } catch (err: any) {
      setError(err.message);
      if (err.message.includes('Credenciales') || err.message.includes('Authentication')) {
        setAuthModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const newCreds = { username: 'root', password };
    setCredentials(newCreds);
    fetchFiles(currentPath, newCreds);
  };

  const handleNavigate = (folderName: string) => {
    if (folderName === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      fetchFiles('/' + parts.join('/'));
    } else {
      const newPath = currentPath.endsWith('/') ? `${currentPath}${folderName}` : `${currentPath}/${folderName}`;
      fetchFiles(newPath);
    }
  };

  const handleDownload = async (fileName: string) => {
    const filePath = currentPath.endsWith('/') ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
    setDownloadingFiles(prev => new Set(prev).add(fileName));
    
    try {
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'download', path: filePath, credentials }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al descargar');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      MySwal.fire({
        ...swalTheme,
        icon: 'success',
        title: 'Descarga lista',
        text: fileName,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err: any) {
      MySwal.fire({
        ...swalTheme,
        icon: 'error',
        title: 'Error de descarga',
        text: err.message,
      });
    } finally {
      setDownloadingFiles(prev => {
        const next = new Set(prev);
        next.delete(fileName);
        return next;
      });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    MySwal.fire({
      ...swalTheme,
      title: 'Subiendo archivo',
      text: file.name,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const filePath = currentPath.endsWith('/') ? `${currentPath}${file.name}` : `${currentPath}/${file.name}`;
      const formData = new FormData();
      formData.append('action', 'upload');
      formData.append('path', filePath);
      formData.append('credentials', JSON.stringify(credentials));
      formData.append('file', file);

      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir archivo');

      MySwal.fire({
        ...swalTheme,
        icon: 'success',
        title: '¡Subida exitosa!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      fetchFiles(currentPath);
    } catch (err: any) {
      MySwal.fire({
        ...swalTheme,
        icon: 'error',
        title: 'Error al subir',
        text: err.message,
      });
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRename = async (oldName: string) => {
    const { value: newName } = await MySwal.fire({
      ...swalTheme,
      title: 'Renombrar',
      input: 'text',
      inputLabel: 'Nuevo nombre para ' + oldName,
      inputValue: oldName,
      showCancelButton: true,
    });

    if (!newName || newName === oldName) return;

    setLoading(true);
    try {
      const oldPath = currentPath.endsWith('/') ? `${currentPath}${oldName}` : `${currentPath}/${oldName}`;
      const newPath = currentPath.endsWith('/') ? `${currentPath}${newName}` : `${currentPath}/${newName}`;
      
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', path: oldPath, newPath, credentials }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al renombrar');

      fetchFiles(currentPath);
    } catch (err: any) {
      MySwal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    const { value: folderName } = await MySwal.fire({
      ...swalTheme,
      title: 'Nueva Carpeta',
      input: 'text',
      inputPlaceholder: 'Nombre de la carpeta',
      showCancelButton: true,
    });

    if (!folderName) return;

    setLoading(true);
    try {
      const folderPath = currentPath.endsWith('/') ? `${currentPath}${folderName}` : `${currentPath}/${folderName}`;
      
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mkdir', path: folderPath, credentials }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear carpeta');

      fetchFiles(currentPath);
    } catch (err: any) {
      MySwal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEditFile = async (fileName: string) => {
    const filePath = currentPath.endsWith('/') ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', path: filePath, credentials }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setFileContent(data.data);
      setEditingFile(filePath);
    } catch (err: any) {
      setError('No se pudo leer el archivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'write', path: editingFile, content: fileContent, credentials }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setEditingFile(null);
      fetchFiles(currentPath);
      MySwal.fire({ ...swalTheme, icon: 'success', title: 'Cambios guardados', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      MySwal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (fileName: string, type: string) => {
    const result = await MySwal.fire({
      ...swalTheme,
      title: '¿Confirmar eliminación?',
      text: `Eliminarás ${type === 'd' ? 'la carpeta' : 'el archivo'} "${fileName}" de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    const filePath = currentPath.endsWith('/') ? `${currentPath}${fileName}` : `${currentPath}/${fileName}`;
    setLoading(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/sftp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: type === 'd' ? 'rmdir' : 'delete', 
          path: filePath, 
          credentials 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchFiles(currentPath);
    } catch (err: any) {
      MySwal.fire({ ...swalTheme, icon: 'error', title: 'Error', text: err.message });
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-[#0f111a] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-10 py-6 bg-slate-900/50 border-b border-white/5">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2 text-blue-400 mb-1.5">
            <span className="material-icons text-[18px]">folder_open</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Explorador de Archivos</span>
          </div>
          <div className="text-slate-300 font-mono text-sm opacity-60 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 truncate max-w-md">
            {currentPath}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleCreateFolder}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-300 transition-all text-xs font-bold group"
          >
            <span className="material-icons text-[18px] group-hover:scale-110 transition-transform">create_new_folder</span>
            <span>Nueva Carpeta</span>
          </button>
          
          <label className="cursor-pointer flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all text-xs font-black uppercase tracking-wider shadow-xl shadow-blue-600/20 active:scale-95">
            <span className="material-icons text-[18px]">upload</span>
            <span>Subir</span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={loading} />
          </label>
          
          <button 
            onClick={() => fetchFiles(currentPath)}
            disabled={loading}
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-slate-400 transition-all group"
          >
            <span className={`material-icons text-[20px] ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`}>refresh</span>
          </button>
        </div>
      </div>

      {authModal ? (
        <div className="flex-1 flex items-center justify-center p-6 bg-[#0a041a]">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl text-center">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Autenticación SFTP</h2>
            <p className="text-slate-400 text-sm mb-8">Ingresa la contraseña del usuario root para acceder a los archivos del servidor.</p>
            
            <form onSubmit={handleAuth} className="space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña de root</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium p-4 rounded-xl text-center">{error}</div>}
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center space-x-2 active:scale-95"
              >
                {loading ? <span className="material-icons animate-spin text-[18px]">sync</span> : <span className="material-icons text-[18px]">lock_open</span>}
                <span>Conectar</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {error && <div className="mx-10 mt-6 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center"><span className="material-icons text-sm mr-2">error</span>{error}</div>}
          
          <div className="flex-1 overflow-auto px-10 py-8">
            <div className="bg-black/20 border border-white/5 rounded-[2rem] overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                    <th className="px-8 py-5 w-16 text-center">Type</th>
                    <th className="px-8 py-5">Filename</th>
                    <th className="px-8 py-5 w-36">Size</th>
                    <th className="px-8 py-5 w-56">Last Modified</th>
                    <th className="px-8 py-5 w-44 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentPath !== '/' && (
                    <tr 
                      className="hover:bg-white/[0.03] cursor-pointer transition-all group"
                      onClick={() => handleNavigate('..')}
                    >
                      <td className="px-8 py-5 text-center">
                        <span className="material-icons text-blue-400/60 group-hover:text-blue-400 transition-colors">folder_open</span>
                      </td>
                      <td className="px-8 py-5 font-bold text-blue-400/80 group-hover:text-blue-400 tracking-tight">Parent Directory</td>
                      <td className="px-8 py-5 text-slate-600 text-xs font-mono">--</td>
                      <td className="px-8 py-5 text-slate-600 text-xs font-mono">--</td>
                      <td className="px-8 py-5"></td>
                    </tr>
                  )}
                  
                  {files.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="opacity-20 flex flex-col items-center">
                          <span className="material-icons text-6xl mb-4">folder_off</span>
                          <p className="text-sm font-black uppercase tracking-widest">No se encontraron archivos</p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {files.map((file) => (
                    <tr 
                      key={file.name} 
                      className="hover:bg-white/[0.04] transition-all group border-b border-white/[0.02]"
                    >
                      <td className="px-8 py-5 text-center">
                        <span className={`material-icons text-[24px] ${file.type === 'd' ? 'text-blue-400/80' : 'text-slate-500/80'}`}>
                          {file.type === 'd' ? 'folder' : 'description'}
                        </span>
                      </td>
                      <td 
                        className={`px-8 py-5 text-sm font-bold tracking-tight transition-colors ${file.type === 'd' ? 'text-blue-400 cursor-pointer hover:text-blue-300' : 'text-slate-200'}`}
                        onClick={() => file.type === 'd' ? handleNavigate(file.name) : handleEditFile(file.name)}
                      >
                        {file.name}
                      </td>
                      <td className="px-8 py-5 text-slate-500 text-xs font-mono tracking-tighter">{file.type === 'd' ? '--' : formatSize(file.size)}</td>
                      <td className="px-8 py-5 text-slate-500 text-[11px] font-mono opacity-80">{new Date(file.modifyTime).toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {file.type !== 'd' && (
                            <>
                              <button 
                                onClick={() => handleDownload(file.name)}
                                disabled={downloadingFiles.has(file.name)}
                                className="w-10 h-10 flex items-center justify-center hover:bg-blue-600/20 rounded-xl text-slate-500 hover:text-blue-400 transition-all border border-transparent hover:border-blue-500/30 group/btn"
                                title="Download"
                              >
                                {downloadingFiles.has(file.name) ? (
                                  <span className="material-icons text-[18px] animate-spin">sync</span>
                                ) : (
                                  <span className="material-icons text-[20px] group-hover/btn:translate-y-0.5 transition-transform">south</span>
                                )}
                              </button>
                              <button 
                                onClick={() => handleEditFile(file.name)}
                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                                title="Edit"
                              >
                                <span className="material-icons text-[18px]">edit</span>
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleRename(file.name)}
                            className="p-2 hover:bg-white/10 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                            title="Rename"
                          >
                            <span className="material-icons text-[18px]">drive_file_rename_outline</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(file.name, file.type)}
                            className="p-2 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                            title="Delete"
                          >
                            <span className="material-icons text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Premium Editor Overlay */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-8 lg:p-24 overflow-hidden animate-in fade-in duration-300">
          <div className="w-full max-w-7xl h-full bg-[#0a041a] border border-white/10 rounded-[3rem] flex flex-col shadow-2xl overflow-hidden scale-in-center">
            <div className="flex items-center justify-between px-10 py-6 bg-white/5 border-b border-white/5">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  <span className="material-icons text-blue-400 text-2xl">code</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Source Editor</span>
                  <span className="text-white font-mono text-sm tracking-tight">{editingFile}</span>
                </div>
              </div>
              <button 
                onClick={() => setEditingFile(null)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
              >
                <span className="material-icons text-2xl">close</span>
              </button>
            </div>
            
            <div className="flex-1 p-10 bg-black/50">
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="w-full h-full bg-black/40 text-blue-100/90 font-mono text-sm resize-none focus:outline-none p-10 border border-white/5 rounded-[2rem] leading-relaxed shadow-inner"
                spellCheck="false"
              />
            </div>
            
            <div className="bg-white/5 px-10 py-8 border-t border-white/5 flex justify-end items-center space-x-4">
              <button 
                onClick={() => setEditingFile(null)}
                className="px-8 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition-all text-sm"
              >
                Discard Changes
              </button>
              <button 
                onClick={handleSaveFile}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center space-x-3 shadow-2xl shadow-blue-600/40 active:scale-95"
              >
                {saving ? <span className="material-icons animate-spin text-[22px]">sync</span> : <span className="material-icons text-[22px]">save</span>}
                <span>Push to Server</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
