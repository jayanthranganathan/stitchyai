import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { spacing, typography, useThemedStyles } from '@/theme';

type Props = {
  title: string;
  description?: string;
  todos?: string[];
};

export function PlaceholderScreen({ title, description, todos = [] }: Props) {
  const styles = useThemedStyles((c) => ({
    title: { ...typography.h1, color: c.text, marginBottom: spacing.sm },
    desc: { ...typography.body, color: c.textMuted, marginBottom: spacing.lg },
    todoBox: {
      backgroundColor: c.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
    },
    todoHeader: { ...typography.caption, color: c.accent, marginBottom: spacing.sm, fontWeight: '700' as const },
    todoItem: { ...typography.body, color: c.text, marginBottom: spacing.xs },
  }));

  return (
    <ScreenContainer>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.desc}>{description}</Text> : null}
      {todos.length > 0 ? (
        <View style={styles.todoBox}>
          <Text style={styles.todoHeader}>TODO</Text>
          {todos.map((t) => (
            <Text key={t} style={styles.todoItem}>• {t}</Text>
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}
