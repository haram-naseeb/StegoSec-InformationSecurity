import React, { useState, useRef, useEffect } from 'react';
import { useAuth }   from '../contexts/AuthContext';
import { useAudit }  from '../contexts/AuditContext';
import { injectWatermark, extractWatermark } from '../utils/steganography';
import NetworkVisualizer from '../components/NetworkVisualizer';
import { Camera, ShieldAlert, Cpu, Terminal, Key, Network, Download, RotateCcw, Info } from 'lucide-react';

// ── Math display ─────────────────────────────────────────────────────────────
function AESMathPanel() {
  return (
    <div className="surface p-4 rounded mono" style={{ fontSize: '0.8rem', lineHeight: 2.2 }}>
      <div className="text-primary mb-2 uppercase tracking-widest text-xs">AES-256 Brute-Force Mathematics</div>
      <div className="text-muted">Key-space size:          <span className="text-primary">2²⁵⁶ ≈ 1.16 × 10⁷⁷</span></div>
      <div className="text-muted">Fastest supercomputer:   <span style={{ color: '#00ccff' }}>10¹⁵ keys/sec</span></div>
      <div className="text-muted">Time to crack (avg):     <span className="text-accent">≈ 3.3 × 10⁵⁶ years</span></div>
      <div className="text-muted">Age of universe:         <span style={{ color: '#555' }}>1.38 × 10¹⁰ years</span></div>
      <div style={{ marginTop: '0.5rem', color: '#333' }}>──────────────────────────────────────</div>
      <div style={{ color: 'var(--primary)', marginTop: '0.25rem' }}>
        Conclusion: <span className="text-primary">Computationally infeasible. Period.</span>
      </div>
    </div>
  );
}

export default function AttackSimulatorPage() {
  const { user }     = useAuth();
  const { logEvent } = useAudit();

  const [tab, setTab] = useState('capture'); // 'capture' | 'breaker' | 'network'

  // ── Covert Capture ────────────────────────────────────────────────────────
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const [cameraOn,    setCameraOn]    = useState(false);
  const [captured,    setCaptured]    = useState(null);  // dataURL
  const [watermarked, setWatermarked] = useState(false);
  const [watermarkInfo, setWatermarkInfo] = useState('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraOn(true);
      logEvent('ATTACK-SIM', 'Webcam activated (covert capture demo)', true, user.id);
      
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
    } catch (e) {
      alert('Camera access denied: ' + e.message);
      logEvent('ATTACK-SIM', 'Camera access failed: ' + e.message, false, user.id);
    }
  };

  const stopCamera = () => {
    const s = videoRef.current?.srcObject;
    if (s) s.getTracks().forEach(t => t.stop());
    setCameraOn(false);
  };

  const captureFrame = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width  = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    setCaptured(c.toDataURL('image/png'));
    setWatermarked(false);
    setWatermarkInfo('');
    stopCamera();
    logEvent('ATTACK-SIM', 'Frame captured for watermarking demo', true, user.id);
  };

  const doInjectWatermark = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const dataUrl = injectWatermark(img, user.id);
        setCaptured(dataUrl);
        setWatermarked(true);
        // Immediately verify
        const verify = new Image();
        verify.onload = () => {
          const wm = extractWatermark(verify);
          setWatermarkInfo(wm || 'Watermark embedded but cannot verify in this session.');
        };
        verify.src = dataUrl;
        logEvent('STEGO', `Forensic watermark injected for ${user.id}`, true, user.id);
      } catch (e) { alert('Watermark failed: ' + e.message); }
    };
    img.src = captured;
  };

  const downloadCapture = () => {
    if (!captured) return;
    const a = document.createElement('a');
    a.href = captured;
    a.download = `stegosec_capture_${Date.now()}.png`;
    a.click();
  };

  const resetCapture = () => { setCaptured(null); setWatermarked(false); setWatermarkInfo(''); };

  // ── Key Breaker ───────────────────────────────────────────────────────────
  const [target,    setTarget]    = useState(null);
  const [cracking,  setCracking]  = useState(false);
  const [attempts,  setAttempts]  = useState(0);
  const [status,    setStatus]    = useState('IDLE');
  const intervalRef = useRef(null);

  const handleTargetUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setTarget(ev.target.result);
    reader.readAsDataURL(file);
    setAttempts(0);
    setStatus('TARGET LOADED');
  };

  const startBruteForce = () => {
    setCracking(true);
    setAttempts(0);
    setStatus('CRACKING…');
    logEvent('ATTACK-SIM', 'Simulated brute-force attack initiated', false, 'ATTACKER');
    let total = 0;
    intervalRef.current = setInterval(() => {
      total += Math.floor(Math.random() * 2_800_000 + 1_200_000);
      setAttempts(total);
      if (total >= 60_000_000) {
        clearInterval(intervalRef.current);
        setCracking(false);
        setStatus('FAILED – KEY NOT FOUND');
        logEvent('ATTACK-SIM', 'Brute-force failed – AES-256 held', true, 'SYSTEM');
      }
    }, 60);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const apsDisplay = cracking
    ? `~${(Math.round(attempts / 1e6 / 3) || 1)}M keys/sec`
    : '—';

  const tabs = [
    { id: 'capture', label: 'COVERT CAPTURE' },
    { id: 'breaker', label: 'KEY BREAKER' },
    { id: 'network', label: 'NET INTERCEPT' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="flex items-center gap-3 m-0" style={{ fontSize: '1.25rem', letterSpacing: '0.08em' }}>
          <ShieldAlert size={26} color="var(--accent)" />
          <span style={{ color: 'var(--text)' }}>ATTACK SIMULATOR</span>
        </h1>
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Covert Capture Tab ── */}
      {tab === 'capture' && (
        <div className="glass-card">
          <div className="flex items-start gap-2 mb-1">
            <Camera size={20} color="var(--primary)" />
            <h2 className="m-0 text-lg" style={{ color: 'var(--text)' }}>Covert Capture & Forensic Watermarking</h2>
          </div>
          <p className="text-muted text-sm mb-4">
            Simulates an unauthorized device capturing a photo and embedding an invisible LSB watermark
            containing the leaker's identity + timestamp. Any leaked copy can be forensically traced.
          </p>
          <div className="alert alert-warning mb-4 text-sm">
            <Info size={15} /> <strong>Demo Disclaimer:</strong> Webcam is activated with your explicit click for demonstration purposes only.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Camera / Captured image */}
            <div>
              <div style={{
                background: '#000', border: '1px solid var(--border)', borderRadius: 8,
                aspectRatio: '4/3', overflow: 'hidden', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {!cameraOn && !captured && (
                  <div className="text-center flex flex-col items-center gap-3">
                    <Camera size={48} style={{ color: '#2a2a2a' }} />
                    <button id="btn-start-camera" className="btn btn-primary" onClick={startCamera}>
                      ACTIVATE SENSOR
                    </button>
                  </div>
                )}
                {cameraOn && (
                  <>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      id="btn-capture"
                      className="btn btn-accent"
                      style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}
                      onClick={captureFrame}
                    >
                      CAPTURE FRAME
                    </button>
                  </>
                )}
                {captured && !cameraOn && (
                  <img src={captured} alt="captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4">
              <div className="surface p-4 rounded">
                <h4 className="text-primary text-sm mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <Terminal size={14} /> Watermark Injector
                </h4>
                <p className="text-muted text-xs mb-4" style={{ lineHeight: 1.7 }}>
                  Embeds an invisible payload: <code className="mono" style={{ color: 'var(--primary)' }}>STEGWM | {user.id} | {'{timestamp}'}</code>
                </p>
                <button
                  id="btn-inject-watermark"
                  className="btn btn-primary w-full"
                  onClick={doInjectWatermark}
                  disabled={!captured || watermarked}
                >
                  {watermarked ? '✓ WATERMARK INJECTED' : 'INJECT TRACER PAYLOAD'}
                </button>
                {captured && (
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-ghost btn-sm flex-1" onClick={downloadCapture}><Download size={13} /> SAVE</button>
                    <button className="btn btn-ghost btn-sm flex-1" onClick={resetCapture}><RotateCcw size={13} /> RESET</button>
                  </div>
                )}
              </div>

              {watermarkInfo && (
                <div className="alert alert-success text-xs">
                  <strong>Forensic Read-back:</strong> <span className="mono">{watermarkInfo}</span>
                </div>
              )}

              <div className="surface p-4 rounded text-xs text-muted mono" style={{ lineHeight: 2 }}>
                <div className="text-primary mb-1">// LSB Watermark Structure</div>
                <div>"STEGWM | &lt;userId&gt; | &lt;ISO timestamp&gt;"</div>
                <div style={{ color: '#333' }}>Encoded as UTF-8 bytes</div>
                <div style={{ color: '#333' }}>Embedded in R/G/B LSBs</div>
                <div style={{ color: '#333' }}>Invisible to naked eye (PSNR &gt; 50dB)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Key Breaker Tab ── */}
      {tab === 'breaker' && (
        <div className="glass-card">
          <div className="flex items-start gap-2 mb-1">
            <Key size={20} color="var(--accent)" />
            <h2 className="m-0 text-lg" style={{ color: 'var(--text)' }}>AES-256 Key Breaker Simulation</h2>
          </div>
          <p className="text-muted text-sm mb-6">
            Upload any stego-image and simulate a brute-force attack. This simulation is designed to <strong>fail</strong> — demonstrating that AES-256 encryption is mathematically impossible to crack in any reasonable timeframe.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Target upload */}
            <div>
              {!target ? (
                <label id="target-upload-label" className="file-upload-area" style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept="image/png" style={{ display: 'none' }} onChange={handleTargetUpload} />
                  <Key size={48} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
                  <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Upload Intercepted Target</h4>
                  <p className="text-muted text-sm">PNG stego-image</p>
                </label>
              ) : (
                <div className="text-center">
                  <img src={target} alt="target" className="image-preview" style={{ borderColor: 'var(--accent)', maxHeight: 220 }} />
                  <button className="btn btn-ghost btn-sm mt-3" onClick={() => { setTarget(null); setAttempts(0); setStatus('IDLE'); }}>
                    Change Target
                  </button>
                </div>
              )}
            </div>

            {/* Attack cluster */}
            <div className="flex flex-col gap-4">
              <div className="surface p-4 rounded mono" style={{ flex: 1 }}>
                <h4 className="text-accent text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Cpu size={14} /> Attack Cluster
                </h4>
                {[
                  { label: 'Status',    value: status,                color: status === 'FAILED – KEY NOT FOUND' ? 'var(--accent)' : cracking ? 'var(--warning)' : 'var(--text-muted)' },
                  { label: 'Attempts',  value: attempts.toLocaleString(), color: 'var(--primary)' },
                  { label: 'Speed',     value: apsDisplay,            color: '#00ccff' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between border-b py-2" style={{ fontSize: '0.82rem' }}>
                    <span className="text-muted">{row.label}</span>
                    <span style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <button
                  id="btn-bruteforce"
                  className="btn btn-accent w-full mt-4"
                  onClick={startBruteForce}
                  disabled={!target || cracking}
                >
                  {cracking ? 'CRACKING…' : 'LAUNCH BRUTE-FORCE'}
                </button>
              </div>

              {status === 'FAILED – KEY NOT FOUND' && (
                <div className="alert alert-error text-sm">
                  <ShieldAlert size={15} /> Attack failed. AES-256 withstands even 10¹⁵ guesses/sec.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <AESMathPanel />
          </div>

          <div className="glass-card mt-6" style={{ background: 'rgba(0,255,65,0.02)' }}>
            <h3 className="text-primary text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
              <Info size={16} /> How the Attack Simulator Works
            </h3>
            <div className="text-muted text-sm" style={{ lineHeight: 1.8 }}>
              <p className="mb-3">
                This simulator demonstrates the two primary vectors of attack against steganography: 
                <strong> Cryptographic Attacks</strong> and <strong>Forensic Tracking</strong>.
              </p>
              <ul className="flex flex-col gap-2">
                <li>
                  <strong className="text-primary">Covert Capture:</strong> Demonstrates how an adversary might use a device's own sensors to leak data. 
                  The <em>Forensic Watermarking</em> tool shows how we can fight back by embedding invisible tracking IDs into images. 
                  Even if the image is screenshotted or re-saved, the LSB-embedded ID persists, allowing us to trace the "leaker".
                </li>
                <li>
                  <strong className="text-accent">Key Breaker:</strong> Demonstrates a <em>Brute-Force Attack</em>. It attempts to decrypt the hidden payload 
                  by guessing billions of keys. Because StegoSec uses <strong>AES-256-GCM</strong>, the number of possible keys (1.16 × 10⁷⁷) 
                  is so vast that even all the computers on Earth working together for billions of years couldn't guess the right one.
                </li>
                <li>
                  <strong className="text-primary">Net Intercept:</strong> Visualizes a <em>Man-in-the-Middle (MITM)</em> attack. An adversary sniffing 
                  network traffic can see that an image is being sent, but because the payload is encrypted and hidden in the LSB, 
                  it looks like perfectly normal image noise. This provides <strong>Covert Communication</strong>.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Network Intercept Tab ── */}
      {tab === 'network' && (
        <div className="glass-card">
          <div className="flex items-start gap-2 mb-1">
            <Network size={20} color="var(--primary)" />
            <h2 className="m-0 text-lg" style={{ color: 'var(--text)' }}>Network Packet Interception</h2>
          </div>
          <p className="text-muted text-sm mb-6">
            Animated Wireshark-style demo showing what a network adversary sees when they intercept a stego-image in transit.
            Without the key, the ciphertext is statistically indistinguishable from image data.
          </p>

          <NetworkVisualizer />

          <div className="surface p-4 rounded mt-6 mono text-xs" style={{ color: '#555', lineHeight: 2.2 }}>
            <div className="text-primary mb-1">&gt; SIMULATED WIRESHARK CAPTURE — eth0 — port 443</div>
            <div><span style={{ color: '#333' }}>[HH:MM:SS.001]</span> TCP SYN → server:443</div>
            <div><span style={{ color: '#333' }}>[HH:MM:SS.050]</span> TLSv1.3 Handshake</div>
            <div><span style={{ color: '#333' }}>[HH:MM:SS.120]</span> HTTP/2 POST /api/send  (image/png · 83 KB)</div>
            <div><span style={{ color: 'var(--accent)' }}>[HH:MM:SS.200]</span> !! PACKET CAPTURED BY ADVERSARY</div>
            <div><span style={{ color: '#333' }}>[HH:MM:SS.250]</span> File-magic: PNG ✓  —  Appearance: normal photograph</div>
            <div><span style={{ color: '#333' }}>[HH:MM:SS.300]</span> LSB extract → HIGH ENTROPY (encrypted payload)</div>
            <div><span style={{ color: '#333' }}>[HH:MM:SS.400]</span> AES-256-GCM decrypt without key → AUTHENTICATION FAILED</div>
            <div><span style={{ color: 'var(--primary)' }}>[HH:MM:SS.401]</span> Adversary conclusion: standard PNG image. No actionable data found.</div>
          </div>
        </div>
      )}
    </div>
  );
}
