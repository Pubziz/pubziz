import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Avatar, Divider, useTheme, Text, Title, ActivityIndicator } from 'react-native-paper';
import type { Pub } from '@/lib/types';

const getId = (pub: Pub, idx: number) => ((pub as any).id ? String((pub as any).id) : String(idx));
const initials = (name?: string) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('');

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [pubs, setPubs] = useState<Pub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPubs = async () => {
      try {
        const response = await fetch('http://172.20.10.3:9999/pubs');
        if (!response.ok) throw new Error('Failed to fetch pubs');
        const data: Pub[] = await response.json();
        console.log(data);
        setPubs(data);
      } catch (error) {
        console.error('Error fetching pubs:', error);
        setPubs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPubs();
  }, []);

  const renderItem = ({ item, index }: { item: Pub; index: number }) => {
    const id = getId(item, index);
    return (
      <Card
        mode="elevated"
        style={[styles.card, { backgroundColor: theme.colors.surface }]}
        elevation={2}
        onPress={() => router.push(`/(tabs)/map/${id}`)}
      >
        <Card.Title
          title={item.name}
          subtitle={item.address}
          left={() => (
            <Avatar.Text
              size={44}
              label={initials(item.name)}
              style={{ backgroundColor: theme.colors.primary }}
            />
          )}
        />
        <Card.Content>
          {item.items && item.items.length ? (
            <Text numberOfLines={2} variant="bodyMedium">
              {item.items[0].name} — {item.items[0].price}
            </Text>
          ) : (
            <Text numberOfLines={2} variant="bodyMedium" style={{ color: theme.colors.primary }}>
              No items listed
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Loading pubs…</Text>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.content}
            data={pubs}
            keyExtractor={(item, i) => getId(item, i)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <Divider />}
            ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.primary }]}>No pubs available</Text>}
            ListHeaderComponent={() => (
              <View style={styles.headerWrap}>
                <Title style={[styles.header, { color: theme.colors.onBackground }]}>Hospody</Title>
              </View>
            )}
          />
        )}
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { marginBottom: 12, elevation: 3 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  headerWrap: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  header: { fontSize: 28, fontWeight: 'bold' },
});
