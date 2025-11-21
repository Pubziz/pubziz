import React from 'react';
import { ScrollView, View, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sampleData } from '@/lib/mapData';
import { Card, Title, Paragraph, Button, Divider, List, useTheme, Text } from 'react-native-paper';
import type { PubItem } from '@/lib/types';

export default function LocationDetail() {
  const { id } = useLocalSearchParams() as { id?: string };
  const router = useRouter();
  const theme = useTheme();

  const locations = sampleData.map((pub, idx) => {
    const pubId = (pub as any).id ? String((pub as any).id) : String(idx);
    let coordinate: { latitude: number; longitude: number } | null = null;

    if ((pub as any).coordinate && typeof (pub as any).coordinate.latitude === 'number') {
      coordinate = (pub as any).coordinate;
    } else if (typeof pub.address === 'string') {
      const m = pub.address.match(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
      if (m) coordinate = { latitude: parseFloat(m[1]), longitude: parseFloat(m[3]) };
    }

    return { id: pubId, pub, coordinate };
  });

  const entry = locations.find((l) => l.id === id);

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text>Location not found</Text>
        <Button mode="contained" onPress={() => router.push('/')} style={{ marginTop: 12 }}>
          Back to home
        </Button>
      </View>
    );
  }

  const { pub, coordinate } = entry;
  const items: PubItem[] = Array.isArray(pub.items) ? pub.items : [];

  const openWebsite = async (url?: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch {
      // ignore
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.container}>
      <View style={[styles.inner, { maxWidth: 900, alignSelf: 'center', width: '100%' }]}>
        {/* Info Card */}
        <Card mode="elevated" style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.title, { marginBottom: 12 }]}>{pub.name}</Title>
            <Paragraph style={[styles.addr, { color: theme.colors.primary }]}>{pub.address}</Paragraph>
            {coordinate ? (
              <Paragraph style={styles.coords}>
                {coordinate.latitude.toFixed(6)}, {coordinate.longitude.toFixed(6)}
              </Paragraph>
            ) : (
              <Paragraph style={[styles.note, { color: theme.colors.primary }]}>No coordinates available for this address.</Paragraph>
            )}
          </Card.Content>
          <Divider />
          <Card.Actions>
            <Button onPress={() => router.push('/')}>Back to home</Button>
            {pub.url ? <Button onPress={() => openWebsite(pub.url)}>Website</Button> : null}
          </Card.Actions>
        </Card>

        <Divider style={{ marginVertical: 16 }} />

        {/* Items Card */}
        <Card mode="elevated" style={[styles.itemsCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Menu / Items</Title>
            {items.length ? (
              items.map((it) => (
                <List.Item
                  key={String(it.id)}
                  title={it.name}
                  description={() => (
                    <View>
                      <Text style={styles.itemPrice}>{it.price}</Text>
                      {it.description ? <Paragraph style={styles.itemDesc}>{it.description}</Paragraph> : null}
                    </View>
                  )}
                  left={() => <List.Icon icon="glass-cocktail" />}
                />
              ))
            ) : (
              <Paragraph style={[styles.note, { color: theme.colors.primary }]}>No items listed.</Paragraph>
            )}
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  inner: {},
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  infoCard: { marginBottom: 6 },
  itemsCard: { marginTop: 6 },
  title: { fontSize: 20 },
  addr: { marginBottom: 6 },
  coords: { color: '#888', marginBottom: 6 },
  note: { marginBottom: 6 },
  sectionTitle: { fontSize: 18, marginBottom: 8 },
  itemPrice: { fontSize: 13, color: '#333' },
  itemDesc: { color: '#555', marginTop: 4 },
});