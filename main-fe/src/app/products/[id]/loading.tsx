'use client';

import Loading from '@/components/ui/Loading';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductDetailLoading() {
    const { t } = useLanguage();
    return (
        <Loading 
            title={t('products.detail.loadingTitle')}
            message={t('products.detail.loadingMessage')}
        />
    );
}
