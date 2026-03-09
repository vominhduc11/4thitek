'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function CertificationLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('certification.loadingTitle')}
            message={t('certification.loadingMessage')}
        />
    );
}
