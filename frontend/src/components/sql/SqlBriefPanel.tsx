import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Database, FileText, Table2, ChevronRight, KeyRound, Loader2 } from 'lucide-react';
import { Challenge } from '../../types';
import {
  SchemaTable,
  SqlResultSet,
  createChallengeDatabase,
  describeSchema,
  previewTable,
} from '../../lib/sqlEngine';

interface SqlBriefPanelProps {
  challenge: Challenge | null;
}

type BriefTab = 'question' | 'schema';

export const SqlBriefPanel: React.FC<SqlBriefPanelProps> = ({ challenge }) => {
  const [tab, setTab] = useState<BriefTab>('question');
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [previews, setPreviews] = useState<Record<string, SqlResultSet | null>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const schemaScript = challenge?.sql_schema || '';

  // Build a throwaway database purely to introspect the dataset for the browser.
  useEffect(() => {
    let cancelled = false;
    if (!schemaScript.trim()) {
      setTables([]);
      return;
    }

    setIsLoadingSchema(true);
    setSchemaError(null);

    (async () => {
      try {
        const db = await createChallengeDatabase(schemaScript);
        const described = describeSchema(db);
        const rowPreviews: Record<string, SqlResultSet | null> = {};
        for (const table of described) {
          rowPreviews[table.name] = previewTable(db, table.name, 5);
        }
        db.close();

        if (cancelled) return;
        setTables(described);
        setPreviews(rowPreviews);
        setExpanded(described.length ? described[0].name : null);
      } catch (err) {
        if (!cancelled) setSchemaError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setIsLoadingSchema(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [schemaScript]);

  return (
    <div className="h-full bg-[#0d131f] flex flex-col overflow-hidden">
      {/* Panel header with difficulty badge */}
      <div className="bg-[#111827] px-4 py-2 border-b border-[#273549] flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex items-center space-x-2 font-medium text-gray-200">
          <Database className="w-4 h-4 text-[#D9C8A3]" />
          <span>SQL Assessment</span>
        </div>
        {challenge?.difficulty && (
          <span className="bg-[#D9C8A3]/10 text-[#D9C8A3] border border-[#D9C8A3]/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {challenge.difficulty}
          </span>
        )}
      </div>

      {/* Question / Schema tabs */}
      <div className="bg-[#0d131f] px-2 py-1.5 border-b border-[#273549] flex items-center space-x-1 flex-shrink-0">
        <button
          onClick={() => setTab('question')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            tab === 'question'
              ? 'bg-[#D9C8A3]/15 text-[#D9C8A3] border border-[#D9C8A3]/30'
              : 'text-gray-400 hover:text-white hover:bg-[#161e2e]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Question</span>
        </button>
        <button
          onClick={() => setTab('schema')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            tab === 'schema'
              ? 'bg-[#D9C8A3]/15 text-[#D9C8A3] border border-[#D9C8A3]/30'
              : 'text-gray-400 hover:text-white hover:bg-[#161e2e]'
          }`}
        >
          <Table2 className="w-3.5 h-3.5" />
          <span>Schema ({tables.length})</span>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        {tab === 'question' ? (
          <div className="p-5">
            <h2 className="text-base font-bold text-[#F7F5F2] mb-3 leading-snug">
              {challenge?.title || 'SQL Challenge'}
            </h2>
            {challenge?.description ? (
              <div className="sql-brief text-[13px] text-[#C9C7C3] leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{challenge.description}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No description provided for this challenge.</p>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {isLoadingSchema && (
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#D9C8A3]" />
                <span>Building sandbox database...</span>
              </div>
            )}

            {schemaError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg p-3 font-mono">
                Schema script failed: {schemaError}
              </div>
            )}

            {!isLoadingSchema && !schemaError && tables.length === 0 && (
              <p className="text-xs text-gray-500">
                This challenge has no sandbox dataset attached yet.
              </p>
            )}

            {tables.map((table) => {
              const isOpen = expanded === table.name;
              const preview = previews[table.name];

              return (
                <div
                  key={table.name}
                  className="bg-[#111827] border border-[#273549] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : table.name)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#161e2e] transition text-left"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      />
                      <Table2 className="w-3.5 h-3.5 text-[#D9C8A3] flex-shrink-0" />
                      <span className="text-xs font-semibold text-[#F7F5F2] font-mono truncate">
                        {table.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono flex-shrink-0 ml-2">
                      {table.rowCount} rows
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-[#273549]">
                      {/* Column definitions */}
                      <div className="px-3 py-2 space-y-1">
                        {table.columns.map((col) => (
                          <div
                            key={col.name}
                            className="flex items-center justify-between text-[11px] font-mono"
                          >
                            <span className="flex items-center space-x-1.5 min-w-0">
                              {col.primaryKey && (
                                <KeyRound className="w-3 h-3 text-[#FFC857] flex-shrink-0" />
                              )}
                              <span className="text-[#C9C7C3] truncate">{col.name}</span>
                            </span>
                            <span className="text-gray-500 flex-shrink-0 ml-2">
                              {col.type}
                              {col.notNull && <span className="text-gray-600"> · NOT NULL</span>}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Sample rows */}
                      {preview && preview.rows.length > 0 && (
                        <div className="border-t border-[#273549] overflow-x-auto">
                          <div className="px-3 pt-2 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                            Sample rows
                          </div>
                          <table className="w-full text-[11px] font-mono">
                            <thead>
                              <tr className="text-gray-500">
                                {preview.columns.map((c) => (
                                  <th key={c} className="px-3 py-1.5 text-left font-medium whitespace-nowrap">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="text-[#C9C7C3]">
                              {preview.rows.map((row, i) => (
                                <tr key={i} className="border-t border-[#273549]/50">
                                  {row.map((cell, j) => (
                                    <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                                      {cell === null ? (
                                        <span className="text-gray-600 italic">NULL</span>
                                      ) : (
                                        String(cell)
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
