type MetricCardProps = {
  label: string;
  value: number;
  accent?: "warm" | "cool" | "alert";
};

export function MetricCard({ label, value, accent = "cool" }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

