import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import type { Pub } from '@/lib/types';

let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default ?? maps;
  Marker = maps.Marker;
  Callout = maps.Callout;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
  // react-native-maps not available in this build (e.g. Expo Go)
}

type LocEntry = {
  id: string;
  title: string;
  description: string;
  coordinate: { latitude: number; longitude: number } | null;
  address: string;
  raw: any;
};

export default function MapScreen() {
  const router = useRouter();
  const markerRefs = useRef<Record<string, any>>({});
  const mapRef = useRef<any>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 50.0755,
    longitude: 14.4378,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [locations, setLocations] = useState<LocEntry[]>([]);
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loadingPubs, setLoadingPubs] = useState(true);
  const geocodeCache = useRef<Record<string, { latitude: number; longitude: number }>>({});

  // request user location & center on user if allowed
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setInitialRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
          setHasUserLocation(true);
        } else {
          setHasUserLocation(false);
        }
      } catch {
        setHasUserLocation(false);
      }
    })();
  }, []);

  // fetch pubs from server
  useEffect(() => {
    const fetchPubs = async () => {
      try {
        const response = await fetch('http://172.20.10.3:9999/pubs');
        if (!response.ok) throw new Error('Failed to fetch pubs');
        const data: Pub[] = await response.json();
        setPubs(data);
      } catch (error) {
        console.error('Error fetching pubs:', error);
        // fallback to sample data if needed, but for now just set empty
        setPubs([]);
      } finally {
        setLoadingPubs(false);
      }
    };
    fetchPubs();
  }, []);

  // geocode addresses (uses expo-location geocodeAsync). caches results to avoid repeated requests.
  useEffect(() => {
    if (loadingPubs || pubs.length === 0) return;

    let mounted = true;
    (async () => {
      const out: LocEntry[] = [];

      for (let idx = 0; idx < pubs.length; idx++) {
        const pub = pubs[idx] as any;
        const id = pub.id ? String(pub.id) : String(idx);
        let coordinate: { latitude: number; longitude: number } | null = null;

        // if the data already contains coordinates (optional), use them
        if (pub.coordinate && typeof pub.coordinate.latitude === 'number') {
          coordinate = pub.coordinate;
        } else if (typeof pub.address === 'string' && pub.address.trim()) {
          // check cache first
          if (geocodeCache.current[pub.address]) {
            coordinate = geocodeCache.current[pub.address];
          } else {
            try {
              // geocodeAsync returns array of results
              const res = await Location.geocodeAsync(pub.address);
              if (res && res.length > 0) {
                coordinate = { latitude: res[0].latitude, longitude: res[0].longitude };
                geocodeCache.current[pub.address] = coordinate;
              }
            } catch (err) {
              // failed to geocode this address — skip it
              // continue, coordinate stays null
            }
            // small delay to be polite to geocoding service
            await new Promise((r) => setTimeout(r, 150));
          }
        }

        out.push({
          id,
          title: pub.name,
          description: pub.items?.[0]?.description ?? '',
          coordinate,
          address: pub.address,
          raw: pub,
        });
      }

      if (!mounted) return;
      // keep only entries with coordinates for map markers
      setLocations(out.filter((l) => l.coordinate !== null));
    })();

    return () => {
      mounted = false;
    };
  }, [pubs, loadingPubs]);

  // when map ready and we have markers or user location, adjust view
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (hasUserLocation) {
      try {
        mapRef.current.animateToRegion(initialRegion, 500);
      } catch {
        // fallback to fit
        const coords = [initialRegion, ...locations.map((l) => l.coordinate as any)];
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 80, bottom: 160, left: 80 },
          animated: true,
        });
      }
      return;
    }

    const coords = locations.map((l) => l.coordinate as any);
    if (coords.length) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 160, left: 80 },
        animated: true,
      });
    } else {
      mapRef.current.animateToRegion(initialRegion, 500);
    }
  }, [mapReady, hasUserLocation, initialRegion, locations]);

  if (!MapView) {
    return (
      <View style={styles.center}>
        <Text style={styles.warnTitle}>Map unavailable</Text>
        <Text style={styles.warnText}>
          react-native-maps not available in this build. Rebuild with the native module.
        </Text>
      </View>
    );
  }

  const onCalloutPress = (id: string) => {
    router.push(`/(tabs)/map/${id}`);
  };

  return (
    <View style={styles.container}>
      {(locations.length === 0 || loadingPubs) && (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8 }}>{loadingPubs ? 'Loading pubs…' : 'Geocoding addresses…'}</Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => setMapReady(true)}
      >
        {locations.map((loc) => {
          const isIOS = Platform.OS === 'ios';
          return (
            <Marker
              key={loc.id}
              ref={(ref: any) => {
                if (ref) markerRefs.current[loc.id] = ref;
                else delete markerRefs.current[loc.id];
              }}
              coordinate={loc.coordinate as any}
              title={loc.title}
              description={loc.description}
              tracksViewChanges={false}
              onPress={() => {
                markerRefs.current[loc.id]?.showCallout?.();
              }}
            >
              <Callout tooltip={isIOS} onPress={() => onCalloutPress(loc.id)}>
                <View style={styles.calloutBubble}>
                  <View style={styles.calloutContent}>
                    <Text style={styles.calloutTitle}>{loc.title}</Text>
                    <Text style={styles.calloutDesc} numberOfLines={3}>
                      {loc.description}
                    </Text>
                    <Text style={styles.calloutHint}>Tap anywhere here to view details</Text>
                  </View>
                  <View style={styles.calloutArrow} />
                </View>
              </Callout>
            </Marker>
          );
        })}

        <Marker coordinate={initialRegion} title="Your Location" pinColor="blue" />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    position: 'absolute',
    zIndex: 10,
    top: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 8,
    borderRadius: 8,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  warnTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  warnText: { textAlign: 'center', color: '#666' },
  map: { flex: 1 },

  calloutBubble: {
    alignItems: 'center',
    maxWidth: 260,
  },
  calloutContent: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 180,
  },
  calloutTitle: { fontWeight: '700', marginBottom: 4 },
  calloutDesc: { color: '#444' },
  calloutHint: { marginTop: 6, color: '#007aff', fontSize: 12 },

  calloutArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    marginTop: -1,
  },
});
