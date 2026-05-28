import { Card } from './Card';

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card title={label} className="min-h-[192px]" colSpan="col-span-1" rowSpan="row-span-1">
      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight transition-colors duration-300">{value}</span>
      </div>
    </Card>
  );
}
