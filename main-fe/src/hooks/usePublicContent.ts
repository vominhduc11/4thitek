'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';

export function usePublicContent<T>(section: string) {
    const { language } = useLanguage();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiService.fetchContentSection<T>(section, language);
                if (cancelled) {
                    return;
                }
                setData(response.data ?? null);
            } catch (loadError) {
                if (cancelled) {
                    return;
                }
                setData(null);
                setError(loadError instanceof Error ? loadError.message : 'Failed to load content');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            cancelled = true;
        };
    }, [language, section]);

    return { data, loading, error };
}
