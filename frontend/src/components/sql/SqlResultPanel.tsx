import React, { useCallback, useEffect, useState } from 'react';
import { Play, AlertTriangle, Table2, Clock, Loader2, RotateCcw, Terminal } from 'lucide-react';
import { useBuilderStore } from '../../stores/builderStore';
import { SqlRunOutcome, createChallengeDatabase, runQuery } from '../../lib/sqlEngine';

export const SqlResultPanel: React.FC = () => {
  const challenge = useBuilderStore((state) => state.challenge);
  const sqlCode = useBuilderStore((state) => state.sqlCode);

  const [outcome, setOutcome] = useState<SqlRunOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const schemaScript = challenge?.sql_schema || '';

  const execute = useCallback(async () => {
    if (!sqlCode.trim()) {
      setError('Nothing to run — write a query first.');
      setOutcome(null);
      setHasRun(true);
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      // Rebuilt every run, so a candidate's UPDATE/DELETE never leaks into the next attempt.
      const db = await createChallengeDatabase(schemaScript);
      try {
        setOutcome(runQuery(db, sqlCode));
      } finally {
        db.close();
      }
    } catch (err) {
      setOutcome(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setHasRun(true);
    }
  }, [sqlCode, schemaScript]);

  // Ctrl/Cmd+Enter runs the query, matching the muscle memory of every SQL client.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        execute();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [execute]);

  const resultSets = outcome?.results ?? [];
  const totalRows = resultSets.reduce((sum, r) => sum + r.rows.length, 0);

  return (
    <div className="h-full bg-[#090d16] flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#111827] px-4 py-2 border-b border-[#273549] flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center space-x-2">
          <button
            onClick={execute}
            disabled={isRunning}
            className="flex items-center space-x-1.5 bg-[#4ADE80] hover:bg-[#B8FF4F] disabled:opacity-50 disabled:cursor-not-allowed text-[#13191D] font-bold px-3 py-1.5 rounded-lg transition shadow-md"
          >
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Query'}</span>
          </button>
          <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">Ctrl+Enter</span>

          {hasRun && (
            <button
              onClick={() => {
                setOutcome(null);
                setError(null);
                setHasRun(false);
              }}
              title="Clear results"
              className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161e2e] rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 text-gray-400 font-mono text-[11px]">
          {outcome && (
            <>
              <span className="bg-[#161e2e] px-2 py-0.5 rounded border border-[#273549] flex items-center space-x-1">
                <Table2 className="w-3 h-3" />
                <span>{totalRows} rows</span>
              </span>
              <span className="bg-[#161e2e] px-2 py-0.5 rounded border border-[#273549] flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{outcome.elapsedMs} ms</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-auto">
        {!hasRun && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <Terminal className="w-12 h-12 mb-3 text-gray-600" />
            <p className="text-sm font-medium text-gray-400">Result grid is empty</p>
            <p className="text-xs text-gray-600 mt-1 max-w-xs">
              Write your query in the editor, then press <strong>Run Query</strong> to execute it
              against the sandbox dataset.
            </p>
          </div>
        )}

        {error && (
          <div className="m-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-300 mb-1">SQLite error</p>
                <p className="text-xs font-mono text-red-400 break-words">{error}</p>
              </div>
            </div>
          </div>
        )}

        {outcome && !error && resultSets.length === 0 && (
          <div className="m-4 bg-[#111827] border border-[#273549] rounded-xl p-4 text-xs text-gray-400">
            Statement executed successfully but returned no result set.
            {outcome.rowsModified > 0 && (
              <span className="text-[#D9C8A3]"> {outcome.rowsModified} row(s) modified.</span>
            )}
          </div>
        )}

        {resultSets.map((result, idx) => (
          <div key={idx} className="border-b border-[#273549] last:border-b-0">
            {resultSets.length > 1 && (
              <div className="px-4 py-1.5 bg-[#111827] text-[10px] uppercase tracking-wider text-gray-500 font-semibold border-b border-[#273549]">
                Result set {idx + 1} · {result.rows.length} rows
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse">
                <thead className="bg-[#111827] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-600 font-medium border-b border-[#273549] w-10">
                      #
                    </th>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left text-[#D9C8A3] font-semibold border-b border-[#273549] whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[#C9C7C3]">
                  {result.rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={result.columns.length + 1}
                        className="px-3 py-6 text-center text-gray-600 italic"
                      >
                        Query ran successfully but matched 0 rows.
                      </td>
                    </tr>
                  ) : (
                    result.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-b border-[#273549]/40 hover:bg-[#111827]/60">
                        <td className="px-3 py-1.5 text-gray-600 text-[10px]">{rowIdx + 1}</td>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="px-3 py-1.5 whitespace-nowrap">
                            {cell === null ? (
                              <span className="text-gray-600 italic">NULL</span>
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
