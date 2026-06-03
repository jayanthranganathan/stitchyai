export const formatters = {
  inr(amount: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  },
  dateLong(iso: string | Date): string {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  relativeDays(iso: string | Date): string {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days > 0) return `in ${days} days`;
    return `${Math.abs(days)} days ago`;
  },
};
