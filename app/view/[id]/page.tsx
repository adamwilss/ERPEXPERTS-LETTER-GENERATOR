import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { loadPackById, trackPackView, getPackViewCount } from '@/lib/db/history-db';
import { parseOutput } from '@/lib/parse';
import ViewPageClient from './ViewPageClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ViewPage({ params }: Props) {
  const { id } = await params;
  const pack = await loadPackById(id);

  if (!pack) {
    notFound();
  }

  // Track view using server headers
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || null;
  const userAgent = requestHeaders.get('user-agent');
  await trackPackView(id, ipAddress, userAgent).catch(() => {
    // Silently ignore tracking errors
  });

  const viewCount = await getPackViewCount(id);
  const { part1, part2, part3 } = parseOutput(pack.completion);

  return (
    <ViewPageClient
      companyName={pack.company}
      recipientName={pack.recipientName}
      jobTitle={pack.contactTitle}
      businessCase={part2}
      techMap={part3}
      viewCount={viewCount}
      packId={id}
    />
  );
}
