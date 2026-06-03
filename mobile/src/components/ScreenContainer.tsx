import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useThemedStyles } from '@/theme';

export function ScreenContainer({
  children,
  scroll = true,
}: PropsWithChildren<{ scroll?: boolean }>) {
  const styles = useThemedStyles((c) => ({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1 },
    inner: { flex: 1, padding: spacing.md },
  }));

  const Content = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{Content}</ScrollView> : Content}
    </SafeAreaView>
  );
}
