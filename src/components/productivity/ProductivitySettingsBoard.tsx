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
        confirmButtonColor: '#da291c',
        customClass: {
          popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
          confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        }
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: t('telegram.error'),
        icon: 'error',
        customClass: {
          popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink',
          confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary',
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      Swal.fire('Error', t('telegram.testRequired') || 'Token and Chat ID are required for testing', 'error');
      return;
    }
    setIsTesting(true);
    try {
      const result = await testTelegram(settings.telegramBotToken, settings.telegramChatId);
      if (result.success) {
        Swal.fire({ title: 'Test OK', text: t('telegram.testSuccess'), icon: 'success', customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink', confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary' } });
      } else {
        Swal.fire({ title: 'Error', text: t('telegram.testError'), icon: 'error', customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink', confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary' } });
      }
    } catch (error) {
      Swal.fire({ title: 'Error', text: t('telegram.testError'), icon: 'error', customClass: { popup: 'rounded-none border border-hairline bg-canvas-elevated text-ink', confirmButton: 'px-sm py-xs font-semibold uppercase tracking-wider text-xs border border-transparent bg-primary text-on-primary' } });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-[56rem] space-y-8">
      <div>
        <h1 className="text-title-sm font-medium text-ink uppercase tracking-wider">{t('telegram.title')}</h1>
        <p className="text-body text-muted text-sm mt-[2px]">{t('telegram.subtitle')}</p>
      </div>

      <div className="bg-canvas-elevated border border-hairline overflow-hidden">
        <div className="p-sm border-b border-hairline flex items-center justify-between bg-canvas">
          <div className="flex items-center space-x-xxs">
            <div className="w-[40px] h-[40px] border border-hairline bg-primary flex items-center justify-center text-on-primary">
              <span className="material-icons text-lg">send</span>
            </div>
            <div>
              <h2 className="text-sm font-medium text-ink">{t('telegram.title')}</h2>
              <p className="text-muted text-xs">{t('telegram.subtitle')}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.telegramEnabled}
              onChange={(e) => setSettings({ ...settings, telegramEnabled: e.target.checked })}
              className="sr-only peer" 
            />
            <div className="w-14 h-7 bg-canvas border border-hairline peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-transparent after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-muted after:border-transparent after:border after:h-6 after:w-6 after:transition-all peer-checked:after:bg-white peer-checked:bg-primary"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="p-sm space-y-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            <div className="space-y-xxs">
              <label className="text-caption-uppercase text-ink font-semibold">{t('telegram.botToken')}</label>
              <input
                type="password"
                value={settings.telegramBotToken || ''}
                onChange={(e) => setSettings({ ...settings, telegramBotToken: e.target.value })}
                placeholder={t('telegram.tokenPlaceholder') || '123456:ABC-DEF...'}
                className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
              />
            </div>
            <div className="space-y-xxs">
              <label className="text-caption-uppercase text-ink font-semibold">{t('telegram.chatId')}</label>
              <input
                type="text"
                value={settings.telegramChatId || ''}
                onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                placeholder={t('telegram.chatIdPlaceholder') || 'Ej. -100123456789'}
                className="w-full px-xs py-xxs border border-hairline bg-canvas text-ink placeholder:text-muted focus:border-primary outline-none transition-colors text-sm"
              />
            </div>
          </div>

          <div className="pt-xs flex flex-col sm:flex-row gap-xxs">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="flex-1 px-xs py-xxs font-semibold text-xs uppercase tracking-wider text-primary border border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {isTesting ? '...' : t('telegram.test')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] bg-primary text-on-primary px-xs py-xxs font-semibold text-xs uppercase tracking-wider hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center border border-transparent"
            >
              <span className="material-icons mr-xxs text-sm">save</span>
              {isSaving ? '...' : t('telegram.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
