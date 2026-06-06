'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import CompanyProfileBoard from './CompanyProfileBoard';
import TeamManagementBoard from './TeamManagementBoard';
import ProductivitySettingsBoard from '../productivity/ProductivitySettingsBoard';

interface SettingsBoardProps {
  initialProfile: any;
  initialAdmins: any[];
  initialProductivitySettings: any;
}

export default function SettingsBoard({ initialProfile, initialAdmins, initialProductivitySettings }: SettingsBoardProps) {
  const t = useTranslations('Settings');
  const [activeTab, setActiveTab] = useState('company');

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div>
        <h1 className="text-display-md font-medium tracking-tight text-ink">{t('title')}</h1>
        <p className="text-body text-muted mt-[4px]">{t('subtitle')}</p>
      </div>

      <div className="flex space-x-sm border-b border-hairline mb-xs">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'company' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.company')}
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'team' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.team')}
        </button>
        <button
          onClick={() => setActiveTab('productivity')}
          className={`pb-xxs text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${
            activeTab === 'productivity' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          {t('tabs.productivity')}
        </button>
      </div>

      <div>
        {activeTab === 'company' && (
          <CompanyProfileBoard initialProfile={initialProfile} />
        )}
        {activeTab === 'team' && (
          <TeamManagementBoard initialAdmins={initialAdmins} />
        )}
        {activeTab === 'productivity' && (
          <ProductivitySettingsBoard initialSettings={initialProductivitySettings} />
        )}
      </div>
    </div>
  );
}
