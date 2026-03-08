import { useState, useCallback, useRef, useEffect } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import NeonButton from '@/components/ui/NeonButton';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { parseImportFile, processImport, downloadTemplate, type ParseResult, type ParsedRow } from '@/services/importService';
import { Link } from 'react-router-dom';

type Phase = 'upload' | 'preview' | 'confirm' | 'progress' | 'done';

export default function ImportAccountsPage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parseError, setParseError] = useState('');
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setParseError('');
    setFileName(file.name);
    try {
      const result = await parseImportFile(file);
      setParseResult(result);
      setPhase('preview');
    } catch (err: any) {
      setParseError(err.message || 'Failed to parse file');
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleLaunch = async () => {
    if (!parseResult) return;
    setPhase('progress');
    const result = await processImport({ rows: parseResult.rows });
    setImportResult(result);
    // Animate progress
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8 + 3;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setPhase('done'), 500);
      }
      setProgress(Math.min(100, Math.round(p)));
    }, 400);
  };

  const displayRows = parseResult?.rows
    ? (showErrorsOnly ? parseResult.rows.filter(r => !r.valid) : parseResult.rows.slice(0, 20))
    : [];

  const templateColumns = [
    'First Name *', 'Last Name *', 'Phone Number *', 'Email Address',
    'Full Address *', 'City *', 'Province / State *', 'Postal / Zip Code',
    'Amount Owed *', 'Original Loan Date', 'Days Overdue *', 'Loan Type', 'Notes'
  ];

  return (
    <PageWrapper title="Import Accounts">
      {phase === 'upload' && (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          {/* Step 1: Template */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Step 1 — Download the Template</h2>
            <p className="text-xs text-muted-foreground mb-4">Download our Excel template. Fill in one row per debtor. Required fields are marked with *.</p>
            <div className="flex gap-2 mb-4">
              <NeonButton size="sm" onClick={() => downloadTemplate('xlsx')}><Download className="w-3 h-3" /> Excel Template (.xlsx)</NeonButton>
              <NeonButton size="sm" onClick={() => downloadTemplate('csv')}><Download className="w-3 h-3" /> CSV Template (.csv)</NeonButton>
            </div>
            <div className="bg-card border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border">
                    {templateColumns.map(c => (
                      <th key={c} className={`px-3 py-2 text-left font-medium whitespace-nowrap ${c.includes('*') ? 'text-foreground' : 'text-muted-foreground'}`}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-muted-foreground">
                    <td className="px-3 py-1.5">Marcus</td><td className="px-3 py-1.5">Allen</td><td className="px-3 py-1.5 font-mono">+15552104400</td>
                    <td className="px-3 py-1.5">marcus@email.com</td><td className="px-3 py-1.5">123 Main St</td><td className="px-3 py-1.5">Montreal</td>
                    <td className="px-3 py-1.5">QC</td><td className="px-3 py-1.5">H2X 1Y4</td><td className="px-3 py-1.5 font-mono">850</td>
                    <td className="px-3 py-1.5 font-mono">2024-12-01</td><td className="px-3 py-1.5 font-mono">45</td><td className="px-3 py-1.5">Payday</td><td className="px-3 py-1.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Do not change column headers. Extra columns will be ignored.</p>
          </div>

          {/* Step 2: Drop Zone */}
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Step 2 — Upload Your File</h2>
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              }`}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground mb-1">Drag your file here</p>
              <p className="text-xs text-muted-foreground mb-3">or <span className="text-primary">Browse Files</span></p>
              <p className="text-[10px] text-muted-foreground">Accepted: .xlsx · .xls · .csv — Max 10MB · Max 5,000 rows</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFileSelect} />
            {parseError && (
              <div className="flex items-center gap-2 mt-3 text-destructive text-xs">
                <AlertCircle className="w-3.5 h-3.5" /> {parseError}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'preview' && parseResult && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Step 3 — Review Your Accounts</h2>
            <div className="flex items-center gap-4 text-xs mt-2">
              <div className="flex items-center gap-1.5 text-status-green">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-mono">{parseResult.validCount}</span> accounts ready to import
              </div>
              {parseResult.errorCount > 0 && (
                <div className="flex items-center gap-1.5 text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="font-mono">{parseResult.errorCount}</span> rows have errors
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {parseResult.errorCount > 0 && (
              <button onClick={() => setShowErrorsOnly(!showErrorsOnly)} className={`text-[10px] px-2 py-1 rounded transition-colors ${showErrorsOnly ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {showErrorsOnly ? 'Show all' : 'Show errors only'}
              </button>
            )}
            <span className="text-[10px] text-muted-foreground">
              Showing {displayRows.length} of {parseResult.totalCount} rows
            </span>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['#', 'Full Name', 'Phone', 'Address', 'Amount', 'Days Overdue', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => (
                  <tr key={i} className={`border-b border-border/50 ${!row.valid ? 'bg-destructive/5' : 'hover:bg-muted/30'} transition-colors`}>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.rowIndex}</td>
                    <td className={`px-4 py-2.5 ${!row.fullName ? 'text-destructive' : 'text-foreground'}`}>
                      {row.fullName || '[MISSING]'}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.phone}</td>
                    <td className="px-4 py-2.5 text-muted-foreground truncate max-w-[200px]">{row.address}, {row.city}</td>
                    <td className="px-4 py-2.5 font-mono">${row.amount.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-mono">{row.daysOverdue}</td>
                    <td className="px-4 py-2.5">
                      {row.valid ? (
                        <CheckCircle className="w-3.5 h-3.5 text-status-green" />
                      ) : (
                        <span className="text-[10px] text-destructive">{row.errors.join(', ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between pt-2">
            <NeonButton size="sm" onClick={() => { setPhase('upload'); setParseResult(null); }}>
              <ArrowLeft className="w-3 h-3" /> Back
            </NeonButton>
            <NeonButton variant="solid" size="sm" onClick={() => setPhase('confirm')}>
              Continue <ArrowRight className="w-3 h-3" />
            </NeonButton>
          </div>
        </div>
      )}

      {phase === 'confirm' && parseResult && (
        <div className="max-w-lg mx-auto animate-fade-in">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Ready to Launch</h2>
            <div className="space-y-2 text-xs mb-6">
              <div className="flex items-center gap-2 text-status-green">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-mono">{parseResult.validCount}</span> accounts will be imported
              </div>
              {parseResult.errorCount > 0 && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="font-mono">{parseResult.errorCount}</span> accounts skipped (errors)
                </div>
              )}
            </div>

            <div className="bg-muted border border-border rounded-md p-4 mb-6">
              <p className="text-xs font-medium text-foreground mb-2">What happens next:</p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• Accounts are added to your recovery pipeline</li>
                <li>• AI scores each account (Tier 1, 2, or 3)</li>
                <li>• SMS outreach begins within 15 minutes</li>
                <li>• Voice calls begin within 2 hours</li>
                <li>• You can track progress live in Accounts & Conversations</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <NeonButton size="sm" onClick={() => setPhase('preview')}>
                <ArrowLeft className="w-3 h-3" /> Back
              </NeonButton>
              <NeonButton variant="solid" onClick={handleLaunch}>
                🚀 Import & Start AI Recovery
              </NeonButton>
            </div>
          </div>
        </div>
      )}

      {phase === 'progress' && (
        <div className="max-w-lg mx-auto animate-fade-in">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Importing {parseResult?.validCount || 0} Accounts
            </h2>

            {/* Progress bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mb-6 font-mono">{progress}% complete</p>

            <div className="space-y-2 text-xs">
              {progress > 20 && (
                <div className="flex items-center gap-2 text-status-green"><CheckCircle className="w-3 h-3" /> Risk scoring in progress...</div>
              )}
              {progress > 40 && (
                <div className="flex items-center gap-2 text-status-green"><CheckCircle className="w-3 h-3" /> {Math.floor(progress * 4)} accounts scored and tiered</div>
              )}
              {progress > 60 && (
                <div className="flex items-center gap-2 text-status-green"><CheckCircle className="w-3 h-3" /> {Math.floor(progress * 2)} SMS messages queued</div>
              )}
              {progress > 80 && (
                <div className="flex items-center gap-2 text-status-green"><CheckCircle className="w-3 h-3" /> {Math.floor(progress * 0.8)} voice calls scheduled</div>
              )}
              {progress < 100 && (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Processing...</div>
              )}
            </div>

            {progress < 100 && (
              <p className="text-[10px] text-muted-foreground mt-4">Estimated time to first outreach: 8 minutes</p>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="max-w-lg mx-auto animate-fade-in">
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-status-green/10 border border-status-green/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-status-green" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-2">Import Complete</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {parseResult?.validCount || 0} accounts imported. AI recovery is starting now.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/dashboard/accounts"><NeonButton size="sm">View Accounts <ArrowRight className="w-3 h-3" /></NeonButton></Link>
              <Link to="/dashboard/conversations"><NeonButton size="sm" variant="solid">View Conversations <ArrowRight className="w-3 h-3" /></NeonButton></Link>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
