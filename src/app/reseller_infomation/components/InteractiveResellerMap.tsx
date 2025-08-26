'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { FiMaximize, FiMinimize, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import L from 'leaflet';

// Fix for default markers in react-leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string, isSelected: boolean = false) => {
    const size = isSelected ? 40 : 30;
    return L.divIcon({
        html: `
            <div style="
                background-color: ${color};
                width: ${size}px;
                height: ${size}px;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: ${size > 30 ? '16px' : '12px'};
            ">
                📍
            </div>
        `,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
    });
};

interface Reseller {
    id: number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

interface InteractiveResellerMapProps {
    resellers: Reseller[];
    selectedReseller?: Reseller;
    onResellerSelect?: (reseller: Reseller) => void;
}

export default function InteractiveResellerMap({ 
    resellers, 
    selectedReseller, 
    onResellerSelect 
}: InteractiveResellerMapProps) {
    const { t } = useLanguage();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Calculate map center and bounds
    const getMapCenter = () => {
        if (selectedReseller && selectedReseller.coordinates) {
            return [selectedReseller.coordinates.lat, selectedReseller.coordinates.lng] as [number, number];
        }
        
        const resellersWithCoords = resellers.filter(r => r.coordinates);
        if (resellersWithCoords.length > 0) {
            const avgLat = resellersWithCoords.reduce((sum, r) => sum + r.coordinates!.lat, 0) / resellersWithCoords.length;
            const avgLng = resellersWithCoords.reduce((sum, r) => sum + r.coordinates!.lng, 0) / resellersWithCoords.length;
            return [avgLat, avgLng] as [number, number];
        }
        
        // Default Vietnam center
        return [14.0583, 108.2772] as [number, number];
    };

    const getZoomLevel = () => {
        if (selectedReseller) return 15;
        return resellers.filter(r => r.coordinates).length > 1 ? 10 : 12;
    };

    const toggleFullscreen = async () => {
        if (!mapContainerRef.current) return;

        try {
            if (!isFullscreen) {
                const element = mapContainerRef.current;
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ('webkitRequestFullscreen' in element) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (element as any).webkitRequestFullscreen();
                } else if ('msRequestFullscreen' in element) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (element as any).msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ('webkitExitFullscreen' in document) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (document as any).webkitExitFullscreen();
                } else if ('msExitFullscreen' in document) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (document as any).msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch {
            // Handle fullscreen error silently
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

    useEffect(() => {
        // Set map ready after component mounts
        const timer = setTimeout(() => setIsMapReady(true), 100);
        return () => clearTimeout(timer);
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
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 bg-[#0c131d] text-white rounded-lg hover:bg-[#243447] transition-colors"
                            title={isFullscreen ? t('reseller.exitFullscreen') : t('reseller.fullscreen')}
                        >
                            {isFullscreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className={`relative ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[700px]'}`}>
                {isMapReady ? (
                    <MapContainer
                        center={getMapCenter()}
                        zoom={getZoomLevel()}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        className="rounded-none"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        <ZoomControl position="topright" />
                        
                        {/* Render markers for resellers */}
                        {resellers
                            .filter(reseller => reseller.coordinates)
                            .map((reseller) => (
                                <Marker
                                    key={reseller.id}
                                    position={[reseller.coordinates!.lat, reseller.coordinates!.lng]}
                                    icon={createCustomIcon(
                                        selectedReseller?.id === reseller.id ? '#00d4ff' : '#ef4444',
                                        selectedReseller?.id === reseller.id
                                    )}
                                    eventHandlers={{
                                        click: () => {
                                            if (onResellerSelect) {
                                                onResellerSelect(reseller);
                                            }
                                        },
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2">
                                            <h3 className="font-semibold text-gray-800 mb-2">{reseller.name}</h3>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <div className="flex items-start gap-2">
                                                    <FiMapPin className="w-4 h-4 mt-0.5 text-[#00d4ff]" />
                                                    <span>{reseller.address}, {reseller.district}, {reseller.city}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>📞</span>
                                                    <span>{reseller.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span>✉️</span>
                                                    <span>{reseller.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))
                        }
                    </MapContainer>
                ) : (
                    <div className="w-full h-full bg-[#0c131d] flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff] mx-auto mb-4"></div>
                            <p className="text-gray-300">{t('reseller.loadingMap')}</p>
                        </div>
                    </div>
                )}

                {/* Map Legend */}
                {isMapReady && (
                    <div className="absolute top-4 right-4 bg-[#0c131d] bg-opacity-90 rounded-lg p-3">
                        <div className="text-white text-sm">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-4 h-4 bg-[#00d4ff] rounded-full border-2 border-white"></div>
                                <span>{t('reseller.selectedDealer')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                                <span>{t('reseller.otherDealers')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Map Footer */}
            <div className="p-4 bg-[#0c131d] border-t border-gray-600">
                <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>{t('reseller.showingOnMap').replace('{count}', resellers.filter(r => r.coordinates).length.toString())}</span>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs">{t('reseller.clickMarkerForDetails')}</span>
                        {isFullscreen && (
                            <span className="text-xs text-[#00d4ff]">{t('reseller.pressEscToExit')}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}