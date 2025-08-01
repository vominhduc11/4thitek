/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { FiMaximize, FiMinimize, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import { useLanguage } from '@/contexts/LanguageContext';

interface Reseller {
    id: number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
    hours: string;
    rating: number;
    distance: string;
    specialties: string[];
    coordinates: {
        lat: number;
        lng: number;
    };
}

interface ResellerMapProps {
    resellers: Reseller[];
    selectedReseller?: Reseller;
}

export default function ResellerMap({ resellers, selectedReseller }: ResellerMapProps) {
    const { t } = useLanguage();
    const [mapSrc, setMapSrc] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(12);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const updateMapSrc = useCallback(() => {
        if (selectedReseller) {
            const lat = selectedReseller.coordinates.lat;
            const lng = selectedReseller.coordinates.lng;
            const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`;
            setMapSrc(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`);
        } else if (resellers.length > 0) {
            const firstReseller = resellers[0];
            const lat = firstReseller.coordinates.lat;
            const lng = firstReseller.coordinates.lng;
            const bbox = `${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}`;
            setMapSrc(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`);
        } else {
            // Default Vietnam view
            setMapSrc(`https://www.openstreetmap.org/export/embed.html?bbox=102,8,110,24&layer=mapnik`);
        }
    }, [selectedReseller, resellers]);

    useEffect(() => {
        updateMapSrc();
    }, [updateMapSrc, zoomLevel]);

    // Initialize map on component mount
    useEffect(() => {
        updateMapSrc();
    }, [updateMapSrc]);

    const handleZoomIn = () => {
        setZoomLevel((prev) => Math.min(prev + 1, 18));
        updateMapWithZoom(zoomLevel + 1);
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => Math.max(prev - 1, 1));
        updateMapWithZoom(zoomLevel - 1);
    };

    const updateMapWithZoom = (newZoom: number) => {
        if (selectedReseller) {
            const lat = selectedReseller.coordinates.lat;
            const lng = selectedReseller.coordinates.lng;
            const offset = 0.01 / Math.pow(2, newZoom - 12);
            const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
            setMapSrc(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`);
        }
    };

    const toggleFullscreen = async () => {
        if (!mapContainerRef.current) return;

        try {
            if (!isFullscreen) {
                // Enter fullscreen
                const element = mapContainerRef.current;
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ('webkitRequestFullscreen' in element) {
                    await (element as any).webkitRequestFullscreen();
                } else if ('msRequestFullscreen' in element) {
                    await (element as any).msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ('webkitExitFullscreen' in document) {
                    await (document as any).webkitExitFullscreen();
                } else if ('msExitFullscreen' in document) {
                    await (document as any).msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div
            ref={mapContainerRef}
            className={`bg-[#1a2332] rounded-lg overflow-hidden transition-all duration-300 ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}
        >
            {/* Map Header */}
            <div className="p-4 border-b border-gray-600 bg-[#1a2332]">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-2">{t('reseller.resellerMapTitle')}</h2>
                        {selectedReseller ? (
                            <div>
                                <p className="text-[#00d4ff] font-medium">{selectedReseller.name}</p>
                                <p className="text-gray-300 text-sm">{selectedReseller.address}</p>
                            </div>
                        ) : (
                            <p className="text-gray-300 text-sm">{t('reseller.clickToSelectReseller')}</p>
                        )}
                    </div>

                    {/* Map Controls */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                            onClick={handleZoomOut}
                            disabled={!mapSrc}
                            className="p-1.5 sm:p-2 bg-[#0c131d] text-white rounded-md sm:rounded-lg hover:bg-[#243447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('reseller.zoomOut')}
                        >
                            <FiZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                            onClick={handleZoomIn}
                            disabled={!mapSrc}
                            className="p-1.5 sm:p-2 bg-[#0c131d] text-white rounded-md sm:rounded-lg hover:bg-[#243447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('reseller.zoomIn')}
                        >
                            <FiZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            disabled={!mapSrc}
                            className="p-1.5 sm:p-2 bg-[#0c131d] text-white rounded-md sm:rounded-lg hover:bg-[#243447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isFullscreen ? t('reseller.exitFullscreen') : t('reseller.fullscreen')}
                        >
                            {isFullscreen ? <FiMinimize className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <FiMaximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className={`relative ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[700px]'}`}>
                {mapSrc ? (
                    <iframe
                        ref={iframeRef}
                        src={mapSrc}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="w-full h-full"
                        title="Reseller Location Map"
                    />
                ) : (
                    <div className="w-full h-full bg-[#0c131d] flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff] mx-auto mb-4"></div>
                            <p className="text-gray-300">{t('reseller.loadingMap')}</p>
                        </div>
                    </div>
                )}

                {/* Map Overlay for better UX - only show when map is loaded */}
                {mapSrc && (
                    <div className="absolute top-4 right-4 bg-[#0c131d] bg-opacity-90 rounded-lg p-3">
                        <div className="text-white text-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-[#00d4ff] rounded-full"></div>
                                <span>{t('reseller.selectedDealer')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>{t('reseller.otherDealers')}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Zoom Level Indicator - only show when map is loaded */}
                {mapSrc && (
                    <div className="absolute bottom-4 left-4 bg-[#0c131d] bg-opacity-90 rounded-lg px-3 py-2">
                        <span className="text-white text-sm">Zoom: {zoomLevel}</span>
                    </div>
                )}
            </div>

            {/* Map Footer */}
            <div className="p-4 bg-[#0c131d] border-t border-gray-600">
                <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{t('reseller.showingOnMap').replace('{count}', resellers.length.toString())}</span>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs">{t('reseller.useCtrlScroll')}</span>
                        {isFullscreen && (
                            <span className="text-xs text-[#00d4ff]">{t('reseller.pressEscToExit')}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
