import Link from 'next/link';

export default function SectionHeader({
  title,
  ctaLabel,
  href,
}: {
  title: string;
  ctaLabel?: string;
  href?: string;
}) {
  return (
    <div className="mb-12 flex items-center justify-between">
      <h2 className="text-3xl font-bold">{title}</h2>
      {ctaLabel && href ? (
        <Link href={href} className="text-sm font-medium text-slate-700 hover:underline">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
