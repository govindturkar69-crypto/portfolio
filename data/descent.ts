export type LayerVisual = 'interface' | 'api' | 'model' | 'retrieval' | 'storage';

export type DescentLayer = {
  /** Anchor id, also used by the depth gauge. */
  id: string;
  index: number;
  name: string;
  /** One line describing what lives at this depth of the stack. */
  thesis: string;
  slug: string;
  visual: LayerVisual;
};

/** Scroll order, top of the stack to the bottom. ScratchDB is the deepest layer. */
export const descent: DescentLayer[] = [
  {
    id: 'layer-interface',
    index: 1,
    name: 'Interface',
    thesis: 'Where people meet the system. State, latency and collaboration all surface here first.',
    slug: 'nexuscode',
    visual: 'interface',
  },
  {
    id: 'layer-api',
    index: 2,
    name: 'API',
    thesis: 'One stable contract over unreliable upstreams. The UI should never know which provider answered.',
    slug: 'aurora-weather',
    visual: 'api',
  },
  {
    id: 'layer-model',
    index: 3,
    name: 'Model',
    thesis: 'A prediction is only useful when it explains itself.',
    slug: 'realtyiq',
    visual: 'model',
  },
  {
    id: 'layer-retrieval',
    index: 4,
    name: 'Retrieval',
    thesis: 'Answer from evidence — or say nothing at all.',
    slug: 'veridoc',
    visual: 'retrieval',
  },
  {
    id: 'layer-storage',
    index: 5,
    name: 'Storage',
    thesis: 'Pages, indexes, locks and a log. The layer every other layer quietly trusts.',
    slug: 'scratchdb',
    visual: 'storage',
  },
];

/** Gauge stops: surface, every layer, then bedrock (the conventional sections). */
export const gaugeStops = [
  { id: 'top', label: 'Surface' },
  ...descent.map((layer) => ({ id: layer.id, label: layer.name })),
  { id: 'index', label: 'Bedrock' },
];
