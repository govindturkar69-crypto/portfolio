export type StackGroup = {
  id: string;
  title: string;
  summary: string;
  tools: string[];
  /** Project slugs that prove this group in production code. */
  evidence: string[];
  span: 'wide' | 'base';
};

export const stackGroups: StackGroup[] = [
  {
    id: 'systems',
    title: 'Systems',
    summary: 'Storage engines, indexing, concurrency control and crash recovery.',
    tools: ['Rust', 'B+Trees', 'WAL / ARIES', 'Strict 2PL', 'Fuzzing'],
    evidence: ['scratchdb'],
    span: 'wide',
  },
  {
    id: 'backend',
    title: 'Backend & APIs',
    summary: 'Typed REST services, auth, real-time channels and provider integrations.',
    tools: ['Node.js', 'Express', 'FastAPI', 'Flask', 'WebSockets', 'JWT / OAuth'],
    evidence: ['nexuscode', 'aurora-weather', 'talentai'],
    span: 'base',
  },
  {
    id: 'frontend',
    title: 'Frontend',
    summary: 'Accessible, responsive product interfaces.',
    tools: ['TypeScript', 'React 19', 'Next.js', 'Vite', 'Tailwind CSS'],
    evidence: ['nexuscode', 'realtyiq'],
    span: 'base',
  },
  {
    id: 'ai',
    title: 'Applied AI',
    summary: 'Retrieval, grounded generation and interpretable models inside real products.',
    tools: ['RAG', 'sentence-transformers', 'scikit-learn', 'XGBoost', 'SHAP', 'Gemini', 'Ollama'],
    evidence: ['veridoc', 'realtyiq', 'talentai'],
    span: 'wide',
  },
  {
    id: 'data',
    title: 'Data',
    summary: 'Relational and document modelling, caching.',
    tools: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
    evidence: ['nexuscode', 'realtyiq', 'aurora-weather'],
    span: 'base',
  },
  {
    id: 'delivery',
    title: 'Delivery',
    summary: 'Containers and production deploys.',
    tools: ['Docker', 'Vercel', 'Render', 'Cloudflare Workers'],
    evidence: ['nexuscode', 'talentai'],
    span: 'base',
  },
];

export const alsoUsed = ['Python', 'Java 21', 'PyTorch', 'SQL'];
