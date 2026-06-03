/**
 * AI Fashion Generation — shared TypeScript types.
 * Mirrors the backend Pydantic schemas exactly so no runtime casting is needed.
 */

// ─── enums ────────────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type GenerationStage =
  | 'uploading'
  | 'segmenting'
  | 'analyzing'
  | 'prompting'
  | 'generating'
  | 'finalizing'
  | 'done';

export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'removed';

export type FashionCategory =
  | 'Saree'
  | 'Half Saree'
  | 'Lehenga'
  | 'Churidar'
  | 'Salwar'
  | 'Bridal Blouse'
  | 'Designer Blouse'
  | 'Anarkali'
  | 'Kids Silk Set'
  | 'Indo-Western'
  | 'Gown'
  | 'Kurti';

// ─── domain types ─────────────────────────────────────────────────────────────

export interface FabricAnalysis {
  fabric_type: string;
  texture: string;
  motifs: string[];
  colors: string[];
  embroidery: string | null;
  material: string;
  generated_prompt: string;
}

export interface GeneratedDesign {
  id: string;
  index: number;
  image_url: string;
  thumbnail_url: string;
  prompt_used: string | null;
  seed: number | null;
  is_saved: boolean;
}

export interface GenerationJob {
  job_id: string;
  status: JobStatus;
  stage: GenerationStage;
  progress_percent: number;
  queue_position: number | null;
  category: FashionCategory;
  fabric_analysis: FabricAnalysis | null;
  enhanced_prompt: string | null;
  designs: GeneratedDesign[];
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ─── API request / response shapes ───────────────────────────────────────────

export interface FabricUploadResponse {
  upload_id: string;    // S3 key / reference for the generation request
  fabric_url: string;   // Temporary signed URL for preview
}

export interface GenerateDesignsRequest {
  upload_id: string;
  category: FashionCategory;
  style_notes?: string;
}

export interface GenerateDesignsResponse {
  job_id: string;
  status: JobStatus;
  queue_position: number | null;
  estimated_wait_seconds: number | null;
}

export interface RegenerateRequest {
  job_id: string;
  design_index?: number;   // undefined = regenerate all 4
  style_notes?: string;
}

export interface SaveDesignRequest {
  design_id: string;
}

// ─── category metadata (local — no API call needed) ──────────────────────────

export interface CategoryMeta {
  value: FashionCategory;
  icon: string;
  description: string;
  exampleTags: string[];
}

export const FASHION_CATEGORIES: CategoryMeta[] = [
  {
    value: 'Saree',
    icon: '🌸',
    description: 'Drape styles across fabrics',
    exampleTags: ['Kanjeevaram', 'Banarasi', 'Chiffon'],
  },
  {
    value: 'Half Saree',
    icon: '🌺',
    description: 'South Indian half-saree sets',
    exampleTags: ['Pattu', 'Silk', 'Silk blend'],
  },
  {
    value: 'Lehenga',
    icon: '💃',
    description: 'Flared skirts with choli',
    exampleTags: ['Bridal', 'Festive', 'Indo-fusion'],
  },
  {
    value: 'Churidar',
    icon: '👘',
    description: 'Fitted salwar with kurta',
    exampleTags: ['Straight cut', 'Angrakha', 'Casual'],
  },
  {
    value: 'Salwar',
    icon: '🪡',
    description: 'Classic salwar-kameez sets',
    exampleTags: ['Patiala', 'Palazzo', 'Pakistani'],
  },
  {
    value: 'Bridal Blouse',
    icon: '👰',
    description: 'Heavily embellished wedding blouses',
    exampleTags: ['Embroidery', 'Stone work', 'Backless'],
  },
  {
    value: 'Designer Blouse',
    icon: '✨',
    description: 'Contemporary blouse designs',
    exampleTags: ['Cut sleeve', 'Peter Pan', 'Bell sleeve'],
  },
  {
    value: 'Anarkali',
    icon: '🌹',
    description: 'Flared long kurta suits',
    exampleTags: ['Floor length', 'Party wear', 'Festive'],
  },
  {
    value: 'Kids Silk Set',
    icon: '🎀',
    description: 'Silk outfits for children',
    exampleTags: ['Pattu pavadai', 'Frock', 'Dhavani'],
  },
  {
    value: 'Indo-Western',
    icon: '⚡',
    description: 'Fusion of Indian & western styles',
    exampleTags: ['Cape set', 'Pant suit', 'Jacket dress'],
  },
  {
    value: 'Gown',
    icon: '🥻',
    description: 'Floor-length formal gowns',
    exampleTags: ['A-line', 'Mermaid', 'Ball gown'],
  },
  {
    value: 'Kurti',
    icon: '👗',
    description: 'Casual to formal kurti styles',
    exampleTags: ['Straight', 'Asymmetric', 'A-line'],
  },
];

// ─── stage display helpers ────────────────────────────────────────────────────

export const STAGE_LABELS: Record<GenerationStage, string> = {
  uploading: 'Uploading fabric image…',
  segmenting: 'Isolating fabric pattern…',
  analyzing: 'Analysing texture & embroidery…',
  prompting: 'Crafting design prompt…',
  generating: 'Generating dress designs…',
  finalizing: 'Finishing touches…',
  done: 'Designs ready!',
};

export const STAGE_PROGRESS: Record<GenerationStage, number> = {
  uploading: 5,
  segmenting: 20,
  analyzing: 35,
  prompting: 50,
  generating: 80,
  finalizing: 95,
  done: 100,
};
