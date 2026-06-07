'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import CompanyProfileBoard from './CompanyProfileBoard';
import TeamManagementBoard from './TeamManagementBoard';
import ProductivitySettingsBoard from '../productivity/ProductivitySettingsBoard';
import CloudinaryCleanupBoard from './CloudinaryCleanupBoard';
import PartnersManager from './PartnersManager';
import PrismaMetricsBoard from './PrismaMetricsBoard';

interface SettingsBoardProps {
  initialProfile: any;
  initialAdmins: any[];
  initialProductivitySettings: any;
  currentUserId?: string;
}

export default function SettingsBoard({ initialProfile, initialAdmins, initialProductivitySettings, currentUserId }: SettingsBoardProps) {
  const t = useTranslations('Settings');
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'company');

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Sync tab when search params change
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Smooth scroll to the active tab button
  useEffect(() => {
    const btn = tabRefs.current[activeTab];
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const setTabRef = (tab: string) => (el: HTMLButtonElement | null) => {
    tabRefs.current[tab] = el;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
        <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
      </div>

      <div className="flex space-x-sm border-b border-hairline mb-xs overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          ref={setTabRef('company')}
          onClick={() => setActiveTab('company')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'company' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.company')}
        </button>
        <button
          ref={setTabRef('team')}
          onClick={() => setActiveTab('team')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'team' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.team')}
        </button>
        <button
          ref={setTabRef('productivity')}
          onClick={() => setActiveTab('productivity')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'productivity' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.productivity')}
        </button>
        <button
          ref={setTabRef('cleanup')}
          onClick={() => setActiveTab('cleanup')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'cleanup' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.cleanup')}
        </button>
        <button
          ref={setTabRef('partners')}
          onClick={() => setActiveTab('partners')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'partners' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.partners')}
        </button>
        <button
          ref={setTabRef('prisma')}
          onClick={() => setActiveTab('prisma')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
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
