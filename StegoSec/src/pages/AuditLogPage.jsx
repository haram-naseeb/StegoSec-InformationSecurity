import React, { useState, useRef } from 'react';
import { useAudit } from '../contexts/AuditContext';
import { extractWatermark } from '../utils/steganography';
import { Terminal, Shield, AlertTriangle, CheckCircle, Search, UploadCloud, UserX, FileSearch } from 'lucide-react';

export default function AuditLogPage() {
  const { logs } = useAudit();
  const [tab, setTab] = useState('logs'); // 'logs' | 'forensics'
  
  // Forensic state
  const [leakResult, setLeakResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef(null);

  const fmt = ts => new Date(ts).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const handleForensicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAnalyzing(true);
    setLeakResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const result = extractWatermark(img);
        setTimeout(() => {
          setLeakResult(result);
          setAnalyzing(false);
        }, 800); // Simulate processing
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="flex items-center gap-3 m-0" style={{ fontSize: '1.25rem', letterSpacing: '0.08em' }}>
          <Shield size={26} color="var(--primary)" />
          ADMIN INTELLIGENCE CONSOLE
        </h1>
        <div className="flex gap-2">
          <button 
            className={`btn btn-sm ${tab === 'logs' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('logs')}
          >
            <Terminal size={14} className="mr-1" /> AUDIT
          </button>
          <button 
            className={`btn btn-sm ${tab === 'forensics' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('forensics')}
          >
            <Search size={14} className="mr-1" /> LEAK DETECTOR
          </button>
        </div>
      </div>

      {tab === 'logs' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="p-4 border-b bg-surface flex justify-between items-center">
             <span className="text-xs uppercase tracking-widest text-primary font-bold">System Event Stream</span>
             <span className="text-xs text-muted mono">{logs.length} Total Events</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Agent</th>
                  <th>Event</th>
                  <th>Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted" style={{ padding: '3rem' }}>
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={log.id ?? i} className={log.success ? '' : 'row-error'}>
                      <td className="mono text-xs text-muted">{fmt(log.timestamp)}</td>
                      <td className="mono text-xs text-primary">{log.userId}</td>
                      <td className="mono text-xs" style={{ color: 'var(--text)' }}>{log.action}</td>
                      <td className="text-xs text-muted" style={{ maxWidth: 300 }}>{log.details}</td>
                      <td>
                        {log.success
                          ? <span className="badge badge-success flex items-center gap-1" style={{ display: 'inline-flex' }}>
                              <CheckCircle size={11} /> OK
                            </span>
                          : <span className="badge badge-error flex items-center gap-1" style={{ display: 'inline-flex' }}>
                              <AlertTriangle size={11} /> FAIL
                            </span>
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'forensics' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card">
            <h3 className="text-primary text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileSearch size={18} /> Forensic Evidence Upload
            </h3>
            <p className="text-muted text-sm mb-6">
              Upload an intercepted image to extract hidden forensic watermarks. This will reveal the 
              identity of the agent who captured the frame and the exact time of capture.
            </p>

            <input 
              type="file" 
              ref={fileRef} 
              onChange={handleForensicUpload} 
              accept="image/png" 
              style={{ display: 'none' }} 
            />
            
            <div 
              className="file-upload-area"
              onClick={() => fileRef.current.click()}
              style={{ borderStyle: 'dashed', height: 200 }}
            >
              <UploadCloud size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <p className="text-primary font-bold">DRAG OR CLICK TO ANALYZE EVIDENCE</p>
              <p className="text-muted text-xs mt-2">PNG Format only · Max 5MB</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="glass-card flex-1">
              <h3 className="text-primary text-sm uppercase tracking-widest mb-4">Investigation Results</h3>
              
              {analyzing && (
                <div className="flex flex-col items-center justify-center h-full py-10">
                  <div className="spinner mb-4"></div>
                  <p className="text-muted text-sm mono">Scanning LSB layers for watermarks...</p>
                </div>
              )}

              {!analyzing && leakResult && (
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="alert alert-error flex items-start gap-3">
                    <UserX size={24} />
                    <div>
                      <div className="font-bold uppercase tracking-widest text-xs">Leaker Identified</div>
                      <div className="text-sm mt-1">Hidden forensic tracer was successfully extracted from the pixel data.</div>
                    </div>
                  </div>

                  <div className="surface p-4 rounded mono text-sm">
                    <div className="text-muted mb-2">// Forensic Payload</div>
                    <div className="text-primary break-all">{leakResult}</div>
                  </div>

                  <div className="text-xs text-muted">
                    This evidence is cryptographically linked to the agent's session and can be used for disciplinary action.
                  </div>
                </div>
              )}

              {!analyzing && leakResult === null && (
                <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30">
                  <Search size={48} className="mb-3" />
                  <p className="text-muted text-sm">No evidence analyzed.<br/>Upload an image to start investigation.</p>
                </div>
              )}

              {!analyzing && leakResult === "" && (
                <div className="alert alert-success flex items-start gap-3">
                  <CheckCircle size={24} />
                  <div>
                    <div className="font-bold uppercase tracking-widest text-xs">No Tracer Found</div>
                    <div className="text-sm mt-1">This image does not contain any StegoSec forensic watermarks.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
