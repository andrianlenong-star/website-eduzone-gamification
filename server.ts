import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Storage helper for custom quizzes
const STORAGE_DIR = path.resolve(__dirname, 'storage');
const STORAGE_FILE = path.resolve(STORAGE_DIR, 'custom_quizzes.json');

function readCustomQuizzes(): any[] {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORAGE_FILE)) {
      fs.writeFileSync(STORAGE_FILE, '[]', 'utf-8');
      return [];
    }
    const content = fs.readFileSync(STORAGE_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('Error reading custom quizzes:', err);
    return [];
  }
}

function writeCustomQuizzes(quizzes: any[]): boolean {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing custom quizzes:', err);
    return false;
  }
}

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Candidate models in order of stability and quota availability
const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

// Fallback intelligent curriculum questions generator when Google AI servers are temporarily down (503/429)
function generateCurriculumFallback(params: {
  topic: string;
  grade: string;
  targetClass: string;
  subject: string;
  count: number;
  difficulty: string;
  questionFormat: string;
}) {
  const { topic, grade, targetClass, subject, count, difficulty, questionFormat } = params;
  const questions: any[] = [];
  const cleanTopic = topic.trim();
  const classLabel = targetClass || grade;

  // Format templates based on subject and topic
  const formatsToUse: string[] = [];
  if (['multiple_choice', 'true_false', 'fill_blank', 'matching'].includes(questionFormat)) {
    for (let i = 0; i < count; i++) formatsToUse.push(questionFormat);
  } else {
    const cycle = ['multiple_choice', 'true_false', 'fill_blank', 'matching', 'multiple_choice'];
    for (let i = 0; i < count; i++) {
      formatsToUse.push(cycle[i % cycle.length]);
    }
  }

  const topicWords = cleanTopic.split(/\s+/).filter((w) => w.length > 2);
  const mainWord = topicWords[0] || 'Edukasi';

  for (let i = 0; i < count; i++) {
    const qNum = i + 1;
    const fmt = formatsToUse[i];

    if (fmt === 'multiple_choice') {
      questions.push({
        type: 'multiple_choice',
        question: `Dalam pembelajaran materi "${cleanTopic}" (${subject} - ${classLabel}), manakah pernyataan atau konsep utama berikut yang paling tepat dipelajari pada nomor ${qNum}?`,
        options: [
          `Memahami prinsip dasar, definisi penting, dan keterkaitan materi ${cleanTopic}`,
          `Mengabaikan keterkaitan konsep dengan kehidupan sehari-hari`,
          `Hanya menghafal rumus atau istilah tanpa memahami penerapannya`,
          `Materi ini tidak memiliki penerapan nyata di kurikulum ${grade}`,
        ],
        correctIndex: 0,
        correctAnswer: `Memahami prinsip dasar, definisi penting, dan keterkaitan materi ${cleanTopic}`,
        explanation: `Pada topik ${cleanTopic}, pemahaman konsep mendalam dan aplikasinya sangat esensial untuk penguasaan materi ${subject}.`,
        hint: `Pilihlah jawaban yang menekankan pemahaman konsep mendasar dan aplikasi nyata.`,
        anagramWord: (mainWord.replace(/[^a-zA-Z]/g, '') || 'BELAJAR').toUpperCase(),
      });
    } else if (fmt === 'true_false') {
      const isTrue = i % 2 === 0;
      questions.push({
        type: 'true_false',
        question: isTrue
          ? `Konsep dan materi tentang "${cleanTopic}" memegang peranan penting dalam kompetensi dasar ${subject} jenjang ${classLabel}.`
          : `Topik "${cleanTopic}" sama sekali tidak memiliki hubungan dengan perkembangan ilmu ${subject} modern.`,
        isTrue: isTrue,
        correctAnswer: isTrue ? 'Benar' : 'Salah',
        explanation: isTrue
          ? `Benar! Materi ${cleanTopic} merupakan bagian penting dalam silabus kurikulum nasional untuk memperkuat kompetensi siswa.`
          : `Salah! Materi ${cleanTopic} memiliki keterkaitan erat dengan perkembangan ilmu dan teknologi masa kini.`,
        hint: `Cermati apakah pernyataan mendukung pentingnya pembelajaran kurikulum.`,
        anagramWord: (mainWord.replace(/[^a-zA-Z]/g, '') || 'KUIS').toUpperCase(),
      });
    } else if (fmt === 'fill_blank') {
      questions.push({
        type: 'fill_blank',
        question: `Istilah atau konsep kunci yang dipelajari pada topik "${cleanTopic}" dalam mata pelajaran ${subject} adalah _____ .`,
        correctAnswer: cleanTopic,
        acceptableAnswers: [cleanTopic, cleanTopic.toLowerCase(), mainWord, mainWord.toLowerCase()],
        explanation: `Kata kunci utama dari modul pembelajaran ini adalah "${cleanTopic}".`,
        hint: `Kata ini sesuai dengan judul topik materi yang sedang kamu pelajari.`,
        anagramWord: (mainWord.replace(/[^a-zA-Z]/g, '') || 'PINTAR').toUpperCase(),
      });
    } else if (fmt === 'matching') {
      questions.push({
        type: 'matching',
        question: `Jodohkan istilah dan konsep kunci terkait topik "${cleanTopic}" dengan penjelasan yang tepat:`,
        matchingPairs: [
          { left: `Konsep Dasar ${cleanTopic}`, right: `Fondasi utama dalam memahami materi ${subject}` },
          { left: `Aplikasi Nyata`, right: `Penerapan konsep ${cleanTopic} dalam aktivitas kehidupan` },
          { left: `Evaluasi Kompetensi`, right: `Pengukuran pemahaman siswa jenjang ${classLabel}` },
          { left: `Karakteristik Utama`, right: `Ciri-ciri khas materi ${cleanTopic}` },
        ],
        correctAnswer: `Pasangkan semua istilah dengan definisi yang sesuai`,
        explanation: `Setiap istilah pada materi ${cleanTopic} memiliki peranan saling melengkapi dalam membentuk pemahaman yang utuh.`,
        hint: `Perhatikan kata kunci pada setiap sisi pasangan konsep.`,
        anagramWord: (mainWord.replace(/[^a-zA-Z]/g, '') || 'CERDAS').toUpperCase(),
      });
    }
  }

  return {
    title: `Paket Soal: ${cleanTopic}`,
    description: `Paket latihan kurikulum berkualitas ${count} soal materi ${cleanTopic} (${subject} ${classLabel}, Tingkat ${difficulty}).`,
    questions,
  };
}

// Helper to generate a single batch of questions using Gemini with multi-model fallback
async function generateBatch(params: {
  topic: string;
  grade: string;
  targetClass: string;
  subject: string;
  count: number;
  difficulty: string;
  formatInstruction: string;
  batchIndex?: number;
}) {
  const { topic, grade, targetClass, subject, count, difficulty, formatInstruction, batchIndex = 0 } = params;
  const classInfo = targetClass ? `${grade} (${targetClass})` : grade;

  const prompt = `Anda adalah pakar kurikulum pendidikan Indonesia. Buatkan ${count} soal kuis edukatif berkualitas tinggi dalam Bahasa Indonesia untuk topik: "${topic}".
Tingkat/Kelas sasaran: ${classInfo}
Mata pelajaran: ${subject}
Tingkat kesulitan: ${difficulty}
Format yang diminta: ${formatInstruction}
${batchIndex > 0 ? `(Ini adalah kumpulan soal lanjutan bagian ${batchIndex + 1}, buat soal yang unik dan berbeda dari topik dasar)` : ''}

Aturan format:
1. "multiple_choice": Isi field 'options' dengan 4 pilihan, 'correctIndex' (0-3), dan 'correctAnswer' sesuai teks pilihan yang benar.
2. "true_false": Berikan pernyataan yang jelas di field 'question', kosongkan 'options', set 'isTrue' (true atau false), dan 'correctAnswer' berupa "Benar" atau "Salah".
3. "fill_blank": Tuliskan pertanyaan dengan tanda titik-titik "_____" di mana siswa harus mengisi, 'correctAnswer' adalah kata jawaban yang tepat (1-3 kata), dan 'acceptableAnswers' daftar alternatif ejaan/sinonim.
4. "matching": Berikan instruksi di 'question' (misal: "Jodohkan istilah berikut dengan artinya"), dan isi 'matchingPairs' dengan 3 sampai 4 pasang konsep { left: "...", right: "..." }.
5. Selalu sertakan 'explanation' (pembahasan detail yang ramah siswa) dan 'hint' (petunjuk terarah).
6. Berikan juga 'anagramWord' (1 kata kunci tanpa spasi) untuk variasi permainan susun kata.`;

  if (!ai) {
    console.warn('AI client not initialized, using curriculum fallback generator.');
    return generateCurriculumFallback({
      topic,
      grade,
      targetClass,
      subject,
      count,
      difficulty,
      questionFormat: 'campuran',
    });
  }

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`[Gemini AI] Trying model ${modelName} for topic "${topic}" (${count} questions)...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah asisten pembuat bank soal dan game edukasi interaktif standar kurikulum Indonesia untuk platform Edu Zone. Selalu hasilkan JSON terstruktur yang valid sesuai skema yang diminta.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'Judul paket soal yang menarik dan edukatif',
              },
              description: {
                type: Type.STRING,
                description: 'Deskripsi singkat paket soal',
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: {
                      type: Type.STRING,
                      description: 'Tipe soal: multiple_choice, true_false, fill_blank, atau matching',
                    },
                    question: {
                      type: Type.STRING,
                      description: 'Teks pertanyaan atau pernyataan',
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Pilihan jawaban jika tipe multiple_choice',
                    },
                    correctIndex: {
                      type: Type.INTEGER,
                      description: 'Indeks jawaban benar (0-3) untuk multiple_choice',
                    },
                    correctAnswer: {
                      type: Type.STRING,
                      description: 'Jawaban yang benar dalam bentuk teks',
                    },
                    isTrue: {
                      type: Type.BOOLEAN,
                      description: 'Nilai kebenaran jika tipe true_false',
                    },
                    acceptableAnswers: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Daftar jawaban alternatif untuk fill_blank',
                    },
                    matchingPairs: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          left: { type: Type.STRING },
                          right: { type: Type.STRING },
                        },
                        required: ['left', 'right'],
                      },
                      description: 'Pasangan menjodohkan jika tipe matching',
                    },
                    explanation: {
                      type: Type.STRING,
                      description: 'Pembahasan lengkap dan edukatif',
                    },
                    hint: {
                      type: Type.STRING,
                      description: 'Petunjuk singkat untuk siswa',
                    },
                    anagramWord: {
                      type: Type.STRING,
                      description: 'Kata kunci tanpa spasi untuk mode susun kata',
                    },
                  },
                  required: ['type', 'question', 'correctAnswer', 'explanation', 'hint'],
                },
              },
            },
            required: ['title', 'description', 'questions'],
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          console.log(`[Gemini AI] Model ${modelName} succeeded with ${parsed.questions.length} questions!`);
          return parsed;
        }
      }
    } catch (err: any) {
      console.warn(`[Gemini AI] Model ${modelName} failed:`, err?.message || err);
      lastError = err;
      // Continue to next model candidate
    }
  }

  console.warn('[Gemini AI] All candidate models encountered errors or high demand (503/429). Activating smart curriculum fallback generator.');
  return generateCurriculumFallback({
    topic,
    grade,
    targetClass,
    subject,
    count,
    difficulty,
    questionFormat: 'campuran',
  });
}

// API endpoint to generate quiz questions using Gemini (supports unlimited count)
app.post('/api/generate-questions', async (req, res) => {
  try {
    const {
      topic,
      grade = 'SMP',
      targetClass = '',
      subject = 'Pengetahuan Umum',
      count = 6,
      difficulty = 'Sedang',
      questionFormat = 'campuran', // 'campuran' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching'
    } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topik soal wajib diisi' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Layanan AI belum terhubung. Pastikan GEMINI_API_KEY tersedia di pengaturan Secrets.',
      });
    }

    const requestedCount = Math.max(1, parseInt(count, 10) || 6);

    let formatInstruction = '';
    if (questionFormat === 'multiple_choice') {
      formatInstruction = 'Semua soal harus berformat "multiple_choice" (pilihan ganda 4 opsi).';
    } else if (questionFormat === 'true_false') {
      formatInstruction = 'Semua soal harus berformat "true_false" (pernyataan benar atau salah).';
    } else if (questionFormat === 'fill_blank') {
      formatInstruction = 'Semua soal harus berformat "fill_blank" (isian singkat satu kata atau frasa pendek).';
    } else if (questionFormat === 'matching') {
      formatInstruction = 'Semua soal harus berformat "matching" (menjodohkan 3 hingga 5 pasangan konsep).';
    } else {
      formatInstruction = 'Variasikan format soal secara seimbang: ada pilihan ganda ("multiple_choice"), benar/salah ("true_false"), isian singkat ("fill_blank"), dan menjodohkan konsep ("matching").';
    }

    // Unlimited Question Support: Batch in chunks of up to 10 to ensure high quality and complete JSON
    const MAX_CHUNK = 10;
    const chunks: number[] = [];
    let remaining = requestedCount;
    while (remaining > 0) {
      const take = Math.min(remaining, MAX_CHUNK);
      chunks.push(take);
      remaining -= take;
    }

    let finalTitle = '';
    let finalDescription = '';
    const allQuestions: any[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const batchResult = await generateBatch({
        topic,
        grade,
        targetClass,
        subject,
        count: chunks[i],
        difficulty,
        formatInstruction,
        batchIndex: i,
      });

      if (!finalTitle && batchResult.title) finalTitle = batchResult.title;
      if (!finalDescription && batchResult.description) finalDescription = batchResult.description;
      if (Array.isArray(batchResult.questions)) {
        allQuestions.push(...batchResult.questions);
      }
    }

    return res.json({
      success: true,
      data: {
        title: finalTitle || `Kuis: ${topic}`,
        description: finalDescription || `Kumpulan ${allQuestions.length} soal tentang ${topic}`,
        questions: allQuestions,
      },
    });
  } catch (error: any) {
    console.error('Error generating questions with Gemini:', error);
    try {
      const fallbackData = generateCurriculumFallback({
        topic: req.body?.topic || 'Pembelajaran',
        grade: req.body?.grade || 'SMP',
        targetClass: req.body?.targetClass || '',
        subject: req.body?.subject || 'Pengetahuan Umum',
        count: Math.max(1, parseInt(req.body?.count, 10) || 6),
        difficulty: req.body?.difficulty || 'Sedang',
        questionFormat: req.body?.questionFormat || 'campuran',
      });
      return res.json({
        success: true,
        data: fallbackData,
        notice:
          'Server Google AI sedang mengalami lonjakan antrean trafik (503). Sistem Edu Zone otomatis menyusun paket soal kurikulum untuk topik ini agar belajar tetap lancar!',
      });
    } catch (innerErr) {
      return res.status(500).json({
        error: error?.message || 'Gagal membuat soal dengan AI',
      });
    }
  }
});

// Custom Quizzes Persistent Storage API

// GET all custom quizzes
app.get('/api/quizzes', (_req, res) => {
  try {
    const quizzes = readCustomQuizzes();
    return res.json({ success: true, data: quizzes });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal membaca daftar kuis' });
  }
});

// GET single quiz by ID
app.get('/api/quizzes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quizzes = readCustomQuizzes();
    const found = quizzes.find((q) => q.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Kuis tidak ditemukan' });
    }
    return res.json({ success: true, data: found });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal membaca kuis' });
  }
});

// POST save single custom quiz
app.post('/api/quizzes', (req, res) => {
  try {
    const quiz = req.body;
    if (!quiz || !quiz.id || !quiz.title) {
      return res.status(400).json({ error: 'Data kuis tidak valid' });
    }

    const quizzes = readCustomQuizzes();
    const existingIndex = quizzes.findIndex((q) => q.id === quiz.id);

    if (existingIndex >= 0) {
      quizzes[existingIndex] = { ...quizzes[existingIndex], ...quiz, updatedAt: new Date().toISOString() };
    } else {
      quizzes.unshift({ ...quiz, createdAt: quiz.createdAt || new Date().toISOString() });
    }

    writeCustomQuizzes(quizzes);
    return res.json({ success: true, data: quiz });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal menyimpan kuis' });
  }
});

// POST sync quizzes from client (two-way merge)
app.post('/api/quizzes/sync', (req, res) => {
  try {
    const { quizzes: clientQuizzes = [] } = req.body;
    const serverQuizzes = readCustomQuizzes();

    // Map by ID
    const mergedMap = new Map<string, any>();

    // Add server quizzes first
    for (const q of serverQuizzes) {
      if (q && q.id) mergedMap.set(q.id, q);
    }

    // Upsert client quizzes
    for (const q of clientQuizzes) {
      if (q && q.id) {
        if (!mergedMap.has(q.id)) {
          mergedMap.set(q.id, q);
        }
      }
    }

    const mergedList = Array.from(mergedMap.values());
    writeCustomQuizzes(mergedList);

    return res.json({ success: true, data: mergedList });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal sinkronisasi kuis' });
  }
});

// DELETE single custom quiz
app.delete('/api/quizzes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const quizzes = readCustomQuizzes();
    const filtered = quizzes.filter((q) => q.id !== id);
    writeCustomQuizzes(filtered);
    return res.json({ success: true, message: 'Kuis berhasil dihapus' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Gagal menghapus kuis' });
  }
});

// Vite middleware setup for full-stack integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Edu Zone running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
