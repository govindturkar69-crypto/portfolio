export type Metric = { value: string; label: string };

export type ArchitectureLayer = { name: string; detail: string };

export type Challenge = { title: string; problem: string; solution: string };

export type Project = {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  featured: boolean;
  problem: string;
  approach: string;
  architecture: { summary: string; layers: ArchitectureLayer[] };
  challenges: Challenge[];
  metrics: Metric[];
  highlights: string[];
  stack: string[];
  links: { github: string; live?: string };
  /** Optional screenshot in /public, e.g. `/projects/scratchdb.webp` (1600×1000 recommended). */
  image?: { src: string; alt: string; width: number; height: number };
};

export const projects: Project[] = [
  {
    slug: 'scratchdb',
    name: 'ScratchDB',
    category: 'Systems · Database internals',
    tagline: 'A relational database engine in safe Rust — from page storage to crash recovery.',
    featured: true,
    problem:
      'A real relational database has to coordinate persistent storage, indexing, SQL execution, transactions, durability and crash recovery — without delegating any of those guarantees to an existing engine.',
    approach:
      'Built every layer from first principles: 4 KiB checksummed pages, a 2Q buffer pool, disk-backed B+Tree indexes, a handcrafted SQL parser and planner, Volcano-style execution, strict two-phase locking, write-ahead logging and ARIES restart recovery — plus a diagnostic studio to watch it all work.',
    architecture: {
      summary:
        'Requests flow from the SQL shell or diagnostic studio through the transaction manager, into the parser, planner and executor, down through access methods and the buffer pool to checksummed pages and the write-ahead log.',
      layers: [
        { name: 'Interface', detail: 'SQL shell and loopback diagnostic studio: workbench, buffer matrix, page inspector, B+Tree explorer, WAL stream.' },
        { name: 'Transactions', detail: 'Strict two-phase locking with wait-die deadlock prevention.' },
        { name: 'Query engine', detail: 'Handcrafted parser → typed AST → index-aware planner → Volcano operators.' },
        { name: 'Access methods', detail: 'Catalog, slotted tuple heap and persistent disk-backed B+Tree indexes.' },
        { name: 'Buffer pool', detail: 'Configurable 2Q replacement over 4 KiB pages with WAL-before-page barriers.' },
        { name: 'Durability', detail: 'CRC32C pages, checksummed WAL with group commit, ARIES analysis → redo → undo.' },
      ],
    },
    challenges: [
      {
        title: 'Durability without silent corruption',
        problem: 'If a dirty page reaches disk before the log record describing it, a crash leaves the database unrecoverable.',
        solution: 'Enforced WAL-before-page barriers in the buffer pool, checksummed every page and log record with CRC32C, and batched log flushes with group commit.',
      },
      {
        title: 'Recovering from a crash mid-transaction',
        problem: 'After an interruption, committed work must survive and in-flight work must vanish — across heaps, indexes and schema changes.',
        solution: 'Implemented ARIES restart recovery: analysis rebuilds transaction and dirty-page state, redo repeats history, undo rolls back losers.',
      },
      {
        title: 'Concurrency without deadlock',
        problem: 'Concurrent readers and writers can observe uncommitted data or wait on each other forever.',
        solution: 'Strict two-phase locking holds locks until commit; wait-die ordering by transaction age makes deadlock cycles impossible.',
      },
      {
        title: 'Surviving hostile input',
        problem: 'Malformed SQL, damaged pages or truncated log records must never crash or corrupt the engine.',
        solution: 'Added deterministic fuzzing for the parser, page format and WAL, with resource budgets for malformed input.',
      },
    ],
    metrics: [
      { value: '58/58', label: 'release-mode tests passing' },
      { value: '500K', label: 'transaction endurance runs, debug + release' },
      { value: '3', label: 'formats fuzzed: SQL, pages, WAL' },
      { value: '0', label: 'embedded third-party engines' },
    ],
    highlights: [
      'Persistent 4 KiB page storage',
      '2Q buffer pool',
      'Disk-backed B+Tree indexes',
      'Handcrafted SQL parser and planner',
      'Volcano query execution',
      'Strict 2PL transactions',
      'WAL and ARIES crash recovery',
      'Diagnostic studio and db-doctor',
    ],
    stack: ['Rust', 'Cargo', 'SQL', 'B+Tree', 'WAL / ARIES', 'SS2PL'],
    links: { github: 'https://github.com/govindturkar69-crypto/database-from-scratch' },
  },
  {
    slug: 'veridoc',
    name: 'VeriDoc',
    category: 'Applied AI · Retrieval',
    tagline: 'Citation-grounded RAG that refuses honestly instead of hallucinating.',
    featured: true,
    problem:
      'Institutional document assistants produce confident answers without evidence — or invent policy details that never appear in their sources.',
    approach:
      'A retrieval pipeline that finds official passages, gates them on relevance, answers strictly from that evidence with citations, and says "not found" when the documents do not contain the answer.',
    architecture: {
      summary:
        'Documents are ingested and embedded offline; each question is retrieved, optionally re-ranked, checked by a relevance gate and only then sent to a grounded LLM prompt.',
      layers: [
        { name: 'Ingestion', detail: 'PDF, DOCX, text and HTML via PyMuPDF, python-docx and BeautifulSoup, with Tesseract OCR.' },
        { name: 'Embedding', detail: 'Chunked content embedded with all-MiniLM-L6-v2 sentence-transformers.' },
        { name: 'Retrieval', detail: 'In-memory NumPy cosine search, optional ms-marco cross-encoder re-ranking.' },
        { name: 'Relevance gate', detail: 'Low-confidence retrievals are rejected before generation.' },
        { name: 'Generation', detail: 'Strict grounded prompt on Llama 3 via Ollama locally, or Google Gemini in the cloud.' },
        { name: 'Interface', detail: 'Streamlit chat with an expandable panel of cited source passages.' },
      ],
    },
    challenges: [
      {
        title: 'Useful answers vs. trustworthy refusals',
        problem: 'Retrieval must find real evidence, but the system has to stop rather than improvise when confidence is low.',
        solution: 'Two-layer hallucination control: a retrieval relevance gate before generation, then a strict grounded-answer prompt that must cite its passage.',
      },
      {
        title: 'Messy institutional documents',
        problem: 'Policies arrive as PDFs, Word files, web pages and scanned images.',
        solution: 'A unified ingestion module per format with OCR fallback, feeding one chunking and embedding pipeline.',
      },
      {
        title: 'Portable without heavy infrastructure',
        problem: 'A hosted vector database and a single LLM vendor would make the assistant hard to run anywhere.',
        solution: 'An in-memory NumPy vector store and switchable local (Ollama) or cloud (Gemini) generation backends.',
      },
    ],
    metrics: [
      { value: '61', label: 'real questions in the evaluation set' },
      { value: '8', label: 'unanswerable probes testing refusal' },
      { value: '2', label: 'hallucination-control layers' },
      { value: '2', label: 'LLM backends: local + cloud' },
    ],
    highlights: [
      'Semantic document search',
      'Exact source citations',
      'Honest refusal for unsupported questions',
      'OCR-assisted ingestion',
      'Optional cross-encoder re-ranking',
      'Local and cloud LLM support',
    ],
    stack: ['Python', 'sentence-transformers', 'NumPy', 'Gemini', 'Ollama', 'PyMuPDF', 'Tesseract', 'Streamlit'],
    links: {
      github: 'https://github.com/govindturkar69-crypto/VeriDoc',
      live: 'https://veridoc-9td5zj9kteg5cly2vnaz6b.streamlit.app/',
    },
  },
  {
    slug: 'nexuscode',
    name: 'NexusCode',
    category: 'Full-stack · Real-time',
    tagline: 'Planning, a browser IDE, live collaboration and AI assistance in one workspace.',
    featured: true,
    problem:
      'Development work is fragmented across planning boards, editors, chat and AI tools, so context is lost at every hand-off.',
    approach:
      'One product combining Kanban planning, a Monaco editor, WebSocket collaboration and Gemini-powered code generation and bug detection, backed by an authenticated FastAPI service.',
    architecture: {
      summary:
        'A React 19 client talks to FastAPI over REST for persisted project data and over WebSockets for live collaboration; Gemini powers assistance and PostgreSQL stores state.',
      layers: [
        { name: 'Client', detail: 'React 19 + Vite with a Monaco editor and Kanban project board.' },
        { name: 'Real-time', detail: 'WebSocket channels carry collaboration events between sessions.' },
        { name: 'API', detail: 'FastAPI services with JWT sessions and GitHub OAuth.' },
        { name: 'AI', detail: 'Gemini API for code generation and bug detection in the editor workflow.' },
        { name: 'Data', detail: 'PostgreSQL for authenticated application and project data.' },
        { name: 'Delivery', detail: 'Docker-packaged backend; deployed frontend.' },
      ],
    },
    challenges: [
      {
        title: 'One coherent workflow',
        problem: 'Editor state, live collaboration, persisted project data and external AI each have their own lifecycle.',
        solution: 'Kept persistence in authenticated REST endpoints and ephemeral collaboration events on WebSockets, so each concern has one source of truth.',
      },
      {
        title: 'Two ways to sign in',
        problem: 'Developers expect GitHub sign-in, but the product also needs first-party accounts.',
        solution: 'JWT sessions and GitHub OAuth unified behind a single FastAPI authentication layer.',
      },
      {
        title: 'AI inside the work, not beside it',
        problem: 'A separate chatbot forces copy-paste between tools.',
        solution: 'Gemini generation and bug detection surface directly in the editor workflow on the code being written.',
      },
    ],
    metrics: [
      { value: '6', label: 'persisted entities' },
      { value: '3', label: 'external integrations' },
      { value: '2', label: 'auth methods: JWT + OAuth' },
      { value: 'Live', label: 'WebSocket collaboration' },
    ],
    highlights: [
      'Project and Kanban management',
      'Monaco browser editor',
      'Real-time collaboration',
      'AI code generation',
      'AI-assisted bug detection',
      'JWT and GitHub OAuth',
    ],
    stack: ['React 19', 'Vite', 'FastAPI', 'PostgreSQL', 'WebSockets', 'Gemini API', 'Docker'],
    links: {
      github: 'https://github.com/govindturkar69-crypto/NexusCode',
      live: 'https://nexus-code-chi.vercel.app',
    },
  },
  {
    slug: 'realtyiq',
    name: 'RealtyIQ',
    category: 'Full-stack · Interpretable ML',
    tagline: 'Indian real-estate price prediction with confidence ranges and SHAP explanations.',
    featured: true,
    problem: 'Raw housing data and bare model outputs are hard for buyers to interpret or trust.',
    approach:
      'A product that pairs every estimate with a confidence range and feature-level SHAP explanation, alongside listings, trends, comparisons, a map heatmap and downloadable reports.',
    architecture: {
      summary:
        'A Next.js client uses an Express/MongoDB product API for accounts and listings, and a separate FastAPI service for model inference and explanations.',
      layers: [
        { name: 'Client', detail: 'Next.js 14 product interface: prediction, listings, trends, map, compare, reports.' },
        { name: 'Product API', detail: 'Express with JWT authentication over MongoDB.' },
        { name: 'ML service', detail: 'FastAPI serving the trained prediction pipeline.' },
        { name: 'Models', detail: 'Random Forest, Gradient Boosting and XGBoost on an Indian Kaggle dataset.' },
        { name: 'Explainability', detail: 'SHAP feature attributions for every prediction.' },
      ],
    },
    challenges: [
      {
        title: 'Decision support, not a magic number',
        problem: 'A single predicted price gives users no reason to trust it.',
        solution: 'Each estimate ships with a confidence range and SHAP attributions showing which features pushed the price up or down.',
      },
      {
        title: 'Two runtimes, one product',
        problem: 'Product logic belongs in Node; the model stack lives in Python.',
        solution: 'Separated the Express product API from a FastAPI ML service so model code evolves without touching application logic.',
      },
    ],
    metrics: [
      { value: '3', label: 'model families compared' },
      { value: '3', label: 'services: web, API, ML' },
      { value: 'SHAP', label: 'per-prediction explanations' },
      { value: 'JWT', label: 'authenticated product API' },
    ],
    highlights: [
      'Property price prediction',
      'Confidence ranges',
      'SHAP explanations',
      'Market trends and comparisons',
      'Map heatmap',
      'PDF reports',
    ],
    stack: ['Next.js 14', 'Express', 'MongoDB', 'FastAPI', 'XGBoost', 'SHAP', 'scikit-learn'],
    links: {
      github: 'https://github.com/govindturkar69-crypto/RealtyIQ',
      live: 'https://realty-iq-puce.vercel.app',
    },
  },
  {
    slug: 'aurora-weather',
    name: 'Aurora Weather',
    category: 'Full-stack · Resilience',
    tagline: 'A typed weather API with automatic provider fallback and Redis cache-aside.',
    featured: false,
    problem: 'Single-provider weather apps fail hard when the upstream goes down and expose inconsistent data shapes.',
    approach:
      'A typed Express API normalizes two live providers behind one contract, falls back automatically, and caches responses in Redis.',
    architecture: {
      summary: 'The React client calls one typed API; the API checks Redis, then the primary provider, then the fallback.',
      layers: [
        { name: 'Client', detail: 'React + Vite with Recharts forecasts, air quality, rain nowcast and saved locations.' },
        { name: 'Typed API', detail: 'Node.js/Express in TypeScript exposing one normalized contract.' },
        { name: 'Cache', detail: 'Upstash Redis cache-aside: 10-minute weather TTL, 24-hour geocoding TTL.' },
        { name: 'Providers', detail: 'Tomorrow.io primary, Open-Meteo automatic fallback.' },
      ],
    },
    challenges: [
      {
        title: 'Two providers, one contract',
        problem: 'Each provider returns a different response shape.',
        solution: 'A provider abstraction normalizes both into one typed response, so the UI never knows which upstream answered.',
      },
      {
        title: 'Upstream outages and rate limits',
        problem: 'A failed or throttled provider should not break the app.',
        solution: 'Automatic fallback to Open-Meteo plus cache-aside with separate TTLs for volatile weather and stable geocoding.',
      },
    ],
    metrics: [
      { value: '2', label: 'live providers with fallback' },
      { value: '10 min', label: 'weather cache TTL' },
      { value: '24 h', label: 'geocoding cache TTL' },
    ],
    highlights: ['Live conditions', 'Hourly and daily forecasts', 'Air quality and rain nowcast', 'Saved locations'],
    stack: ['React', 'TypeScript', 'Node.js', 'Express', 'Redis', 'Recharts'],
    links: {
      github: 'https://github.com/govindturkar69-crypto/aurora-weather',
      live: 'https://aurora-weather-six.vercel.app',
    },
  },
  {
    slug: 'talentai',
    name: 'TalentAI',
    category: 'Full-stack · Applied ML',
    tagline: 'Resume parsing, skill extraction and weighted candidate ranking for recruiters.',
    featured: false,
    problem: 'Manual resume screening is slow, and candidate-to-role comparisons are inconsistent.',
    approach:
      'A role-based hiring system that parses PDF resumes, extracts skills, scores fit with a weighted model and gives recruiters ranked candidates and analytics.',
    architecture: {
      summary: 'Flask routes serve candidate and recruiter flows; a parsing and matching pipeline scores applications stored in MySQL.',
      layers: [
        { name: 'Interface', detail: 'Jinja + Bootstrap candidate and recruiter dashboards.' },
        { name: 'Application', detail: 'Flask routes with Werkzeug sessions and role-based access.' },
        { name: 'Matching', detail: 'PyPDF2 extraction, 50+ skill vocabulary, TF-IDF similarity, weighted scoring.' },
        { name: 'Data', detail: 'MySQL on Aiven with connection pooling and indexes; Gunicorn on Render.' },
      ],
    },
    challenges: [
      {
        title: 'Consistent, explainable scoring',
        problem: 'Neither explicit skill overlap nor free-text similarity alone gives a reliable fit score.',
        solution: 'A weighted score: 70% explicit skill overlap plus 30% TF-IDF resume-to-job similarity.',
      },
      {
        title: 'Two roles, one system',
        problem: 'Candidates and recruiters need strictly separate permissions over shared data.',
        solution: 'Role-aware Werkzeug sessions and password utilities keep candidate and recruiter access distinct.',
      },
    ],
    metrics: [
      { value: '50+', label: 'skills in extraction vocabulary' },
      { value: '70/30', label: 'skill vs. similarity weighting' },
      { value: '30', label: 'Flask routes' },
      { value: '8', label: 'MySQL tables' },
    ],
    highlights: ['PDF resume parsing', 'Skill extraction', 'Candidate ranking', 'Recruitment analytics', 'Excel export'],
    stack: ['Python', 'Flask', 'MySQL', 'PyPDF2', 'scikit-learn', 'Plotly'],
    links: {
      github: 'https://github.com/govindturkar69-crypto/TalentAI-Recruitment-Platform',
      live: 'https://talentai-recruitment-platform.onrender.com',
    },
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
