import {
  useDownloadUnitDataQuery,
  useListSpacesQuery,
  useListUnitsQuery,
} from '@confighub/rtk-query';
import { skipToken } from '@reduxjs/toolkit/query';
import { useState } from 'react';

function errText(e: unknown): string {
  return JSON.stringify(e);
}

export function SpaceBrowser() {
  // RTK Query hooks: caching, dedup, and loading state come for free. Compare with the
  // plain example's manual fetch + useState in the same component.
  const { data: spaces, isLoading: spacesLoading, error: spacesError } = useListSpacesQuery({});
  const [selected, setSelected] = useState<string | null>(null);
  const {
    data: units,
    isFetching: unitsFetching,
    error: unitsError,
  } = useListUnitsQuery(selected ? { spaceId: selected } : skipToken);

  // Configuration is not a field of a Unit -- a list of Units carries each one's DataHash
  // and DataSize, not its document. It is read from the Unit's own data endpoint, which
  // serves the configuration itself as application/octet-stream. The base query is
  // configured with responseHandler: 'content-type' so this arrives as a string; the RTK
  // default would JSON.parse it and hand back a parse error with no data.
  const [openUnit, setOpenUnit] = useState<{ unitId: string; slug: string } | null>(null);
  const { data: config, error: configError } = useDownloadUnitDataQuery(
    selected && openUnit ? { spaceId: selected, unitId: openUnit.unitId } : skipToken,
  );

  return (
    <div className="browser">
      <aside className="panel">
        <h2>Spaces {spaces && <span className="count">{spaces.length}</span>}</h2>
        {spacesLoading && <p className="muted">Loading…</p>}
        {spacesError && <pre className="error">{errText(spacesError)}</pre>}
        <ul className="list">
          {spaces?.map((s) => {
            const id = s.Space?.SpaceID;
            if (!id) return null;
            return (
              <li key={id}>
                <button
                  className={selected === id ? 'row selected' : 'row'}
                  onClick={() => {
                    setSelected(id);
                    setOpenUnit(null);
                  }}
                >
                  <span className="name">{s.Space?.Slug ?? id}</span>
                  <span className="badge">{s.TotalUnitCount ?? 0} units</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="panel grow">
        {!selected && <p className="muted">Select a space to list its units.</p>}
        {unitsError && <pre className="error">{errText(unitsError)}</pre>}
        {selected && unitsFetching && !units && <p className="muted">Loading units…</p>}
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
                  <th>Bytes</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => {
                  const unitId = u.Unit?.UnitID;
                  const slug = u.Unit?.Slug ?? '';
                  return (
                    <tr key={unitId ?? slug}>
                      <td>
                        {unitId ? (
                          <button
                            className="linklike"
                            onClick={() => setOpenUnit({ unitId, slug })}
                          >
                            <code>{slug}</code>
                          </button>
                        ) : (
                          <code>{slug}</code>
                        )}
                      </td>
                      <td>{u.Unit?.DisplayName}</td>
                      <td>{u.Unit?.HeadRevisionNum ?? '—'}</td>
                      <td>{u.Unit?.DataSize ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {openUnit && (
              <>
                <h2>
                  Configuration <code>{openUnit.slug}</code>
                </h2>
                {configError && <pre className="error">{errText(configError)}</pre>}
                {/* An empty configuration is a configuration -- a Unit whose resources
                    have been withdrawn -- so it is shown as empty, not as "not loaded". */}
                {config !== undefined && <pre className="config">{config}</pre>}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
