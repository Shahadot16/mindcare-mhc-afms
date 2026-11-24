import { useEffect, useState } from 'react';
import { ShieldCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { Avatar, Badge, Button, Card, EmptyState, ErrorBox, PageHeader, PageLoader } from '@/components/ui';

const tone = (action) => {
  if (/delete|cancel|status|leave/.test(action)) return 'rose';
  if (/payment|payroll|invoice|expense/.test(action)) return 'emerald';
  if (/create|approve|complete/.test(action)) return 'brand';
  if (/view|review/.test(action)) return 'violet';
  return 'slate';
};

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 300); return () => clearTimeout(t); }, [search]);
  const { data, loading, error, reload } = useFetch(`/audit?page=${page}&action=${action}&search=${encodeURIComponent(q)}`);

  return (
    <>
      <PageHeader title="Audit log" subtitle="Who did what, and when. Kept for accountability and compliance." />
      <Card className="mb-5 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-10" placeholder="Search person or details…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-64" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All actions</option>
          {[...new Set((data?.actions || []).map((a) => a.split('.')[0]))].map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </Card>
      {error ? <ErrorBox message={error} onRetry={reload} /> : loading && !data ? <PageLoader /> : (
        <Card>
          {data.items.length === 0 ? <EmptyState icon={ShieldCheck} title="No activity recorded" /> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th><th>IP</th></tr></thead>
                <tbody>
                  {data.items.map((l) => (
                    <tr key={l._id}>
                      <td className="whitespace-nowrap text-slate-600">{new Date(l.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td><div className="flex items-center gap-2.5"><Avatar name={l.actorName} size="sm" /><div><p className="font-medium">{l.actorName}</p><p className="text-xs text-slate-500">{l.actorRole}</p></div></div></td>
                      <td><Badge tone={tone(l.action)}>{l.action}</Badge></td>
                      <td className="max-w-md text-slate-600">{l.summary}</td>
                      <td className="font-mono text-xs text-slate-400">{l.ip || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            <span>{data.total} entr{data.total === 1 ? 'y' : 'ies'}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
              <span>Page {data.page} of {data.pages}</span>
              <Button size="sm" variant="secondary" icon={ChevronRight} disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} />
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
