'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function BlogsLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('blog.loadingTitle')}
            message={t('blog.loadingMessage')}
        />
    );
}
