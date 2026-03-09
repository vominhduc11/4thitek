'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('contact.loadingTitle')}
            message={t('contact.loadingMessage')}
        />
    );
}
