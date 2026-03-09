'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function WarrantyCheckLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('warrantyCheck.loadingTitle')}
            message={t('warrantyCheck.loadingMessage')}
        />
    );
}
