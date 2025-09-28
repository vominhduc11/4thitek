interface GeocodingCache {
    [address: string]: {
        coordinates: { lat: number; lng: number };
        timestamp: number;
    };
}

interface GeocodingResult {
    lat: number;
    lng: number;
}

class GeocodingService {
    private cache: GeocodingCache = {};
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    private readonly REQUEST_TIMEOUT = 10000; // 10 seconds
    private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
    private readonly MAX_RETRIES = 3;
    private readonly BATCH_SIZE = 5; // Process 5 addresses at a time
    
    private lastRequestTime = 0;
    private pendingRequests = new Map<string, Promise<GeocodingResult | null>>();

    // Default coordinates for major Vietnamese cities
    private readonly DEFAULT_COORDINATES: { [key: string]: GeocodingResult } = {
        'ho chi minh city': { lat: 10.762622, lng: 106.660172 },
        'hanoi': { lat: 21.028511, lng: 105.804817 },
        'da nang': { lat: 16.047079, lng: 108.206230 },
        'can tho': { lat: 10.045162, lng: 105.746857 },
        'hai phong': { lat: 20.844912, lng: 106.687972 },
    };

    private getCacheKey(address: string): string {
        return address.toLowerCase().trim();
    }

    private isCacheValid(cacheEntry: { timestamp: number }): boolean {
        return Date.now() - cacheEntry.timestamp < this.CACHE_DURATION;
    }

    private getFromCache(address: string): GeocodingResult | null {
        const cacheKey = this.getCacheKey(address);
        const cached = this.cache[cacheKey];
        
        if (cached && this.isCacheValid(cached)) {
            return cached.coordinates;
        }
        
        // Remove expired cache entry
        if (cached) {
            delete this.cache[cacheKey];
        }
        
        return null;
    }

    private saveToCache(address: string, coordinates: GeocodingResult): void {
        const cacheKey = this.getCacheKey(address);
        this.cache[cacheKey] = {
            coordinates,
            timestamp: Date.now()
        };
    }

    private getDefaultCoordinates(address: string): GeocodingResult | null {
        const normalizedAddress = address.toLowerCase();
        
        for (const [city, coords] of Object.entries(this.DEFAULT_COORDINATES)) {
            if (normalizedAddress.includes(city)) {
                return coords;
            }
        }
        
        return null;
    }

    private async enforceRateLimit(): Promise<void> {
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
            const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.lastRequestTime = Date.now();
    }

    private async fetchWithTimeout(url: string): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
        
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': '4THITEK-Reseller-Locator/1.0'
                }
            });
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async geocodeSingleAddress(fullAddress: string, retryCount = 0): Promise<GeocodingResult | null> {
        try {
            // Check if we already have a pending request for this address
            if (this.pendingRequests.has(fullAddress)) {
                return await this.pendingRequests.get(fullAddress)!;
            }

            // Check cache first
            const cached = this.getFromCache(fullAddress);
            if (cached) {
                return cached;
            }

            // Create the geocoding promise
            const geocodingPromise = this.performGeocodingRequest(fullAddress);
            this.pendingRequests.set(fullAddress, geocodingPromise);

            try {
                const result = await geocodingPromise;
                return result;
            } finally {
                this.pendingRequests.delete(fullAddress);
            }
        } catch (error) {
            console.error(`Geocoding error for "${fullAddress}" (attempt ${retryCount + 1}):`, error);
            
            // Retry logic
            if (retryCount < this.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
                return this.geocodeSingleAddress(fullAddress, retryCount + 1);
            }
            
            // Return default coordinates as fallback
            const defaultCoords = this.getDefaultCoordinates(fullAddress);
            if (defaultCoords) {
                console.log(`Using default coordinates for "${fullAddress}":`, defaultCoords);
                return defaultCoords;
            }
            
            return null;
        }
    }

    private async performGeocodingRequest(fullAddress: string): Promise<GeocodingResult | null> {
        await this.enforceRateLimit();

        // Try OpenWeatherMap first (most reliable)
        const openWeatherResult = await this.tryOpenWeatherMapGeocoding(fullAddress);
        if (openWeatherResult) {
            return openWeatherResult;
        }

        // Try LocationIQ if available
        const locationIqResult = await this.tryLocationIqGeocoding(fullAddress);
        if (locationIqResult) {
            return locationIqResult;
        }

        // Try HERE API if available
        const hereResult = await this.tryHereGeocoding(fullAddress);
        if (hereResult) {
            return hereResult;
        }

        // Fallback to OpenStreetMap
        return this.tryOpenStreetMapGeocoding(fullAddress);
    }

    private async tryOpenWeatherMapGeocoding(fullAddress: string): Promise<GeocodingResult | null> {
        const openWeatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;
        if (!openWeatherApiKey) {
            console.warn('OpenWeatherMap API key not found, trying other providers');
            return null;
        }

        try {
            // Parse address components
            const addressParts = fullAddress.split(',').map(part => part.trim());
            
            // Format: {location name},{state code},{country code}
            let locationName = '';
            const stateCode = '';
            let countryCode = 'VN'; // Vietnam country code
            
            // Special logic for Vietnamese addresses
            if (addressParts.length >= 2) {
                const lastPart = addressParts[addressParts.length - 1].toLowerCase(); // Usually city
                const secondLastPart = addressParts.length >= 2 ? addressParts[addressParts.length - 2].toLowerCase() : ''; // Usually district
                
                // Handle Vietnam suffix
                if (lastPart.includes('vietnam') || lastPart.includes('việt nam')) {
                    countryCode = 'VN';
                    if (secondLastPart) {
                        locationName = secondLastPart;
                    }
                } else {
                    // Vietnamese address pattern: [street], [district], [city]
                    let city = lastPart;
                    const district = secondLastPart;
                    
                    // Standardize major cities
                    if (city.includes('ho chi minh') || city.includes('hồ chí minh')) {
                        city = 'ho chi minh city';
                    } else if (city.includes('ha noi') || city.includes('hà nội') || city.includes('hanoi')) {
                        city = 'hanoi';
                    } else if (city.includes('da nang') || city.includes('đà nẵng')) {
                        city = 'da nang';
                    }
                    
                    // For Ho Chi Minh City, include district for better precision
                    if (city.includes('ho chi minh') && district && district.includes('quận')) {
                        // Format: "District 1, Ho Chi Minh City" or "Quan 11, Ho Chi Minh City"
                        const districtNumber = district.replace(/quận|quan/gi, '').trim();
                        locationName = `District ${districtNumber}, Ho Chi Minh City`;
                    } else if (city.includes('hanoi') && district && district.includes('quận')) {
                        // Format: "District Ba Dinh, Hanoi"
                        const districtName = district.replace(/quận|quan/gi, '').trim();
                        locationName = `District ${districtName}, Hanoi`;
                    } else {
                        // Default: use city only
                        locationName = city;
                    }
                }
            } else {
                // Single part address, use as is
                locationName = addressParts[0] || '';
            }
            
            // Clean location name
            locationName = locationName.replace(/city|thành phố|tỉnh|province/gi, '').trim();
            
            // Format query according to OpenWeatherMap specification
            const searchQuery = stateCode 
                ? `${locationName},${stateCode},${countryCode}`
                : `${locationName},,${countryCode}`;
                
            const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(searchQuery)}&limit=1&appid=${openWeatherApiKey}`;
            
            console.log('🏠 Original address:', fullAddress);
            console.log('📝 Address parts:', addressParts);
            console.log('🎯 Parsed components:', { locationName, stateCode, countryCode });
            console.log('🔗 OpenWeatherMap URL:', url);
            
            const response = await this.fetchWithTimeout(url);
            
            if (!response.ok) {
                throw new Error(`OpenWeatherMap API HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('OpenWeatherMap response:', data);
            
            if (data && data.length > 0) {
                const location = data[0];
                const coordinates = {
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lon)
                };
                
                // Validate coordinates
                if (!isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
                    this.saveToCache(fullAddress, coordinates);
                    console.log(`OpenWeatherMap geocoding successful for: ${fullAddress}`, coordinates);
                    return coordinates;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('OpenWeatherMap geocoding failed:', error);
            return null;
        }
    }

    private async tryLocationIqGeocoding(fullAddress: string): Promise<GeocodingResult | null> {
        const locationIqApiKey = process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY;
        if (!locationIqApiKey) {
            console.warn('LocationIQ API key not found, trying other providers');
            return null;
        }

        try {
            const searchQuery = `${fullAddress}, Vietnam`;
            const url = `https://us1.locationiq.com/v1/search.php?key=${locationIqApiKey}&q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;
            
            const response = await this.fetchWithTimeout(url);
            
            if (!response.ok) {
                throw new Error(`LocationIQ API HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const coordinates = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
                
                // Validate coordinates
                if (!isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
                    this.saveToCache(fullAddress, coordinates);
                    console.log(`LocationIQ geocoding successful for: ${fullAddress}`);
                    return coordinates;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('LocationIQ geocoding failed:', error);
            return null;
        }
    }

    private async tryHereGeocoding(fullAddress: string): Promise<GeocodingResult | null> {
        const hereApiKey = process.env.NEXT_PUBLIC_HERE_API_KEY;
        if (!hereApiKey) {
            console.warn('HERE API key not found, falling back to OpenStreetMap');
            return null;
        }

        try {
            const searchQuery = `${fullAddress}, Vietnam`;
            const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(searchQuery)}&apikey=${hereApiKey}&limit=1`;
            
            const response = await this.fetchWithTimeout(url);
            
            if (!response.ok) {
                throw new Error(`HERE API HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data?.items && data.items.length > 0) {
                const item = data.items[0];
                const coordinates = {
                    lat: item.position?.lat,
                    lng: item.position?.lng
                };
                
                // Validate coordinates
                if (!isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
                    this.saveToCache(fullAddress, coordinates);
                    console.log(`HERE geocoding successful for: ${fullAddress}`);
                    return coordinates;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('HERE geocoding failed:', error);
            return null;
        }
    }

    private async tryOpenStreetMapGeocoding(fullAddress: string): Promise<GeocodingResult | null> {
        try {
            const searchQuery = `${fullAddress}, Vietnam`;
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`;
            
            const response = await this.fetchWithTimeout(url);
            
            if (!response.ok) {
                throw new Error(`OpenStreetMap HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data && data.length > 0) {
                const coordinates = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
                
                // Validate coordinates
                if (!isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
                    this.saveToCache(fullAddress, coordinates);
                    console.log(`OpenStreetMap geocoding successful for: ${fullAddress}`);
                    return coordinates;
                }
            }
            
            return null;
        } catch (error) {
            console.warn('OpenStreetMap geocoding failed:', error);
            return null;
        }
    }

    async geocodeAddresses(addresses: string[]): Promise<(GeocodingResult | null)[]> {
        if (addresses.length === 0) return [];

        const results: (GeocodingResult | null)[] = new Array(addresses.length).fill(null);
        const addressesToGeocode: { address: string; index: number }[] = [];

        // First pass: check cache and collect addresses that need geocoding
        addresses.forEach((address, index) => {
            const cached = this.getFromCache(address);
            if (cached) {
                results[index] = cached;
            } else {
                addressesToGeocode.push({ address, index });
            }
        });

        // Process addresses in batches
        for (let i = 0; i < addressesToGeocode.length; i += this.BATCH_SIZE) {
            const batch = addressesToGeocode.slice(i, i + this.BATCH_SIZE);
            
            // Process batch concurrently (with rate limiting handled internally)
            const batchResults = await Promise.allSettled(
                batch.map(({ address }) => this.geocodeSingleAddress(address))
            );

            // Store results
            batch.forEach(({ index }, batchIndex) => {
                const result = batchResults[batchIndex];
                if (result.status === 'fulfilled') {
                    results[index] = result.value;
                } else {
                    console.error(`Failed to geocode address at index ${index}:`, result.reason);
                    // Try to get default coordinates as final fallback
                    const defaultCoords = this.getDefaultCoordinates(batch[batchIndex].address);
                    results[index] = defaultCoords || { lat: 10.762622, lng: 106.660172 }; // Ho Chi Minh City center
                }
            });
        }

        return results;
    }

    async geocodeSingle(address: string): Promise<GeocodingResult | null> {
        const results = await this.geocodeAddresses([address]);
        return results[0];
    }

    // Method to preload coordinates for known addresses
    preloadCoordinates(addressCoordinateMap: { [address: string]: GeocodingResult }): void {
        Object.entries(addressCoordinateMap).forEach(([address, coordinates]) => {
            this.saveToCache(address, coordinates);
        });
    }

    // Clear expired cache entries
    clearExpiredCache(): void {
        const now = Date.now();
        Object.keys(this.cache).forEach(key => {
            if (now - this.cache[key].timestamp > this.CACHE_DURATION) {
                delete this.cache[key];
            }
        });
    }

    // Get cache statistics
    getCacheStats(): { totalEntries: number; validEntries: number } {
        const totalEntries = Object.keys(this.cache).length;
        const validEntries = Object.values(this.cache).filter(entry => 
            this.isCacheValid(entry)
        ).length;
        
        return { totalEntries, validEntries };
    }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
export type { GeocodingResult };