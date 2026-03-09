'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function BlogDetailLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('blog.detail.loadingTitle')}
            message={t('blog.detail.loadingMessage')}
        />
    );
}
