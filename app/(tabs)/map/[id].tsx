import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sampleData } from '@/lib/mapData';

export default function LocationDetail() {
  const { id } = useLocalSearchParams() as { id?: string };
  const router = useRouter();

  // Derive the same id/coordinate mapping used on the map screen
  const locations = sampleData.map((pub, idx) => {
    const pubId = (pub as any).id ? String((pub as any).id) : String(idx);
    let coordinate: { latitude: number; longitude: number } | null = null;

    if ((pub as any).coordinate && typeof (pub as any).coordinate.latitude === 'number') {
      coordinate = (pub as any).coordinate;
    } else if (typeof pub.address === 'string') {
      const m = pub.address.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
      if (m) coordinate = { latitude: parseFloat(m[1]), longitude: parseFloat(m[3]) };
    }

    return {
      id: pubId,
      pub,
      coordinate,
    };
  });

  const entry = locations.find((l) => l.id === id);

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text>Location not found</Text>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const { pub, coordinate } = entry;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{pub.name}</Text>
      <Text style={styles.addr}>{pub.address}</Text>

      {coordinate ? (
        <Text style={styles.coords}>
          {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
        </Text>
      ) : (
        <Text style={styles.note}>No coordinates available for this address.</Text>
      )}

      <Text style={styles.sectionTitle}>Menu / Items</Text>
      {Array.isArray(pub.items) && pub.items.length ? (
        pub.items.map((it) => (
          <View key={String(it.id)} style={styles.item}>
            <Text style={styles.itemName}>{it.name}</Text>
            <Text style={styles.itemPrice}>{it.price}</Text>
            {it.description ? <Text style={styles.itemDesc}>{it.description}</Text> : null}
          </View>
        ))
      ) : (
        <Text style={styles.note}>No items listed.</Text>
      )}

      <View style={styles.buttons}>
        <Button title="Back to map" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  addr: { fontSize: 14, color: '#666', marginBottom: 8 },
  coords: { fontSize: 12, color: '#888', marginBottom: 12 },
  note: { fontSize: 13, color: '#999', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  item: { marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemPrice: { fontSize: 13, color: '#333', marginBottom: 4 },
  itemDesc: { fontSize: 13, color: '#555' },
  buttons: { marginTop: 20 },
});