'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('about.loadingTitle')}
            message={t('about.loadingMessage')}
        />
    );
}
