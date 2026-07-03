import type { components } from '@confighub/api';
import { useConfigHub } from '@confighub/react-auth';
import { useEffect, useState } from 'react';

type ExtendedSpace = components['schemas']['ExtendedSpace'];
type ExtendedUnit = components['schemas']['ExtendedUnit'];

function errText(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as Record<string, unknown>).message;
    if (typeof m === 'string') return m;
  }
  return typeof e === 'string' ? e : JSON.stringify(e);
}

export function SpaceBrowser() {
  const api = useConfigHub();
  const [spaces, setSpaces] = useState<ExtendedSpace[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [units, setUnits] = useState<ExtendedUnit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load the org's spaces once. This is the whole point of the sample: a plain
  // fetch through the typed client, no data-fetching library required.
  useEffect(() => {
    let cancelled = false;
    api.GET('/space').then(({ data, error }) => {
      if (cancelled) return;
      if (error) return setError(errText(error));
      setSpaces(data ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function openSpace(spaceId: string) {
    setSelected(spaceId);
    setUnits(null);
    setError(null);
    const { data, error } = await api.GET('/space/{space_id}/unit', {
      params: { path: { space_id: spaceId } },
    });
    if (error) return setError(errText(error));
    setUnits(data ?? []);
  }

  return (
    <div className="browser">
      <aside className="panel">
        <h2>Spaces {spaces && <span className="count">{spaces.length}</span>}</h2>
        {!spaces && <p className="muted">Loading…</p>}
        {spaces?.length === 0 && <p className="muted">No spaces yet.</p>}
        <ul className="list">
          {spaces?.map((s) => {
            const id = s.Space?.SpaceID;
            if (!id) return null;
            return (
              <li key={id}>
                <button
                  className={selected === id ? 'row selected' : 'row'}
                  onClick={() => openSpace(id)}
                >
                  <span className="name">{s.Space?.Slug ?? s.Space?.DisplayName ?? id}</span>
                  <span className="badge">{s.TotalUnitCount ?? 0} units</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="panel grow">
        {error && <pre className="error">{error}</pre>}
        {!selected && !error && <p className="muted">Select a space to list its units.</p>}
        {selected && !units && !error && <p className="muted">Loading units…</p>}
        {units && (
          <>
            <h2>Units {<span className="count">{units.length}</span>}</h2>
            {units.length === 0 && <p className="muted">This space has no units.</p>}
            <table className="units">
              <thead>
                <tr>
                  <th>Slug</th>
                  <th>Display name</th>
                  <th>Head rev</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.Unit?.UnitID ?? u.Unit?.Slug}>
                    <td>
                      <code>{u.Unit?.Slug}</code>
                    </td>
                    <td>{u.Unit?.DisplayName}</td>
                    <td>{u.Unit?.HeadRevisionNum ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
