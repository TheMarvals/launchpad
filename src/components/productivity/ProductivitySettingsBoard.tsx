'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateProductivitySettings, testTelegram } from '@/app/actions/productivity';
import Swal from 'sweetalert2';

interface SettingsProps {
  initialSettings: any;
}

export default function ProductivitySettingsBoard({ initialSettings }: SettingsProps) {
  const t = useTranslations('Settings');
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProductivitySettings({
        telegramEnabled: settings.telegramEnabled,
        telegramBotToken: settings.telegramBotToken,
        telegramChatId: settings.telegramChatId,
      });
      Swal.fire({
        title: 'Success',
        text: t('telegram.success'),
        icon: 'success',
        confirmButtonColor: '#0a041a',
      });
    } catch (error) {
      Swal.fire('Error', t('telegram.error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      Swal.fire('Error', 'Token and Chat ID are required for testing', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const result = await testTelegram(settings.telegramBotToken, settings.telegramChatId);
      if (result.success) {
        Swal.fire('Test OK', t('telegram.testSuccess'), 'success');
      } else {
        Swal.fire('Error', t('telegram.testError'), 'error');
      }
    } catch (error) {
      Swal.fire('Error', t('telegram.testError'), 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#0a041a] tracking-tight">{t('title')}</h1>
        <p className="text-gray-500 mt-2 font-medium">{t('subtitle')}</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0088cc] flex items-center justify-center text-white">
              <span className="material-icons text-2xl">send</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('telegram.title')}</h2>
              <p className="text-sm text-gray-500">{t('telegram.subtitle')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.telegramEnabled}
              onChange={(e) => setSettings({ ...settings, telegramEnabled: e.target.checked })}
              className="sr-only peer" 
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#0088cc]"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('telegram.botToken')}</label>
              <input
                type="password"
                value={settings.telegramBotToken || ''}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                placeholder="123456:ABC-DEF..."
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0088cc] transition-all text-gray-900 font-medium placeholder:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 px-1">{t('telegram.chatId')}</label>
              <input
                type="text"
                value={settings.telegramChatId || ''}
                onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                placeholder="Ej. -100123456789"
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#0088cc] transition-all text-gray-900 font-medium placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 px-8 py-4 rounded-2xl font-bold text-[#0088cc] border-2 border-[#0088cc] hover:bg-[#0088cc]/5 transition-all disabled:opacity-50"
            >
              {isTesting ? '...' : t('telegram.test')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] bg-[#0a041a] text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:shadow-[#0a041a]/20 transition-all disabled:opacity-50 flex items-center justify-center"
            >
              <span className="material-icons mr-2 text-[18px]">save</span>
              {isSaving ? '...' : t('telegram.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
