import {ReactNode, useEffect, useId, useRef, useState} from 'react';

export type DeliveryStatus = 'all' | 'delivered' | 'processing' | 'failed';

export interface Delivery {
  id: string;
  title: string;
  status: Exclude<DeliveryStatus, 'all'>;
}

export interface PageResult {
  rows: Delivery[];
  total: number;
}

export interface FetchPageParams {
  page: number;
  pageSize: number;
  status: DeliveryStatus;
}

export interface PaginatedTableProps {
  fetchPage: (params: FetchPageParams) => Promise<PageResult>;
  pageSize?: number;
}

export const STATUS_OPTIONS: DeliveryStatus[] = [
  'all',
  'delivered',
  'processing',
  'failed',
];

export function PaginatedTable({ fetchPage, pageSize = 10 }: PaginatedTableProps): ReactNode {
  const id = useId()
  const [status, setStatus] = useState<DeliveryStatus>('all');
  const [page, setPage] = useState<number>(1);
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState(0);

  const selectStatus = (status: string) => {
    if(!STATUS_OPTIONS.includes(status as DeliveryStatus)) {
      return;
    }

    setStatus(status as DeliveryStatus);
    setPage(1);
  }

  const totalRows = Math.ceil(total / pageSize);

  useEffect(() => {
    setLoading(true);

    let cancelled = false;

    fetchPage({ page, pageSize, status })
      .then((data) => {
        if(cancelled) return;
        setRows(data.rows);
        setTotal(data.total);
      }).finally(() => {
        setLoading(false);
    })


    return () => {
      cancelled = true;
    }

  }, [page, status, pageSize]);

  return (
    <div>
      <label htmlFor={id}>Status</label>
      <select id={id} value={status} onChange={(e) => selectStatus(e.target.value)}>
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>

      {loading && <div>Loading deliveries…</div>}
      {!loading && (
        <table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.id}
                </td>
                <td>
                  {row.title}
                </td>
                <td>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && (<div>
        Page {page} of {totalRows} · {total} deliveries
      </div>)}
      <div>
        <button disabled={loading || page <= 1} type="button" onClick={() => setPage((page) => page - 1)}>Previous page</button>
        <button disabled={loading || page >= totalRows} type="button" onClick={() => setPage((page) => page + 1)}>Next page</button>
      </div>
    </div>
  )
}
