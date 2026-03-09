'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductsLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('products.loadingTitle')}
            message={t('products.loadingMessage')}
        />
    );
}
