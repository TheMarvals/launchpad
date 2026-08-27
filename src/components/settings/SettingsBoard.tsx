'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { getAdmins, getCompanyProfile } from '@/app/actions/settings';
import type { getProductivitySettings } from '@/app/actions/productivity';
import CompanyProfileBoard from './CompanyProfileBoard';
import TeamManagementBoard from './TeamManagementBoard';
import ProductivitySettingsBoard from '../productivity/ProductivitySettingsBoard';
import CloudinaryCleanupBoard from './CloudinaryCleanupBoard';
import PartnersManager from './PartnersManager';
import PrismaMetricsBoard from './PrismaMetricsBoard';
import EmailSenderIdentitiesBoard from './EmailSenderIdentitiesBoard';
import type { EmailSenderIdentity } from '@prisma/client';

interface SettingsBoardProps {
  initialProfile: Awaited<ReturnType<typeof getCompanyProfile>>;
  initialAdmins: Awaited<ReturnType<typeof getAdmins>>;
  initialProductivitySettings: Awaited<ReturnType<typeof getProductivitySettings>>;
  initialEmailSenderIdentities: EmailSenderIdentity[];
  currentUserId?: string;
}

export default function SettingsBoard({ initialProfile, initialAdmins, initialProductivitySettings, initialEmailSenderIdentities, currentUserId }: SettingsBoardProps) {
  const t = useTranslations('Settings');
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams?.get('tab') || 'company');

  const selectTab = (tab: string, button: HTMLButtonElement) => {
    setActiveTab(tab);
    button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
        <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
      </div>

      <div className="flex space-x-sm border-b border-hairline mb-xs overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          onClick={(event) => selectTab('company', event.currentTarget)}
          className={`py-xs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'company' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.company')}
        </button>
        <button
          onClick={(event) => selectTab('team', event.currentTarget)}
          className={`py-xs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'team' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.team')}
        </button>
        <button
          onClick={(event) => selectTab('emailSenders', event.currentTarget)}
          className={`py-xs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'emailSenders'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.emailSenders')}
        </button>
        <button
          onClick={(event) => selectTab('productivity', event.currentTarget)}
          className={`py-xs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'productivity' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.productivity')}
        </button>
        <button
          onClick={(event) => selectTab('cleanup', event.currentTarget)}
          className={`py-xs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'cleanup' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.cleanup')}
        </button>
        <button
          onClick={(event) => selectTab('partners', event.currentTarget)}
          className={`py-xs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'partners' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.partners')}
        </button>
        <button
          onClick={(event) => selectTab('prisma', event.currentTarget)}
          className={`py-xs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'prisma' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.prisma')}
        </button>
      </div>

      <div>
        {activeTab === 'company' && (
          <CompanyProfileBoard initialProfile={initialProfile} />
        )}
        {activeTab === 'team' && (
          <TeamManagementBoard initialAdmins={initialAdmins} currentUserId={currentUserId} />
        )}
        {activeTab === 'emailSenders' && (
          <EmailSenderIdentitiesBoard initialIdentities={initialEmailSenderIdentities} />
        )}
        {activeTab === 'productivity' && (
          <ProductivitySettingsBoard initialSettings={initialProductivitySettings} />
        )}
        {activeTab === 'cleanup' && (
          <CloudinaryCleanupBoard />
        )}
        {activeTab === 'partners' && (
          <PartnersManager />
        )}
        {activeTab === 'prisma' && (
          <PrismaMetricsBoard />
        )}
      </div>
    </div>
  );
}
