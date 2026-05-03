'use client';

import React, { useState } from 'react';
import { toggleUserAccess } from '@/app/actions/portal';
import Swal from 'sweetalert2';

export default function UserAccessToggle({ user }: { user: { id: string; isActive: boolean } }) {
  const [isActive, setIsActive] = useState(user.isActive);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    
    // Optimistic update
    const newStatus = !isActive;
    setIsActive(newStatus);
    
    const res = await toggleUserAccess(user.id, newStatus);
    
    if (res.error) {
      // Revert if error
      setIsActive(!newStatus);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: res.error,
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: newStatus ? 'Acceso Activado' : 'Acceso Desactivado',
        text: newStatus ? 'El usuario ahora puede iniciar sesión.' : 'El usuario ya no puede iniciar sesión.',
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
    
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? 'bg-green-500' : 'bg-gray-300'
      }`}
      title={isActive ? 'Desactivar Usuario' : 'Activar Usuario'}
    >
      <span className="sr-only">Toggle user access</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isActive ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
