'use client';

import Error from '@/components/ui/Error';
import { useLanguage } from '@/context/LanguageContext';

export default function BlogDetailError({ reset }: { reset: () => void }) {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
            <Error 
                title={t('errors.blogs.loadFailed')}
                message={t('blog.detail.loadFailedMessage')}
                onRetry={reset}
            />
        </div>
    );
}
