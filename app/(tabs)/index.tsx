import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Avatar, Divider, useTheme, Text, Title } from 'react-native-paper';
import { sampleData } from '@/lib/mapData';
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
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, { maxWidth: 900, alignSelf: 'center' }]}
        data={sampleData}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { flex: 1 },
  content: { padding: 12, paddingBottom: 24 },
  card: { marginBottom: 10 },
  empty: { textAlign: 'center', marginTop: 40 },
  headerWrap: { paddingHorizontal: 4, paddingBottom: 16 },
  header: { fontSize: 32, fontWeight: '800' },
});
