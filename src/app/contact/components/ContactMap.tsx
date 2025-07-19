'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { FiMaximize, FiMinimize, FiZoomIn, FiZoomOut } from 'react-icons/fi';

interface ContactLocation {
    name: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

export default function ContactMap() {
    const [mapSrc, setMapSrc] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(15);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Default company location (you can change this to your actual location)
    const companyLocation: ContactLocation = {
        name: '4T Hi-tek',
        address: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh, Việt Nam',
        coordinates: {
            lat: 10.7769, // Ho Chi Minh City coordinates
            lng: 106.7009
        }
    };

    const updateMapSrc = useCallback(() => {
        const lat = companyLocation.coordinates.lat;
        const lng = companyLocation.coordinates.lng;
        const offset = 0.005 / Math.pow(2, zoomLevel - 15);
        const bbox = `${lng - offset},${lat - offset},${lng + offset},${lat + offset}`;
        setMapSrc(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`);
    }, [zoomLevel, companyLocation.coordinates.lat, companyLocation.coordinates.lng]);

    useEffect(() => {
        updateMapSrc();
    }, [updateMapSrc]);

    const handleZoomIn = () => {
        setZoomLevel((prev) => Math.min(prev + 1, 18));
    };

    const handleZoomOut = () => {
        setZoomLevel((prev) => Math.max(prev - 1, 1));
    };

    const toggleFullscreen = async () => {
        if (!mapContainerRef.current) return;

        try {
            if (!isFullscreen) {
                const element = mapContainerRef.current;
                if (element.requestFullscreen) {
                    await element.requestFullscreen();
                } else if ('webkitRequestFullscreen' in element) {
                    await (element as Element & { webkitRequestFullscreen(): Promise<void> }).webkitRequestFullscreen();
                } else if ('msRequestFullscreen' in element) {
                    await (element as Element & { msRequestFullscreen(): Promise<void> }).msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ('webkitExitFullscreen' in document) {
                    await (document as Document & { webkitExitFullscreen(): Promise<void> }).webkitExitFullscreen();
                } else if ('msExitFullscreen' in document) {
                    await (document as Document & { msExitFullscreen(): Promise<void> }).msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

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
            className={`bg-gray-800/30 border border-gray-700/50 rounded-lg overflow-hidden transition-all duration-300 ${
                isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}
        >
            {/* Map Header */}
            <div className="p-4 border-b border-gray-600 bg-gray-800/50">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Vị trí cửa hàng</h3>
                        <div>
                            <p className="text-[#4FC8FF] font-medium">{companyLocation.name}</p>
                            <p className="text-gray-300 text-sm">{companyLocation.address}</p>
                        </div>
                    </div>

                    {/* Map Controls */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleZoomOut}
                            disabled={!mapSrc}
                            className="p-2 bg-[#0c131d] text-white rounded-lg hover:bg-[#243447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Phóng nhỏ"
                        >
                            <FiZoomOut className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleZoomIn}
                            disabled={!mapSrc}
                            className="p-2 bg-[#0c131d] text-white rounded-lg hover:bg-[#243447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Phóng to"
                        >
                            <FiZoomIn className="w-4 h-4" />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            disabled={!mapSrc}
                            className="p-2 bg-[#0c131d] text-white rounded-lg hover:bg-[#243447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
                        >
                            {isFullscreen ? <FiMinimize className="w-4 h-4" /> : <FiMaximize className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className={`relative ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px]'}`}>
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
                        title="Company Location Map"
                    />
                ) : (
                    <div className="w-full h-full bg-[#0c131d] flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FC8FF] mx-auto mb-4"></div>
                            <p className="text-gray-300">Đang tải bản đồ...</p>
                        </div>
                    </div>
                )}

                {/* Zoom Level Indicator */}
                {mapSrc && (
                    <div className="absolute bottom-4 left-4 bg-[#0c131d] bg-opacity-90 rounded-lg px-3 py-2">
                        <span className="text-white text-sm">Zoom: {zoomLevel}</span>
                    </div>
                )}
            </div>

            {/* Map Footer */}
            <div className="p-3 bg-[#0c131d] border-t border-gray-600">
                <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>Địa chỉ liên hệ</span>
                    <div className="flex items-center space-x-4">
                        <span className="text-xs">Sử dụng Ctrl + Scroll để zoom</span>
                        {isFullscreen && (
                            <span className="text-xs text-[#4FC8FF]">Nhấn ESC để thoát toàn màn hình</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
