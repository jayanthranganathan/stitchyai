import { FlatList, Pressable, Text } from 'react-native';

import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useDesigns } from '@/features/customer/hooks/useCustomerQueries';
import { spacing, typography, useThemedStyles } from '@/theme';
import { formatters } from '@/utils/formatters';

import type { CustomerScreenProps } from '@/navigation/types';

export function DesignsScreen({ route, navigation }: CustomerScreenProps<'Designs'>) {
  const { categorySlug } = route.params;
  const { data, isLoading } = useDesigns(categorySlug);
  const styles = useThemedStyles((c) => ({
    muted: { ...typography.body, color: c.textMuted, marginBottom: spacing.md },
    title: { ...typography.h2, color: c.text },
    body: { ...typography.body, color: c.textMuted, marginTop: spacing.xs },
    price: { ...typography.body, color: c.primary, fontWeight: '600' as const, marginTop: spacing.sm },
  }));

  return (
    <ScreenContainer scroll={false}>
      {isLoading ? <Text style={styles.muted}>Loading designs…</Text> : null}
      <FlatList
        data={data ?? []}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('CreateOrder', { designId: item.id, categorySlug })}
          >
            <Card>
              <Text style={styles.title}>{item.name}</Text>
              {item.description ? <Text style={styles.body}>{item.description}</Text> : null}
              <Text style={styles.price}>From {formatters.inr(item.base_price)}</Text>
            </Card>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}
