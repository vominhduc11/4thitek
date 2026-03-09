'use client';

import Error from '@/components/ui/Error';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutError({ reset }: { reset: () => void }) {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title={t('about.errorTitle')}
                message={t('about.errorMessage')}
                onRetry={reset}
            />
        </div>
    );
}
