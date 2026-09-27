import React, { useState } from 'react';
import { QuizSet } from '../../types';
import { decodeQuizFromCode, downloadAllQuizzesJson, syncCustomQuizzesToServer } from '../../utils/shareQuiz';
import { sounds } from '../../utils/audio';
import {
  X,
  Upload,
  Download,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  customQuizzes: QuizSet[];
  onImportQuiz: (quiz: QuizSet) => void;
  onImportMultiple: (quizzes: QuizSet[]) => void;
  onClose: () => void;
}

export const ImportExportModal: React.FC<Props> = ({
  customQuizzes,
  onImportQuiz,
  onImportMultiple,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'import' | 'export'>('sync');
  const [importInput, setImportInput] = useState('');
  const [importStatus, setImportStatus] = useState<{ success?: string; error?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Sync with server
  const handleSyncServer = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    sounds.playClick();
    try {
      const merged = await syncCustomQuizzesToServer(customQuizzes);
      onImportMultiple(merged);
      sounds.playSuccess();
      setSyncStatus(`Berhasil menyinkronkan ${merged.length} paket kuis dengan server! Sekarang kuis Anda akan otomatis tersedia di link Publish dan perangkat lain.`);
    } catch {
      sounds.playError();
      setSyncStatus('Gagal menyinkronkan ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Import from text input
  const handleProcessImport = () => {
    setImportStatus(null);
    const trimmed = importInput.trim();
    if (!trimmed) {
      setImportStatus({ error: 'Silakan tempel kode kuis atau format JSON terlebih dahulu' });
      return;
    }

    try {
      // Check if it's multiple quizzes array
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr) && arr.length > 0) {
          onImportMultiple(arr);
          sounds.playSuccess();
          setImportStatus({ success: `Berhasil mengimpor ${arr.length} paket kuis sekaligus!` });
          setImportInput('');
          return;
        }
      }

      // Check single quiz
      const single = decodeQuizFromCode(trimmed);
      if (single) {
        onImportQuiz(single);
        sounds.playSuccess();
        setImportStatus({ success: `Berhasil mengimpor kuis: "${single.title}"!` });
        setImportInput('');
        return;
      }

      setImportStatus({ error: 'Format kode atau JSON tidak dikenali sebagai paket soal Edu Zone yang valid.' });
      sounds.playError();
    } catch (err: any) {
      setImportStatus({ error: `Gagal membaca format: ${err?.message || 'Data tidak valid'}` });
      sounds.playError();
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyBackupCode = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(customQuizzes, null, 2));
      setCopiedBackup(true);
      sounds.playSuccess();
      setTimeout(() => setCopiedBackup(false), 2000);
    } catch {
      //
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">
              Manajemen Penyimpanan & Portabilitas
            </span>
            <h3 className="text-xl md:text-2xl font-black text-white mt-1">
              Sinkronisasi & Impor/Ekspor Kuis
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sync'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Sinkronisasi Publish ({customQuizzes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Impor Kuis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Ekspor & Cadangkan</span>
          </button>
        </div>

        {/* TAB 1: SYNC TO SERVER / PUBLISH EXPLANATION */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Mengapa Kuis Tidak Otomatis Muncul di Link Publish?</span>
              </div>
              <p className="leading-relaxed">
                Di lingkungan aplikasi web, data kuis yang baru saja dibuat di mode editor tersimpan di memori browser lokal (*Local Storage*) pada alamat Dev. Ketika Anda menyalin atau membuka alamat <strong>Publish</strong>, browser menganggapnya sebagai domain berbeda (*cross-origin*) sehingga memori lokalnya terpisah.
              </p>
              <p className="leading-relaxed text-amber-100 font-semibold">
                Solusinya: Klik tombol di bawah untuk menyinkronkan kuis buatan Anda ke server permanen agar otomatis terbaca di link Publish, atau bagikan langsung menggunakan tombol <strong>"Bagikan Game"</strong> di setiap kartu kuis!
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {customQuizzes.length} Kuis Buatan Sendiri Tersimpan
                  </h4>
                  <p className="text-xs text-slate-400">
                    Siap disinkronkan ke server untuk link Publish & siswa.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncServer}
                disabled={isSyncing}
                className="btn-3d px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Server'}</span>
              </button>
            </div>

            {syncStatus && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{syncStatus}</span>
              </div>
            )}

            {customQuizzes.length > 0 && (
              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold text-slate-300">Daftar Kuis Buatan Anda:</h5>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {customQuizzes.map((q) => (
                    <div
                      key={q.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-white truncate max-w-xs">{q.title}</span>
                      <span className="text-indigo-400 font-bold shrink-0">{q.questions.length} Soal</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IMPORT QUIZ */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Punya file cadangan kuis atau kode kuis dari perangkat lain? Tempel kodenya di bawah ini atau unggah berkas <code>.json</code> untuk langsung memasukannya ke Bank Soal Anda.
            </p>

            <div className="flex items-center gap-3">
              <label className="btn-3d px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer border border-slate-700">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Pilih Berkas JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-500">atau tempel kode langsung di bawah:</span>
            </div>

            <textarea
              rows={5}
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              placeholder="Tempel kode share kuis atau teks format JSON di sini..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
            />

            {importStatus?.error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                {importStatus.error}
              </div>
            )}
            {importStatus?.success && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs">
                {importStatus.success}
              </div>
            )}

            <button
              type="button"
              onClick={handleProcessImport}
              className="btn-3d w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Impor & Masukkan ke Bank Soal</span>
            </button>
          </div>
        )}

        {/* TAB 3: EXPORT & BACKUP */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Unduh semua kuis buatan Anda ke komputer/HP sebagai berkas cadangan (*backup*). File ini dapat diimpor kembali kapan saja jika berganti perangkat atau browser.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => downloadAllQuizzesJson(customQuizzes)}
                disabled={customQuizzes.length === 0}
                className="btn-3d p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 hover:border-indigo-400 text-left cursor-pointer group disabled:opacity-50"
              >
                <Download className="w-6 h-6 text-sky-400 mb-2" />
                <h4 className="font-bold text-white text-sm">Unduh File Cadangan JSON</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Menyimpan {customQuizzes.length} paket kuis ke dalam 1 berkas aman.
                </p>
              </button>

              <button
                type="button"
                onClick={handleCopyBackupCode}
                disabled={customQuizzes.length === 0}
                className="btn-3d p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left cursor-pointer group disabled:opacity-50"
              >
                {copiedBackup ? (
                  <Check className="w-6 h-6 text-emerald-400 mb-2" />
                ) : (
                  <Copy className="w-6 h-6 text-amber-400 mb-2" />
                )}
                <h4 className="font-bold text-white text-sm">
                  {copiedBackup ? 'Kode Cadangan Tersalin!' : 'Salin Semua Data (JSON)'}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Salin seluruh isi kuis ke papan klip untuk dipindahkan.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
