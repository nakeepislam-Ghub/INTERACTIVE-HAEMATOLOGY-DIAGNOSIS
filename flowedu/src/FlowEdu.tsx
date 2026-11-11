import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Award,
  BookOpen,
  Crosshair,
  FlaskConical,
  Layers,
  Microscope,
  Moon,
  Sliders,
  Sun
} from 'lucide-react';

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type MarkerName =
  | 'FSC-A'
  | 'FSC-H'
  | 'SSC-A'
  | 'CD45'
  | 'CD19'
  | 'CD3'
  | 'cCD3'
  | 'sCD3'
  | 'CD13'
  | 'CD33'
  | 'CD34'
  | 'MPO'
  | 'cMPO'
  | 'TdT'
  | 'HLA-DR'
  | 'CD10'
  | 'cCD79a'
  | 'cCD22'
  | 'CD20'
  | 'cMu'
  | 'sIgM'
  | 'Kappa'
  | 'Lambda'
  | 'CD7'
  | 'CD2'
  | 'CD5'
  | 'CD1a'
  | 'CD4'
  | 'CD8'
  | 'CD117'
  | 'CD14'
  | 'CD64'
  | 'CD11c'
  | 'CD58'
  | 'CD23'
  | 'FMC7'
  | 'CD25'
  | 'CD103'
  | 'CD38'
  | 'CD138'
  | 'CD56';

export type PopulationType =
  | 'Debris'
  | 'Lymphocytes'
  | 'Monocytes'
  | 'Granulocytes'
  | 'Blasts'
  | 'Hematogones_Early'
  | 'Hematogones_Late';

export interface GaussianCluster {
  id: string;
  name: string;
  populationType: PopulationType;
  count: number;
  color: string;
  means: Partial<Record<MarkerName, number>>; // 0 to 100 scale
  stds: Partial<Record<MarkerName, number>>;  // 2 to 18 scale
  correlation?: number;
}

export interface SimulatedEvent {
  id: number;
  populationType: PopulationType;
  color: string;
  values: Record<MarkerName, number>;
  isDoublet?: boolean;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface CustomGate {
  id: string;
  name: string;
  type: 'rect' | 'polygon';
  xAxis: MarkerName;
  yAxis: MarkerName;
  points: Point2D[]; // Normalized 0-100 coordinates
  color: string;
}

export interface GlossaryItem {
  marker: string;
  fullName: string;
  compartment: 'Nuclear' | 'Cytoplasmic' | 'Surface' | 'Scatter';
  category: 'Primitive / Stem' | 'Pan-Lineage' | 'Maturation / Subtype' | 'Physical Scatter';
  role: string;
  normalExpression: string;
  leukemiaRelevance: string;
}

export type ExpressionLevel = 'Negative' | 'Dim' | 'Positive' | 'Bright';

export interface ClinicalCase {
  id: string;
  number: number;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  patientAge: string;
  patientSex: string;
  clinicalVignette: string;
  cbc: {
    wbc: string;
    hb: string;
    platelets: string;
    blastsPeripheral: string;
    blastsMarrow: string;
  };
  morphologyDescription: string;
  morphologyFeatures: string[];
  cytogenetics: string;
  tubes: {
    id: string;
    name: string;
    xAxis: MarkerName;
    yAxis: MarkerName;
    description: string;
  }[];
  clusters: GaussianCluster[];
  expectedBlastGate: {
    cd45Min: number;
    cd45Max: number;
    sscMin: number;
    sscMax: number;
  };
  keyMarkersToInterpret: {
    marker: MarkerName;
    expected: ExpressionLevel;
    hint: string;
  }[];
  correctDiagnosis: string;
  differentialOptions: string[];
  whoExplanation: string;
  keyTakeaway: string;
}

// ============================================================================
// 2. GLOSSARY & MARKER DATABASE
// ============================================================================

const GLOSSARY_DB: Record<string, GlossaryItem> = {
  'FSC-A': {
    marker: 'FSC-A',
    fullName: 'Forward Scatter Area',
    compartment: 'Scatter',
    category: 'Physical Scatter',
    role: 'Diffracted light measured along the laser axis; directly proportional to cell surface area and relative cell size.',
    normalExpression: 'Debris/Platelets (Very Low) < Small Lymphocytes (Low-Mid) < Blasts/Monocytes/Granulocytes (Mid-High).',
    leukemiaRelevance: 'Distinguishes small L1-type lymphoblasts from larger myeloblasts or monoblasts, and filters out non-viable cell debris.'
  },
  'FSC-H': {
    marker: 'FSC-H',
    fullName: 'Forward Scatter Height',
    compartment: 'Scatter',
    category: 'Physical Scatter',
    role: 'Peak amplitude of the forward-scatter pulse. Together with FSC-A (pulse area) it reveals pulse geometry: a single cell gives a proportional area/height pair, while two cells stuck together give a wider pulse with a disproportionately large area.',
    normalExpression: 'Singlets lie on a diagonal (FSC-H ≈ 0.9 × FSC-A). Doublets/clumps fall below that diagonal.',
    leukemiaRelevance: 'Singlet gating (FSC-A vs FSC-H) removes aggregates before CD45/SSC blast gating, preventing false blast events and distorted percentages, which matters most for MRD at 10⁻⁴ sensitivity.'
  },
  'SSC-A': {
    marker: 'SSC-A',
    fullName: 'Side Scatter Area',
    compartment: 'Scatter',
    category: 'Physical Scatter',
    role: 'Refracted and reflected light measured at 90° to the laser beam; proportional to cytoplasmic granularity, nuclear lobularity, and internal complexity.',
    normalExpression: 'Lymphocytes (Low) < Monocytes (Intermediate) < Neutrophils/Eosinophils (High/Very High).',
    leukemiaRelevance: 'Crucial for separating agranular lymphoblasts (Low SSC) from granular myeloblasts and hypergranular promyelocytes in APL (M3, Very High SSC).'
  },
  'CD45': {
    marker: 'CD45',
    fullName: 'Leukocyte Common Antigen (Protein Tyrosine Phosphatase Receptor Type C)',
    compartment: 'Surface',
    category: 'Pan-Lineage',
    role: 'Transmembrane glycoprotein expressed on all hematopoietic cells except mature erythrocytes and platelets; density increases with lymphoid/myeloid maturation.',
    normalExpression: 'Erythroid/Debris (Negative) < Blasts (Dim) < Granulocytes (Moderate) < Monocytes (Bright) < Mature Lymphocytes (Very Bright).',
    leukemiaRelevance: 'Forms the X-axis of the gold-standard CD45 vs. SSC plot to isolate the "Blast Window" (CD45 dim / low-to-mid SSC).'
  },
  'CD34': {
    marker: 'CD34',
    fullName: 'Hematopoietic Progenitor Cell Antigen',
    compartment: 'Surface',
    category: 'Primitive / Stem',
    role: 'Cell-to-cell adhesion molecule that tethers early hematopoietic stem and progenitor cells to the bone marrow stroma.',
    normalExpression: 'Expressed on <1-2% of normal bone marrow cells (early stem cells and progenitors); lost as cells mature and exit marrow.',
    leukemiaRelevance: 'Positive in ~70-80% of B-ALL, 50% of T-ALL, and 60% of AML. Characteristically NEGATIVE in classic hypergranular APL (AML-M3) and mature B-ALL (Burkitt).'
  },
  'TdT': {
    marker: 'TdT',
    fullName: 'Terminal Deoxynucleotidyl Transferase',
    compartment: 'Nuclear',
    category: 'Primitive / Stem',
    role: 'Specialized template-independent DNA polymerase in the nucleus that adds random N-nucleotides to V(D)J gene junctions during TCR and Ig rearrangement.',
    normalExpression: 'Restricted to immature B and T lymphoid precursors (thymocytes and bone marrow hematogones).',
    leukemiaRelevance: 'Hallmark nuclear primitive marker of B-ALL and T-ALL lymphoblasts. Absent in mature B-ALL (Burkitt, B-IV) and most AMLs.'
  },
  'HLA-DR': {
    marker: 'HLA-DR',
    fullName: 'Human Leukocyte Antigen - DR Isotype (MHC Class II)',
    compartment: 'Surface',
    category: 'Primitive / Stem',
    role: 'Antigen-presenting MHC Class II receptor expressed on early progenitors, B-cells, and antigen-presenting monocytic cells.',
    normalExpression: 'Myeloblasts, Monoblasts/Monocytes, and all stages of B-cells (from Pro-B to Mature B). Negative on T-cells and promyelocytes.',
    leukemiaRelevance: 'Helps distinguish AML M1/M2/M4/M5 (HLA-DR+) from Acute Promyelocytic Leukemia / APL M3 (strictly HLA-DR negative). Also negative in T-ALL.'
  },
  'CD19': {
    marker: 'CD19',
    fullName: 'B-Lymphocyte Surface Antigen B4',
    compartment: 'Surface',
    category: 'Pan-Lineage',
    role: 'Core component of the B-cell co-receptor complex that lowers the threshold for B-cell receptor (BCR) signaling.',
    normalExpression: 'Expressed continuously from earliest Pro-B commitment through mature B-cells (lost only at plasma cell stage).',
    leukemiaRelevance: 'Primary WHO B-lineage assignment marker. Strong CD19 (+ 1 of CD79a, cCD22, CD10) or Weak CD19 (+ 2 of those) confirms B-ALL.'
  },
  'cCD79a': {
    marker: 'cCD79a',
    fullName: 'Cytoplasmic Ig-Alpha Signaling Subunit',
    compartment: 'Cytoplasmic',
    category: 'Pan-Lineage',
    role: 'Transduces signals upon B-cell receptor engagement; appears in cytoplasm very early in B-cell ontogeny.',
    normalExpression: 'All B-cell precursors and mature B lymphocytes.',
    leukemiaRelevance: 'Critical WHO companion marker to CD19 for confirming B-lineage commitment in Pro-B and Pre-B ALL.'
  },
  'cCD22': {
    marker: 'cCD22',
    fullName: 'Cytoplasmic B-Cell Receptor Inhibitory Lectin',
    compartment: 'Cytoplasmic',
    category: 'Pan-Lineage',
    role: 'Sialic acid-binding immunoglobulin-like lectin that regulates B-cell activation; expressed cytoplasmically in early B precursors before moving to surface.',
    normalExpression: 'Cytoplasmic in Pro-B/Pre-B; surface expression in mature B-cells.',
    leukemiaRelevance: 'One of the 3 supporting WHO B-lineage markers alongside CD10 and cCD79a.'
  },
  'CD10': {
    marker: 'CD10',
    fullName: 'Common Acute Lymphoblastic Leukemia Antigen (CALLA / Neprilysin)',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Zinc-dependent metalloprotease expressed during intermediate lymphoid development.',
    normalExpression: 'Immature B-precursors (Common B stage), germinal center B-cells, cortical thymocytes, and mature segmented neutrophils.',
    leukemiaRelevance: 'Distinguishes Common B-ALL (B-II, CD10 bright+) from Pro-B ALL (B-I, CD10 negative, often KMT2A/MLL rearranged in infants).'
  },
  'cMu': {
    marker: 'cMu',
    fullName: 'Cytoplasmic Immunoglobulin Mu Heavy Chain',
    compartment: 'Cytoplasmic',
    category: 'Maturation / Subtype',
    role: 'Heavy chain of IgM synthesized in the endoplasmic reticulum/cytoplasm following productive VDJ heavy chain rearrangement.',
    normalExpression: 'Pre-B cells ( cytoplasm+) and Mature B-cells (assembled with light chain on surface).',
    leukemiaRelevance: 'Defines the Pre-B ALL subtype (B-III: cMu+, sIgM-).'
  },
  'sIgM': {
    marker: 'sIgM',
    fullName: 'Surface Immunoglobulin M',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Complete antigen receptor complex (Mu heavy chain + Kappa or Lambda light chain) expressed on the outer cell membrane.',
    normalExpression: 'Mature naive B-lymphocytes.',
    leukemiaRelevance: 'Defines Mature B-ALL / Burkitt Leukemia (B-IV) when accompanied by clonal Kappa or Lambda light chain restriction.'
  },
  'cCD3': {
    marker: 'cCD3',
    fullName: 'Cytoplasmic CD3 Epsilon/Gamma/Delta Complex',
    compartment: 'Cytoplasmic',
    category: 'Pan-Lineage',
    role: 'T-cell receptor signaling complex assembled in the cytoplasm of earliest thymic progenitors before surface TCR expression.',
    normalExpression: 'All T-cell precursors (Pro-T, Pre-T, Cortical T) and mature T-cells.',
    leukemiaRelevance: 'THE definitive WHO criterion for T-cell lineage assignment. Positive cCD3 (or sCD3) alone establishes T-lineage.'
  },
  'CD7': {
    marker: 'CD7',
    fullName: 'T-Cell Leukemia Antigen GP40',
    compartment: 'Surface',
    category: 'Pan-Lineage',
    role: 'Earliest surface pan-T marker appearing on prethymic T-cell progenitors and NK cells.',
    normalExpression: 'All T-lineage stages and NK cells.',
    leukemiaRelevance: 'Universally bright in T-ALL (including ETP-ALL), though NOT lineage-specific by WHO because it is aberrantly expressed in ~15-30% of AMLs.'
  },
  'CD1a': {
    marker: 'CD1a',
    fullName: 'Cortical Thymocyte Antigen CD1a',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Lipid-antigen presenting molecule strictly expressed during the cortical thymocyte stage of T-cell maturation.',
    normalExpression: 'Cortical thymocytes (co-expressed with double-positive CD4+/CD8+).',
    leukemiaRelevance: 'Defines Cortical T-ALL (T-III), which carries the most favorable prognosis among T-ALL subtypes. Absent in ETP-ALL.'
  },
  'cMPO': {
    marker: 'cMPO',
    fullName: 'Cytoplasmic Myeloperoxidase',
    compartment: 'Cytoplasmic',
    category: 'Pan-Lineage',
    role: 'Lysosomal heme protein packaged in primary (azurophilic) granules of myeloid cells that generates microbicidal hypochlorous acid.',
    normalExpression: 'Myeloblasts, Promyelocytes, Myelocytes, and Mature Neutrophils (absent in Lymphocytes and pure Monoblasts).',
    leukemiaRelevance: 'Primary WHO criterion for Myeloid lineage assignment. Intensely bright in APL (M3); negative in AML M0 and pure monoblastic AML M5a.'
  },
  'CD13': {
    marker: 'CD13',
    fullName: 'Aminopeptidase N',
    compartment: 'Surface',
    category: 'Pan-Lineage',
    role: 'Zinc-binding metalloprotease expressed across granulocytic and monocytic maturation.',
    normalExpression: 'Myeloblasts through mature neutrophils and monocytes.',
    leukemiaRelevance: 'Sensitive pan-myeloid marker in AML (M0-M5). Can be aberrantly expressed in B-ALL or T-ALL.'
  },
  'CD33': {
    marker: 'CD33',
    fullName: 'Siglec-3 (Myeloid Differentiation Antigen)',
    compartment: 'Surface',
    category: 'Pan-Lineage',
    role: 'Sialic acid-binding receptor on myeloid progenitors, granulocytes, and monocytes (therapeutic target of Gemtuzumab Ozogamicin).',
    normalExpression: 'Myeloid progenitors, promyelocytes (very bright), monocytes, and neutrophils.',
    leukemiaRelevance: 'Classic pan-myeloid marker. Homogeneous bright CD33 is a hallmark of Acute Promyelocytic Leukemia (APL).'
  },
  'CD117': {
    marker: 'CD117',
    fullName: 'c-Kit (Stem Cell Factor Receptor)',
    compartment: 'Surface',
    category: 'Primitive / Stem',
    role: 'Receptor tyrosine kinase that binds Stem Cell Factor (SCF) to drive survival and proliferation of early hematopoietic and myeloid progenitors.',
    normalExpression: 'Hematopoietic stem cells, myeloblasts, promyelocytes, early erythroid precursors, and mast cells.',
    leukemiaRelevance: 'Positive in >80% of AMLs (including CD34-negative APL) and ETP-ALL.'
  },
  'CD64': {
    marker: 'CD64',
    fullName: 'High-Affinity Fc-Gamma Receptor I (FcγRI)',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Binds monomeric IgG to mediate phagocytosis and antibody-dependent cellular cytotoxicity in monocytic cells.',
    normalExpression: 'Earliest monoblasts, promonocytes, and mature monocytes.',
    leukemiaRelevance: 'Appears earlier than CD14 in monocytic commitment. WHO requires >=2 of (CD64, CD14, CD11c) to assign monocytic lineage when MPO is negative.'
  },
  'CD14': {
    marker: 'CD14',
    fullName: 'Lipopolysaccharide (LPS) Co-Receptor',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'GPI-anchored membrane protein that detects bacterial LPS alongside TLR4 on mature monocytes and macrophages.',
    normalExpression: 'Mature monocytes and macrophages (often absent or dim on very immature monoblasts).',
    leukemiaRelevance: 'Specific marker for monocytic maturation (AML M4 and M5b).'
  },
  'CD23': {
    marker: 'CD23',
    fullName: 'Low-Affinity IgE Receptor (FcεRII)',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'B-cell activation and differentiation receptor; distinguishes CLL from Mantle Cell Lymphoma.',
    normalExpression: 'Activated mature B-cells and follicular dendritic cells.',
    leukemiaRelevance: 'Co-expressed with CD5 and CD19 in Chronic Lymphocytic Leukemia (CLL: CD5+/CD23+), whereas Mantle Cell Lymphoma is typically CD5+/CD23-.'
  },
  'FMC7': {
    marker: 'FMC7',
    fullName: 'FMC7 Conformational Epitope of CD20',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Epitope on oligomeric CD20 clusters on mature B-cells.',
    normalExpression: 'Mature surface-Ig+ B-lymphocytes.',
    leukemiaRelevance: 'Negative in classic CLL (Matutes Score 0 point); strongly positive in Mantle Cell Lymphoma (MCL) and Prolymphocytic Leukemia.'
  },
  'CD103': {
    marker: 'CD103',
    fullName: 'Integrin Alpha-E (Hairy Cell Leukemia Antigen)',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Mucosal lymphocyte integrin that binds E-cadherin.',
    normalExpression: 'Intraepithelial T-lymphocytes (<1-2% of peripheral leukocytes).',
    leukemiaRelevance: 'Highly specific marker for Hairy Cell Leukemia (HCL) alongside bright CD11c, CD25, CD123, and Annexin A1.'
  },
  'CD38': {
    marker: 'CD38',
    fullName: 'Cyclic ADP Ribose Hydrolase',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Transmembrane glycoprotein involved in cell adhesion and calcium signaling; ultra-bright on plasma cells.',
    normalExpression: 'Plasma cells (Ultra-Bright), early hematogones/progenitors, and activated T/B cells.',
    leukemiaRelevance: 'Primary gating marker alongside CD138 for identifying Plasma Cell Myeloma (Multiple Myeloma); therapeutic target of Daratumumab.'
  },
  'CD138': {
    marker: 'CD138',
    fullName: 'Syndecan-1 (Plasma Cell Specific Antigen)',
    compartment: 'Surface',
    category: 'Maturation / Subtype',
    role: 'Heparan sulfate proteoglycan mediating cell-matrix adhesion.',
    normalExpression: 'Exclusively restricted to normal and neoplastic plasma cells within the hematopoietic system.',
    leukemiaRelevance: 'Gold-standard marker with CD38 for gating Multiple Myeloma cells (neoplastic plasma cells are typically CD38++/CD138++/CD56+/CD19-/CD45-dim).'
  }
};

// ============================================================================
// 3. SYNTHETIC FLOW CYTOMETRY ENGINE (2D BIVARIATE GAUSSIAN)
// ============================================================================

const ALL_MARKERS: MarkerName[] = [
  'FSC-A', 'SSC-A', 'CD45', 'CD19', 'CD3', 'cCD3', 'sCD3',
  'CD13', 'CD33', 'CD34', 'MPO', 'cMPO', 'TdT', 'HLA-DR',
  'CD10', 'cCD79a', 'cCD22', 'CD20', 'cMu', 'sIgM', 'Kappa',
  'Lambda', 'CD7', 'CD2', 'CD5', 'CD1a', 'CD4', 'CD8',
  'CD117', 'CD14', 'CD64', 'CD11c', 'CD58',
  'CD23', 'FMC7', 'CD25', 'CD103', 'CD38', 'CD138', 'CD56'
];

// Deterministic pseudo-random Box-Muller transform for reproducible scientific simulation
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateGaussianPair(rng: () => number): [number, number] {
  let u1 = rng();
  let u2 = rng();
  if (u1 < 1e-7) u1 = 1e-7;
  const mag = Math.sqrt(-2.0 * Math.log(u1));
  const z0 = mag * Math.cos(2.0 * Math.PI * u2);
  const z1 = mag * Math.sin(2.0 * Math.PI * u2);
  return [z0, z1];
}

function clamp(val: number, min = 1, max = 99): number {
  return Math.max(min, Math.min(max, val));
}

// Default background normal bone marrow/blood populations
const BASE_NORMAL_CLUSTERS: Record<Exclude<PopulationType, 'Blasts' | 'Hematogones_Early' | 'Hematogones_Late'>, Omit<GaussianCluster, 'id' | 'count'>> = {
  Debris: {
    name: 'Debris / Unlysed RBCs',
    populationType: 'Debris',
    color: '#6b7280', // Gray
    means: {
      'FSC-A': 12, 'SSC-A': 10, 'CD45': 8, 'CD19': 8, 'CD3': 8, 'cCD3': 8, 'sCD3': 8,
      'CD13': 8, 'CD33': 8, 'CD34': 8, 'MPO': 8, 'cMPO': 8, 'TdT': 8, 'HLA-DR': 8,
      'CD10': 8, 'cCD79a': 8, 'cCD22': 8, 'CD20': 8, 'cMu': 8, 'sIgM': 8, 'Kappa': 8,
      'Lambda': 8, 'CD7': 8, 'CD2': 8, 'CD5': 8, 'CD1a': 8, 'CD4': 8, 'CD8': 8,
      'CD117': 8, 'CD14': 8, 'CD64': 8, 'CD11c': 8, 'CD58': 8
    },
    stds: { 'FSC-A': 5, 'SSC-A': 5, 'CD45': 4 }
  },
  Lymphocytes: {
    name: 'Mature Lymphocytes',
    populationType: 'Lymphocytes',
    color: '#3b82f6', // Blue
    means: {
      'FSC-A': 34, 'SSC-A': 16, 'CD45': 86, 'CD19': 25, 'CD3': 74, 'cCD3': 75, 'sCD3': 74,
      'CD13': 10, 'CD33': 10, 'CD34': 9, 'MPO': 9, 'cMPO': 9, 'TdT': 9, 'HLA-DR': 22,
      'CD10': 10, 'cCD79a': 22, 'cCD22': 22, 'CD20': 24, 'cMu': 12, 'sIgM': 15, 'Kappa': 15,
      'Lambda': 14, 'CD7': 72, 'CD2': 75, 'CD5': 72, 'CD1a': 9, 'CD4': 55, 'CD8': 35,
      'CD117': 9, 'CD14': 9, 'CD64': 9, 'CD11c': 10, 'CD58': 18
    },
    stds: { 'FSC-A': 6, 'SSC-A': 4, 'CD45': 5, 'CD3': 8, 'CD19': 8 }
  },
  Monocytes: {
    name: 'Monocytes',
    populationType: 'Monocytes',
    color: '#10b981', // Emerald Green
    means: {
      'FSC-A': 64, 'SSC-A': 42, 'CD45': 80, 'CD19': 10, 'CD3': 10, 'cCD3': 10, 'sCD3': 10,
      'CD13': 72, 'CD33': 82, 'CD34': 10, 'MPO': 35, 'cMPO': 35, 'TdT': 9, 'HLA-DR': 80,
      'CD10': 12, 'cCD79a': 10, 'cCD22': 10, 'CD20': 10, 'cMu': 10, 'sIgM': 10, 'Kappa': 10,
      'Lambda': 10, 'CD7': 10, 'CD2': 12, 'CD5': 10, 'CD1a': 10, 'CD4': 42, 'CD8': 10,
      'CD117': 10, 'CD14': 84, 'CD64': 85, 'CD11c': 80, 'CD58': 45
    },
    stds: { 'FSC-A': 7, 'SSC-A': 6, 'CD45': 5, 'CD14': 6, 'CD64': 6 }
  },
  Granulocytes: {
    name: 'Granulocytes',
    populationType: 'Granulocytes',
    color: '#f59e0b', // Amber/Orange
    means: {
      'FSC-A': 68, 'SSC-A': 78, 'CD45': 58, 'CD19': 10, 'CD3': 10, 'cCD3': 10, 'sCD3': 10,
      'CD13': 78, 'CD33': 62, 'CD34': 10, 'MPO': 85, 'cMPO': 85, 'TdT': 10, 'HLA-DR': 12,
      'CD10': 68, 'cCD79a': 10, 'cCD22': 10, 'CD20': 10, 'cMu': 10, 'sIgM': 10, 'Kappa': 10,
      'Lambda': 10, 'CD7': 10, 'CD2': 10, 'CD5': 10, 'CD1a': 10, 'CD4': 10, 'CD8': 10,
      'CD117': 12, 'CD14': 16, 'CD64': 22, 'CD11c': 62, 'CD58': 40
    },
    stds: { 'FSC-A': 9, 'SSC-A': 9, 'CD45': 6, 'MPO': 6, 'CD13': 7 }
  }
};

function generateEventsFromClusters(clusters: GaussianCluster[], seed = 101, doubletRate = 0): SimulatedEvent[] {
  const rng = createSeededRandom(seed);
  // Independent stream so FSC-H / doublets never change the marker sequence above
  const rngDoublet = createSeededRandom(seed * 31 + 7);
  const events: SimulatedEvent[] = [];
  let idCounter = 1;

  for (const cluster of clusters) {
    const rho = cluster.correlation ?? 0.15;
    for (let i = 0; i < cluster.count; i++) {
      const values = {} as Record<MarkerName, number>;
      // Generate pairs for all markers
      for (let m = 0; m < ALL_MARKERS.length; m += 2) {
        const m1 = ALL_MARKERS[m];
        const m2 = ALL_MARKERS[m + 1] || ALL_MARKERS[0];
        const [z0, z1] = generateGaussianPair(rng);
        const mean1 = cluster.means[m1] ?? 12;
        const std1 = cluster.stds[m1] ?? 4.5;
        const mean2 = cluster.means[m2] ?? 12;
        const std2 = cluster.stds[m2] ?? 4.5;

        const val1 = mean1 + std1 * z0;
        const val2 = mean2 + std2 * (rho * z0 + Math.sqrt(1 - rho * rho) * z1);

        values[m1] = clamp(val1);
        if (m + 1 < ALL_MARKERS.length) {
          values[m2] = clamp(val2);
        }
      }
      // Pulse geometry: singlets keep FSC-H ~ 0.93 x FSC-A; doublets have a
      // larger area but nearly the same height (ratio ~0.6).
      const [n1, n2] = generateGaussianPair(rngDoublet);
      const isDoublet = doubletRate > 0 && rngDoublet() < doubletRate;
      const fscA = values['FSC-A'];
      if (isDoublet) {
        values['FSC-H'] = clamp(fscA * (0.95 + 0.03 * n1));
        values['FSC-A'] = clamp(fscA * (1.55 + 0.08 * n2));
        values['SSC-A'] = clamp(values['SSC-A'] * 1.25);
      } else {
        values['FSC-H'] = clamp(fscA * (0.93 + 0.025 * n1));
      }
      events.push({
        id: idCounter++,
        populationType: cluster.populationType,
        color: cluster.color,
        values,
        isDoublet: isDoublet || undefined
      });
    }
  }
  return events;
}

// ============================================================================
// 4. CLINICAL CASE BANK (10 COMPREHENSIVE CASES)
// ============================================================================

const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 'case-1',
    number: 1,
    title: 'Pediatric Common B-ALL (B-II)',
    category: 'B-Lymphoblastic Leukemia',
    difficulty: 'Beginner',
    patientAge: '4 years old',
    patientSex: 'Male',
    clinicalVignette: 'Presented with a 2-week history of low-grade fever, bone pain (limping), petechiae, and hepatosplenomegaly.',
    cbc: {
      wbc: '42.5 × 10⁹/L',
      hb: '7.8 g/dL',
      platelets: '28 × 10⁹/L',
      blastsPeripheral: '76%',
      blastsMarrow: '88%'
    },
    morphologyDescription: 'Homogeneous population of small-to-medium lymphoblasts (FAB L1 morphology) with scant agranular basophilic cytoplasm, high N:C ratio, condensed chromatin, and inconspicuous nucleoli. No Auer rods.',
    morphologyFeatures: ['High N:C Ratio', 'Agranular Cytoplasm', 'No Auer Rods', 'L1 Lymphoblasts'],
    cytogenetics: 't(12;21)(p13;q22) [ETV6::RUNX1] — Favorable risk.',
    tubes: [
      { id: 't1', name: 'Tube 1: Blast Gate', xAxis: 'CD45', yAxis: 'SSC-A', description: 'CD45 vs SSC-A to isolate the CD45-dim / low-SSC blast population.' },
      { id: 't2', name: 'Tube 2: B-Lineage & CALLA', xAxis: 'CD19', yAxis: 'CD10', description: 'Evaluate B-cell commitment (CD19) and Common ALL Antigen (CD10).' },
      { id: 't3', name: 'Tube 3: Primitive Markers', xAxis: 'CD34', yAxis: 'TdT', description: 'Confirm precursor nature with stem/nuclear markers CD34 and TdT.' },
      { id: 't4', name: 'Tube 4: Exclusion (Myeloid/T)', xAxis: 'cMPO', yAxis: 'cCD3', description: 'Exclude Myeloid (cMPO) and T-lineage (cCD3) commitment.' }
    ],
    clusters: [
      { id: 'c1-deb', count: 150, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c1-lym', count: 350, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c1-mon', count: 100, ...BASE_NORMAL_CLUSTERS.Monocytes },
      { id: 'c1-gra', count: 200, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c1-bla',
        name: 'Leukemic Blasts (Common B-ALL)',
        populationType: 'Blasts',
        count: 1600,
        color: '#ef4444',
        means: {
          'FSC-A': 42, 'SSC-A': 18, 'CD45': 36,
          'CD19': 82, 'CD10': 86, 'cCD79a': 78, 'cCD22': 74,
          'CD34': 80, 'TdT': 82, 'HLA-DR': 84,
          'CD20': 18, 'cMu': 10, 'sIgM': 10,
          'cMPO': 10, 'MPO': 10, 'cCD3': 10, 'CD3': 10, 'CD13': 12, 'CD33': 12
        },
        stds: { 'CD45': 5, 'SSC-A': 4, 'CD19': 5, 'CD10': 5, 'CD34': 6, 'TdT': 5 }
      }
    ],
    expectedBlastGate: { cd45Min: 20, cd45Max: 52, sscMin: 5, sscMax: 35 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Bright', hint: 'Check Tube 2 X-axis' },
      { marker: 'CD10', expected: 'Bright', hint: 'CALLA status on Tube 2 Y-axis' },
      { marker: 'CD34', expected: 'Positive', hint: 'Stem cell marker on Tube 3' },
      { marker: 'TdT', expected: 'Positive', hint: 'Nuclear polymerase on Tube 3' },
      { marker: 'cMPO', expected: 'Negative', hint: 'Myeloid exclusion on Tube 4' }
    ],
    correctDiagnosis: 'Common B-ALL (B-II / CALLA+)',
    differentialOptions: [
      'Pro-B ALL (B-I)',
      'Common B-ALL (B-II / CALLA+)',
      'Mature B-ALL / Burkitt (B-IV)',
      'Cortical T-ALL (T-III)',
      'Acute Myeloid Leukemia (AML M1)'
    ],
    whoExplanation: 'Meets WHO B-lineage criteria with strong CD19 co-expressed with strong CD10 (CALLA), cCD79a, and cCD22. Positive primitive markers (CD34+, TdT+, HLA-DR+) and bright CD10 without cytoplasmic Mu or surface IgM classify this as Common B-ALL (B-II), the most frequent pediatric leukemia.',
    keyTakeaway: 'Bright CD10 (CALLA) positivity separates Common B-ALL (B-II) from Pro-B ALL (B-I, CD10-).'
  },
  {
    id: 'case-2',
    number: 2,
    title: 'Acute Promyelocytic Leukemia (APL / AML-M3)',
    category: 'Acute Myeloid Leukemia',
    difficulty: 'Intermediate',
    patientAge: '36 years old',
    patientSex: 'Female',
    clinicalVignette: 'Admitted to the emergency department with severe gingival bleeding, epistaxis, ecchymoses, and laboratory evidence of Disseminated Intravascular Coagulation (DIC: elevated D-dimer, low fibrinogen).',
    cbc: {
      wbc: '3.2 × 10⁹/L',
      hb: '8.4 g/dL',
      platelets: '14 × 10⁹/L',
      blastsPeripheral: '64% (Abnormal Promyelocytes)',
      blastsMarrow: '85%'
    },
    morphologyDescription: 'Hypergranular abnormal promyelocytes with bilobed/reniform ("butterfly" or "sliding plate") nuclei, densely packed coalescent azurophilic granules, and numerous bundles of Auer rods ("Faggot cells").',
    morphologyFeatures: ['Bundles of Auer Rods (Faggot Cells)', 'Hypergranular Cytoplasm', 'Bilobed Nuclei', 'DIC Emergency'],
    cytogenetics: 't(15;17)(q24;q21) [PML::RARA] — Urgent ATRA + Arsenic Trioxide therapy indicated.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Notice the high SSC-A position due to abundant azurophilic granules.' },
      { id: 't2', name: 'Tube 2: Classic APL Trap', xAxis: 'CD34', yAxis: 'HLA-DR', description: 'Evaluate stem/progenitor markers CD34 and HLA-DR.' },
      { id: 't3', name: 'Tube 3: Myeloid Intensity', xAxis: 'cMPO', yAxis: 'CD33', description: 'Assess cytoplasmic MPO and homogeneous CD33 expression.' },
      { id: 't4', name: 'Tube 4: CD117 vs CD13', xAxis: 'CD117', yAxis: 'CD13', description: 'Confirm c-Kit (CD117) and heterogeneous CD13 expression.' }
    ],
    clusters: [
      { id: 'c2-deb', count: 150, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c2-lym', count: 400, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      {
        id: 'c2-bla',
        name: 'Abnormal Promyelocytes (APL)',
        populationType: 'Blasts',
        count: 1750,
        color: '#ef4444',
        means: {
          'FSC-A': 70, 'SSC-A': 76, 'CD45': 46,
          'CD34': 10, 'HLA-DR': 10, 'TdT': 9,
          'cMPO': 90, 'MPO': 90, 'CD33': 88, 'CD13': 72, 'CD117': 76,
          'CD14': 10, 'CD64': 28, 'CD19': 9, 'cCD3': 9
        },
        stds: { 'CD45': 6, 'SSC-A': 8, 'CD34': 3, 'HLA-DR': 3, 'cMPO': 4, 'CD33': 4, 'CD13': 9 }
      }
    ],
    expectedBlastGate: { cd45Min: 30, cd45Max: 65, sscMin: 55, sscMax: 95 },
    keyMarkersToInterpret: [
      { marker: 'SSC-A', expected: 'Bright', hint: 'Granularity on Tube 1 Y-axis' },
      { marker: 'CD34', expected: 'Negative', hint: 'Tube 2 X-axis' },
      { marker: 'HLA-DR', expected: 'Negative', hint: 'Tube 2 Y-axis' },
      { marker: 'cMPO', expected: 'Bright', hint: 'Tube 3 X-axis' },
      { marker: 'CD33', expected: 'Bright', hint: 'Tube 3 Y-axis' }
    ],
    correctDiagnosis: 'Acute Promyelocytic Leukemia (APL / AML-M3)',
    differentialOptions: [
      'Acute Myeloid Leukemia without Maturation (AML-M1)',
      'Acute Promyelocytic Leukemia (APL / AML-M3)',
      'Acute Monoblastic Leukemia (AML-M5)',
      'Chronic Myeloid Leukemia (CML)',
      'Early T-Precursor ALL (ETP-ALL)'
    ],
    whoExplanation: 'Classic hypergranular APL signature: blasts exhibit high Side Scatter (mimicking granulocytes), are strictly NEGATIVE for both CD34 and HLA-DR (since normal promyelocytes have already lost CD34 and HLA-DR), and show intensely bright cMPO, homogeneous bright CD33, heterogeneous CD13, and positive CD117.',
    keyTakeaway: 'High SSC + CD34(-) + HLA-DR(-) + Bright MPO/CD33 + CD117(+) = Classic APL (M3). Start ATRA immediately!'
  },
  {
    id: 'case-3',
    number: 3,
    title: 'Adolescent Cortical T-ALL (T-III)',
    category: 'T-Lymphoblastic Leukemia',
    difficulty: 'Beginner',
    patientAge: '16 years old',
    patientSex: 'Male',
    clinicalVignette: 'Presented with progressive dyspnea, facial swelling (Superior Vena Cava syndrome), chest X-ray showing a large anterior mediastinal (thymic) mass, and marked leukocytosis.',
    cbc: {
      wbc: '115.0 × 10⁹/L',
      hb: '10.2 g/dL',
      platelets: '65 × 10⁹/L',
      blastsPeripheral: '84%',
      blastsMarrow: '90%'
    },
    morphologyDescription: 'Medium-sized lymphoblasts with convoluted nuclear membranes, high N:C ratio, and scant basophilic cytoplasm.',
    morphologyFeatures: ['Anterior Mediastinal Mass', 'Convoluted Nuclei', 'High WBC Count', 'Thymic Phenotype'],
    cytogenetics: 'NOTCH1 activating mutation; normal karyotype.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Isolate CD45-dim/moderate low-SSC lymphoblasts.' },
      { id: 't2', name: 'Tube 2: T-Lineage Assignment', xAxis: 'cCD3', yAxis: 'CD7', description: 'Verify WHO T-lineage criterion (cCD3) and pan-T marker CD7.' },
      { id: 't3', name: 'Tube 3: Cortical Stage (CD1a)', xAxis: 'CD1a', yAxis: 'TdT', description: 'Assess thymic cortical marker CD1a and nuclear TdT.' },
      { id: 't4', name: 'Tube 4: Double Positivity', xAxis: 'CD4', yAxis: 'CD8', description: 'Evaluate dual co-expression of CD4 and CD8.' }
    ],
    clusters: [
      { id: 'c3-deb', count: 120, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c3-lym', count: 280, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c3-gra', count: 150, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c3-bla',
        name: 'Cortical T-Lymphoblasts',
        populationType: 'Blasts',
        count: 1750,
        color: '#ef4444',
        means: {
          'FSC-A': 45, 'SSC-A': 20, 'CD45': 48,
          'cCD3': 84, 'sCD3': 22, 'CD7': 88, 'CD2': 78, 'CD5': 80,
          'CD1a': 82, 'TdT': 78, 'CD4': 78, 'CD8': 80,
          'CD34': 14, 'HLA-DR': 10, 'CD19': 9, 'cMPO': 9
        },
        stds: { 'CD45': 5, 'SSC-A': 4, 'cCD3': 5, 'CD7': 5, 'CD1a': 5, 'CD4': 6, 'CD8': 6 }
      }
    ],
    expectedBlastGate: { cd45Min: 32, cd45Max: 62, sscMin: 6, sscMax: 35 },
    keyMarkersToInterpret: [
      { marker: 'cCD3', expected: 'Bright', hint: 'WHO T-lineage marker on Tube 2' },
      { marker: 'CD7', expected: 'Bright', hint: 'Pan-T marker on Tube 2' },
      { marker: 'CD1a', expected: 'Positive', hint: 'Cortical thymocyte marker on Tube 3' },
      { marker: 'CD4', expected: 'Positive', hint: 'Check co-expression on Tube 4' },
      { marker: 'CD8', expected: 'Positive', hint: 'Check co-expression on Tube 4' }
    ],
    correctDiagnosis: 'Cortical T-ALL (T-III)',
    differentialOptions: [
      'Pro-T ALL (T-I)',
      'Cortical T-ALL (T-III)',
      'Mature T-ALL (T-IV)',
      'Common B-ALL (B-II)',
      'Early T-Cell Precursor ALL (ETP-ALL)'
    ],
    whoExplanation: 'Cytoplasmic CD3 (cCD3+) establishes T-cell lineage per WHO criteria. Positivity for CD1a along with dual co-expression of CD4+ and CD8+ ("double-positive" thymocyte stage) and TdT+ specifically diagnoses Cortical T-ALL (T-III).',
    keyTakeaway: 'CD1a(+) and dual CD4(+)/CD8(+) double positivity are the hallmarks of Cortical T-ALL (T-III).'
  },
  {
    id: 'case-4',
    number: 4,
    title: 'Acute Monocytic Leukemia (AML-M5)',
    category: 'Acute Myeloid Leukemia',
    difficulty: 'Intermediate',
    patientAge: '55 years old',
    patientSex: 'Male',
    clinicalVignette: 'Presented with fever, fatigue, cervical lymphadenopathy, and prominent gingival hypertrophy (leukemic infiltration of gums).',
    cbc: {
      wbc: '68.0 × 10⁹/L',
      hb: '8.9 g/dL',
      platelets: '42 × 10⁹/L',
      blastsPeripheral: '72% (Monoblasts & Promonocytes)',
      blastsMarrow: '84%'
    },
    morphologyDescription: 'Large blasts with abundant grey-blue cytoplasm, fine azurophilic granules, cytoplasmic vacuoles, folded/convoluted nuclei with delicate lacy chromatin. Strongly positive for Non-Specific Esterase (NSE), inhibited by NaF.',
    morphologyFeatures: ['Gingival Hypertrophy', 'Folded Nuclei & Vacuoles', 'NSE Positive (NaF Sensitive)', 'Promonocytes Count as Blasts'],
    cytogenetics: 't(9;11)(p21.3;q23.3) [MLLT3::KMT2A].',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Monoblasts/promonocytes show moderate-bright CD45 and intermediate SSC.' },
      { id: 't2', name: 'Tube 2: Monocytic Markers', xAxis: 'CD64', yAxis: 'CD14', description: 'Evaluate WHO monocytic criteria (CD64 and CD14).' },
      { id: 't3', name: 'Tube 3: CD11c vs HLA-DR', xAxis: 'CD11c', yAxis: 'HLA-DR', description: 'Assess third monocytic marker CD11c and MHC Class II (HLA-DR).' },
      { id: 't4', name: 'Tube 4: Myeloid & MPO', xAxis: 'cMPO', yAxis: 'CD33', description: 'Note bright CD33 despite dim/negative cMPO in pure monoblasts.' }
    ],
    clusters: [
      { id: 'c4-deb', count: 120, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c4-lym', count: 350, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c4-gra', count: 180, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c4-bla',
        name: 'Monoblasts & Promonocytes',
        populationType: 'Blasts',
        count: 1650,
        color: '#ef4444',
        means: {
          'FSC-A': 66, 'SSC-A': 40, 'CD45': 66,
          'CD64': 88, 'CD14': 74, 'CD11c': 82, 'HLA-DR': 86,
          'CD33': 88, 'CD13': 65, 'cMPO': 14, 'MPO': 14,
          'CD34': 15, 'CD4': 44, 'CD19': 10, 'cCD3': 10
        },
        stds: { 'CD45': 6, 'SSC-A': 6, 'CD64': 5, 'CD14': 8, 'CD11c': 5, 'HLA-DR': 5 }
      }
    ],
    expectedBlastGate: { cd45Min: 50, cd45Max: 80, sscMin: 25, sscMax: 58 },
    keyMarkersToInterpret: [
      { marker: 'CD64', expected: 'Bright', hint: 'Earliest monocytic marker on Tube 2' },
      { marker: 'CD14', expected: 'Positive', hint: 'Mature monocytic marker on Tube 2' },
      { marker: 'CD11c', expected: 'Bright', hint: 'Monocytic integrin on Tube 3' },
      { marker: 'HLA-DR', expected: 'Bright', hint: 'APC MHC-II marker on Tube 3' },
      { marker: 'cMPO', expected: 'Negative', hint: 'Often negative in pure monoblasts (Tube 4)' }
    ],
    correctDiagnosis: 'Acute Monoblastic/Monocytic Leukemia (AML-M5)',
    differentialOptions: [
      'Acute Promyelocytic Leukemia (APL / AML-M3)',
      'Acute Monoblastic/Monocytic Leukemia (AML-M5)',
      'Acute Myeloid Leukemia with Maturation (AML-M2)',
      'Mature B-ALL (B-IV)',
      'Pro-T ALL (T-I)'
    ],
    whoExplanation: 'Even when cMPO is negative, WHO assigns myeloid/monocytic lineage when >=2 monocytic markers (CD64, CD14, CD11c) are positive. Here all three (CD64+, CD14+, CD11c+) are strongly expressed alongside bright HLA-DR and bright CD33.',
    keyTakeaway: 'Pure monoblasts are frequently cMPO-negative! Rely on >=2 of CD64, CD14, and CD11c + bright HLA-DR/CD33.'
  },
  {
    id: 'case-5',
    number: 5,
    title: 'Infant Pro-B ALL (B-I) with KMT2A Rearrangement',
    category: 'B-Lymphoblastic Leukemia',
    difficulty: 'Intermediate',
    patientAge: '7 months old',
    patientSex: 'Female',
    clinicalVignette: 'Infant presenting with lethargy, massive hepatosplenomegaly, CNS involvement, and extreme hyperleukocytosis.',
    cbc: {
      wbc: '185.0 × 10⁹/L',
      hb: '6.5 g/dL',
      platelets: '19 × 10⁹/L',
      blastsPeripheral: '92%',
      blastsMarrow: '95%'
    },
    morphologyDescription: 'Small-to-intermediate agranular lymphoblasts with high N:C ratio.',
    morphologyFeatures: ['Infant < 1 Year Old', 'Extreme Leukocytosis', 'CD10 (CALLA) Negative', 'KMT2A (11q23) Rearranged'],
    cytogenetics: 't(4;11)(q21;q23) [AFF1::KMT2A] — High-risk infant Pro-B ALL.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'CD45 dim-to-negative lymphoblast population.' },
      { id: 't2', name: 'Tube 2: CD19 vs CD10', xAxis: 'CD19', yAxis: 'CD10', description: 'Crucial subtyping plot: CD19+ but strictly CD10 (CALLA) negative.' },
      { id: 't3', name: 'Tube 3: Supporting B Markers', xAxis: 'cCD79a', yAxis: 'cCD22', description: 'Confirm WHO B-lineage with cytoplasmic CD79a and cCD22.' },
      { id: 't4', name: 'Tube 4: Stem & TdT', xAxis: 'CD34', yAxis: 'TdT', description: 'Confirm primitive lymphoblast stage.' }
    ],
    clusters: [
      { id: 'c5-deb', count: 140, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c5-lym', count: 260, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      {
        id: 'c5-bla',
        name: 'Pro-B Lymphoblasts (CD10-)',
        populationType: 'Blasts',
        count: 1800,
        color: '#ef4444',
        means: {
          'FSC-A': 40, 'SSC-A': 17, 'CD45': 28,
          'CD19': 84, 'CD10': 10, 'cCD79a': 80, 'cCD22': 76,
          'CD34': 78, 'TdT': 80, 'HLA-DR': 84,
          'CD20': 10, 'cMu': 10, 'sIgM': 10, 'cMPO': 10, 'cCD3': 10
        },
        stds: { 'CD45': 5, 'SSC-A': 4, 'CD19': 5, 'CD10': 3, 'cCD79a': 5, 'cCD22': 5 }
      }
    ],
    expectedBlastGate: { cd45Min: 15, cd45Max: 44, sscMin: 5, sscMax: 32 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Bright', hint: 'Tube 2 X-axis' },
      { marker: 'CD10', expected: 'Negative', hint: 'Absent in Pro-B (Tube 2 Y-axis)' },
      { marker: 'cCD79a', expected: 'Positive', hint: 'Tube 3 X-axis' },
      { marker: 'cCD22', expected: 'Positive', hint: 'Tube 3 Y-axis' },
      { marker: 'TdT', expected: 'Positive', hint: 'Tube 4 Y-axis' }
    ],
    correctDiagnosis: 'Pro-B ALL (B-I / CD10-negative)',
    differentialOptions: [
      'Pro-B ALL (B-I / CD10-negative)',
      'Common B-ALL (B-II / CD10-positive)',
      'Pre-B ALL (B-III)',
      'Mature B-ALL (B-IV)',
      'Acute Megakaryoblastic Leukemia (AML-M7)'
    ],
    whoExplanation: 'Strong CD19 with strong cCD79a and cCD22 satisfies WHO B-lineage assignment even though CD10 is completely negative. Lack of CD10, cMu, and sIgM places this at the earliest Pro-B (B-I) maturation stage, classically linked to KMT2A (MLL) t(4;11) rearrangements in infants.',
    keyTakeaway: 'Pro-B ALL (B-I) is CD19(+), cCD79a(+), TdT(+), but strictly CD10(-). Always check for KMT2A (11q23) rearrangement!'
  },
  {
    id: 'case-6',
    number: 6,
    title: 'Mature B-ALL / Burkitt Leukemia (B-IV)',
    category: 'B-Lymphoblastic / Burkitt',
    difficulty: 'Intermediate',
    patientAge: '11 years old',
    patientSex: 'Male',
    clinicalVignette: 'Presented with rapidly enlarging jaw/abdominal mass, sky-high LDH, and spontaneous Tumor Lysis Syndrome (hyperuricemia, hyperkalemia, hyperphosphatemia).',
    cbc: {
      wbc: '38.0 × 10⁹/L',
      hb: '9.5 g/dL',
      platelets: '45 × 10⁹/L',
      blastsPeripheral: '58% (L3 Blasts)',
      blastsMarrow: '82%'
    },
    morphologyDescription: 'Medium-sized lymphoid blasts (FAB L3 morphology) with deeply basophilic cytoplasm containing prominent lipid vacuoles ("starry-sky" tissue pattern).',
    morphologyFeatures: ['FAB L3 Deeply Basophilic Blasts', 'Prominent Cytoplasmic Lipid Vacuoles', 'Tumor Lysis Syndrome', 'Surface IgM Clonal Restriction'],
    cytogenetics: 't(8;14)(q24;q32) [IGH::MYC].',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Blasts show brighter CD45 approaching mature B-lymphocytes.' },
      { id: 't2', name: 'Tube 2: Mature B Markers', xAxis: 'CD19', yAxis: 'CD20', description: 'Strong co-expression of CD19 and mature pan-B marker CD20.' },
      { id: 't3', name: 'Tube 3: Primitive Loss & sIgM', xAxis: 'TdT', yAxis: 'sIgM', description: 'Loss of primitive TdT with acquisition of bright Surface IgM.' },
      { id: 't4', name: 'Tube 4: Light Chain Clonality', xAxis: 'Kappa', yAxis: 'Lambda', description: 'Demonstrates monoclonality (Kappa light chain restriction).' }
    ],
    clusters: [
      { id: 'c6-deb', count: 120, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c6-gra', count: 250, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c6-bla',
        name: 'Burkitt / Mature B-ALL Cells',
        populationType: 'Blasts',
        count: 1800,
        color: '#ef4444',
        means: {
          'FSC-A': 54, 'SSC-A': 26, 'CD45': 72,
          'CD19': 86, 'CD20': 88, 'CD10': 78, 'HLA-DR': 86,
          'TdT': 10, 'CD34': 10, 'sIgM': 86, 'cMu': 78,
          'Kappa': 85, 'Lambda': 10, 'cMPO': 10, 'cCD3': 10
        },
        stds: { 'CD45': 5, 'SSC-A': 5, 'CD19': 5, 'CD20': 5, 'sIgM': 5, 'Kappa': 5, 'Lambda': 3 }
      }
    ],
    expectedBlastGate: { cd45Min: 56, cd45Max: 86, sscMin: 12, sscMax: 42 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Bright', hint: 'Tube 2 X-axis' },
      { marker: 'CD20', expected: 'Bright', hint: 'Mature B marker on Tube 2 Y-axis' },
      { marker: 'TdT', expected: 'Negative', hint: 'Primitive marker lost (Tube 3 X-axis)' },
      { marker: 'sIgM', expected: 'Bright', hint: 'Surface IgM on Tube 3 Y-axis' },
      { marker: 'Kappa', expected: 'Bright', hint: 'Clonal restriction on Tube 4 X-axis' }
    ],
    correctDiagnosis: 'Mature B-ALL / Burkitt Leukemia (B-IV)',
    differentialOptions: [
      'Common B-ALL (B-II)',
      'Pre-B ALL (B-III)',
      'Mature B-ALL / Burkitt Leukemia (B-IV)',
      'Pro-B ALL (B-I)',
      'Acute Monocytic Leukemia (AML-M5)'
    ],
    whoExplanation: 'Unlike precursor B-ALLs (B-I to B-III), Mature B-ALL / Burkitt Leukemia (B-IV) has extinguished primitive markers (TdT- and CD34-) and acquired bright CD20, surface IgM (sIgM+), and monoclonal surface Kappa light chain restriction (with germinal center CD10+).',
    keyTakeaway: 'Mature B-ALL / Burkitt is TdT(-), CD34(-), CD20(bright+), sIgM(+), with clonal Kappa or Lambda light chain restriction.'
  },
  {
    id: 'case-7',
    number: 7,
    title: 'Mixed Phenotype Acute Leukemia (B/Myeloid MPAL)',
    category: 'Ambiguous Lineage (MPAL)',
    difficulty: 'Advanced',
    patientAge: '44 years old',
    patientSex: 'Female',
    clinicalVignette: 'Presented with pancytopenia, fatigue, and circulating blasts showing dimorphic features.',
    cbc: {
      wbc: '29.0 × 10⁹/L',
      hb: '7.9 g/dL',
      platelets: '33 × 10⁹/L',
      blastsPeripheral: '70%',
      blastsMarrow: '86%'
    },
    morphologyDescription: 'Single blast population exhibiting medium-to-large size, moderate cytoplasm with occasional fine granules, and prominent nucleoli.',
    morphologyFeatures: ['Biphenotypic Single Blast Population', 'Meets Both WHO B and Myeloid Criteria', 'Often BCR::ABL1 or KMT2A Positive'],
    cytogenetics: 't(9;22)(q34.1;q11.2) [BCR::ABL1] — MPAL with BCR::ABL1.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Single blast cluster in the dim-CD45 blast window.' },
      { id: 't2', name: 'Tube 2: Biphenotypic Co-expression', xAxis: 'CD19', yAxis: 'cMPO', description: 'Crucial plot showing simultaneous co-expression of strong CD19 and strong cMPO on the SAME blasts.' },
      { id: 't3', name: 'Tube 3: Supporting B Confirmation', xAxis: 'cCD79a', yAxis: 'CD10', description: 'Verify additional strong B-lineage markers (cCD79a and CD10) to fulfill WHO B criteria.' },
      { id: 't4', name: 'Tube 4: Stem & Myeloid', xAxis: 'CD34', yAxis: 'CD33', description: 'Co-expression of stem cell marker CD34 and myeloid marker CD33.' }
    ],
    clusters: [
      { id: 'c7-deb', count: 130, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c7-lym', count: 320, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c7-gra', count: 200, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c7-bla',
        name: 'Biphenotypic B/Myeloid Blasts',
        populationType: 'Blasts',
        count: 1700,
        color: '#ef4444',
        means: {
          'FSC-A': 52, 'SSC-A': 28, 'CD45': 38,
          'CD19': 82, 'cMPO': 78, 'MPO': 78, 'cCD79a': 78, 'CD10': 74, 'cCD22': 72,
          'CD34': 82, 'TdT': 70, 'HLA-DR': 84, 'CD13': 72, 'CD33': 76,
          'cCD3': 10, 'CD3': 10
        },
        stds: { 'CD45': 5, 'SSC-A': 5, 'CD19': 5, 'cMPO': 6, 'cCD79a': 5, 'CD10': 6 }
      }
    ],
    expectedBlastGate: { cd45Min: 24, cd45Max: 54, sscMin: 12, sscMax: 45 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Bright', hint: 'Tube 2 X-axis' },
      { marker: 'cMPO', expected: 'Positive', hint: 'Co-expressed on Tube 2 Y-axis!' },
      { marker: 'cCD79a', expected: 'Positive', hint: 'Confirms WHO B-lineage (Tube 3)' },
      { marker: 'CD10', expected: 'Positive', hint: 'Tube 3 Y-axis' },
      { marker: 'CD34', expected: 'Positive', hint: 'Tube 4 X-axis' }
    ],
    correctDiagnosis: 'Mixed Phenotype Acute Leukemia, B/Myeloid (MPAL)',
    differentialOptions: [
      'Common B-ALL with Aberrant Myeloid Expression',
      'Mixed Phenotype Acute Leukemia, B/Myeloid (MPAL)',
      'Acute Myeloid Leukemia with t(8;21)',
      'Mixed Phenotype Acute Leukemia, T/Myeloid',
      'Early T-Cell Precursor ALL (ETP-ALL)'
    ],
    whoExplanation: 'Mere expression of CD13 or CD33 in B-ALL is "aberrant expression," NOT MPAL. However, when blasts meet FULL WHO criteria for B-lineage (Strong CD19 + strong cCD79a/CD10) AND full WHO criteria for Myeloid lineage (Positive cMPO) on the same population, it diagnoses Biphenotypic B/Myeloid MPAL.',
    keyTakeaway: 'True B/Myeloid MPAL requires full WHO B criteria (CD19 + cCD79a/CD10/cCD22) PLUS cMPO positivity (or >=2 monocytic markers).'
  },
  {
    id: 'case-8',
    number: 8,
    title: 'Normal Regenerating Bone Marrow (Hematogones)',
    category: 'Benign Mimic vs. Leukemia',
    difficulty: 'Advanced',
    patientAge: '6 years old',
    patientSex: 'Female',
    clinicalVignette: 'Bone marrow aspirate performed 4 weeks after recovery from viral-induced bone marrow suppression. Clinically asymptomatic with recovering blood counts.',
    cbc: {
      wbc: '6.8 × 10⁹/L',
      hb: '11.8 g/dL',
      platelets: '240 × 10⁹/L',
      blastsPeripheral: '0%',
      blastsMarrow: '12% Lymphoid Precursors (Hematogones)'
    },
    morphologyDescription: 'Small lymphoid precursors with condensed homogeneous chromatin and virtually invisible cytoplasm, admixed with normal maturing trilineage hematopoiesis.',
    morphologyFeatures: ['Continuous Maturation Spectrum ("Smear" Pattern)', 'Stage 1 (CD34+/CD10bright) to Stage 2/3 (CD34-/CD20+)', 'No Maturation Arrest', 'Benign Mimic of B-ALL'],
    cytogenetics: '46,XX [20] — Normal female karyotype.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Continuous trail from CD45-dim precursors up into the CD45-bright mature lymphocyte gate.' },
      { id: 't2', name: 'Tube 2: Continuous CD10 vs CD20 Trail', xAxis: 'CD20', yAxis: 'CD10', description: 'Classic "inverted J / waterfall" progression from CD10-bright/CD20-neg to CD10-dim/CD20-bright.' },
      { id: 't3', name: 'Tube 3: Asynchronous Loss of CD34', xAxis: 'CD34', yAxis: 'CD19', description: 'Small Stage-1 subset is CD34+, while the majority of Stage-2/3 hematogones have smoothly lost CD34.' },
      { id: 't4', name: 'Tube 4: Normal CD58 Expression', xAxis: 'CD58', yAxis: 'CD19', description: 'Normal low/moderate CD58 (unlike B-ALL which overexpresses bright CD58).' }
    ],
    clusters: [
      { id: 'c8-deb', count: 150, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c8-lym', count: 600, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c8-mon', count: 180, ...BASE_NORMAL_CLUSTERS.Monocytes },
      { id: 'c8-gra', count: 700, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c8-hg1',
        name: 'Stage 1 Early Hematogones',
        populationType: 'Blasts',
        count: 300,
        color: '#ef4444',
        means: {
          'FSC-A': 32, 'SSC-A': 14, 'CD45': 30,
          'CD19': 75, 'CD10': 86, 'CD20': 14, 'CD34': 76, 'TdT': 76, 'CD58': 38, 'cMPO': 9
        },
        stds: { 'CD45': 5, 'SSC-A': 3, 'CD10': 5, 'CD20': 5, 'CD34': 6 }
      },
      {
        id: 'c8-hg2',
        name: 'Stage 2/3 Maturing Hematogones',
        populationType: 'Blasts',
        count: 650,
        color: '#f97316',
        means: {
          'FSC-A': 34, 'SSC-A': 15, 'CD45': 54,
          'CD19': 80, 'CD10': 55, 'CD20': 65, 'CD34': 12, 'TdT': 18, 'CD58': 32, 'cMPO': 9
        },
        stds: { 'CD45': 8, 'SSC-A': 3, 'CD10': 9, 'CD20': 14, 'CD34': 4 }
      }
    ],
    expectedBlastGate: { cd45Min: 18, cd45Max: 68, sscMin: 5, sscMax: 28 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Positive', hint: 'Uniformly positive across stages (Tube 3)' },
      { marker: 'CD10', expected: 'Positive', hint: 'Gradual transition from bright to moderate (Tube 2)' },
      { marker: 'CD20', expected: 'Dim', hint: 'Continuous smear from negative to bright (Tube 2)' },
      { marker: 'CD34', expected: 'Dim', hint: 'Biphasic: positive only on early Stage 1 subset (Tube 3)' },
      { marker: 'CD58', expected: 'Dim', hint: 'Not overexpressed (Tube 4)' }
    ],
    correctDiagnosis: 'Benign Regenerating Bone Marrow (Normal Hematogones)',
    differentialOptions: [
      'Common B-ALL Relapse (B-II)',
      'Benign Regenerating Bone Marrow (Normal Hematogones)',
      'Pro-B ALL (B-I)',
      'Smoldering Lymphoplasmacytic Lymphoma',
      'Mixed Phenotype Acute Leukemia (MPAL)'
    ],
    whoExplanation: 'Normal regenerating B-cell precursors (hematogones) display a predictable, continuous spectrum of maturation: Stage 1 (CD34+, TdT+, CD10 bright, CD20-) smoothly transitions into Stage 2/3 (CD34-, TdT-, CD10 moderate, acquiring variable-to-bright CD20 and increasing CD45). In contrast, B-ALL blasts show maturation arrest as a tight, cohesive abnormal cluster with aberrant overexpression of CD58.',
    keyTakeaway: 'Hematogones show a continuous smooth maturation trail (CD34+ -> CD20+) without maturation arrest, whereas B-ALL forms a arrested, cohesive clonal cluster.'
  },
  {
    id: 'case-9',
    number: 9,
    title: 'Early T-Cell Precursor ALL (ETP-ALL)',
    category: 'T-Lymphoblastic Leukemia',
    difficulty: 'Advanced',
    patientAge: '22 years old',
    patientSex: 'Male',
    clinicalVignette: 'Presented with generalized lymphadenopathy, fatigue, and high bone marrow blast count without a classic cortical thymic phenotype.',
    cbc: {
      wbc: '54.0 × 10⁹/L',
      hb: '8.8 g/dL',
      platelets: '38 × 10⁹/L',
      blastsPeripheral: '78%',
      blastsMarrow: '90%'
    },
    morphologyDescription: 'Immature agranular-to-hypogranular blasts with round-to-irregular nuclei and prominent nucleoli.',
    morphologyFeatures: ['cCD3+ and CD7+ T-Lineage', 'Strictly CD1a(-) and CD8(-)', 'CD5 Weak/Negative (<75% blasts)', 'Co-expresses Stem/Myeloid Markers (CD34, CD117, CD13, CD33)'],
    cytogenetics: 'FLT3-ITD and DNMT3A mutations.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'CD45-dim blast population.' },
      { id: 't2', name: 'Tube 2: T-Commitment', xAxis: 'cCD3', yAxis: 'CD7', description: 'Positive cCD3 and bright CD7 confirm T-lineage.' },
      { id: 't3', name: 'Tube 3: Absence of Cortical Markers', xAxis: 'CD1a', yAxis: 'CD8', description: 'Strictly negative for both CD1a and CD8 (defining rule of ETP-ALL).' },
      { id: 't4', name: 'Tube 4: Stem & Myeloid Co-expression', xAxis: 'CD34', yAxis: 'CD117', description: 'Co-expression of stem/myeloid markers CD34 and CD117 (and CD13/CD33) WITHOUT cMPO.' }
    ],
    clusters: [
      { id: 'c9-deb', count: 120, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c9-lym', count: 300, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      {
        id: 'c9-bla',
        name: 'ETP-ALL Blasts',
        populationType: 'Blasts',
        count: 1750,
        color: '#ef4444',
        means: {
          'FSC-A': 48, 'SSC-A': 22, 'CD45': 36,
          'cCD3': 78, 'CD7': 88, 'CD5': 25, 'CD2': 30,
          'CD1a': 9, 'CD8': 9, 'CD4': 12,
          'CD34': 82, 'CD117': 78, 'CD13': 74, 'CD33': 72, 'HLA-DR': 68,
          'cMPO': 9, 'MPO': 9, 'CD19': 9
        },
        stds: { 'CD45': 5, 'SSC-A': 4, 'cCD3': 5, 'CD7': 4, 'CD1a': 3, 'CD8': 3, 'CD34': 5, 'CD117': 6 }
      }
    ],
    expectedBlastGate: { cd45Min: 22, cd45Max: 52, sscMin: 8, sscMax: 38 },
    keyMarkersToInterpret: [
      { marker: 'cCD3', expected: 'Positive', hint: 'Confirms T-lineage (Tube 2)' },
      { marker: 'CD7', expected: 'Bright', hint: 'Universal T marker (Tube 2)' },
      { marker: 'CD1a', expected: 'Negative', hint: 'Must be negative in ETP-ALL (Tube 3)' },
      { marker: 'CD8', expected: 'Negative', hint: 'Must be negative in ETP-ALL (Tube 3)' },
      { marker: 'CD117', expected: 'Positive', hint: 'Stem/myeloid marker on Tube 4' }
    ],
    correctDiagnosis: 'Early T-Cell Precursor ALL (ETP-ALL)',
    differentialOptions: [
      'Cortical T-ALL (T-III)',
      'Early T-Cell Precursor ALL (ETP-ALL)',
      'Mixed Phenotype Acute Leukemia, T/Myeloid (MPAL)',
      'Acute Myeloid Leukemia (AML-M0)',
      'Mature T-ALL (T-IV)'
    ],
    whoExplanation: 'ETP-ALL is a distinct WHO entity derived from thymic cells that recently migrated from bone marrow and retain stem/myeloid plasticity. Diagnostic criteria: cCD3+, CD7+, strictly CD1a(-) and CD8(-), weak/negative CD5, and >=1 stem/myeloid marker (CD34, CD117, HLA-DR, CD13, CD33). Because cMPO is negative, it is ETP-ALL rather than T/Myeloid MPAL.',
    keyTakeaway: 'ETP-ALL = cCD3(+), CD7(+), CD1a(-), CD8(-), CD5(weak/-), plus stem/myeloid markers (CD34/CD117/CD13/CD33+), with cMPO(-).'
  },
  {
    id: 'case-10',
    number: 10,
    title: 'Minimal Residual Disease (MRD) Detection in B-ALL',
    category: 'Minimal Residual Disease (MRD)',
    difficulty: 'Advanced',
    patientAge: '8 years old',
    patientSex: 'Male',
    clinicalVignette: 'Day 29 End-of-Induction bone marrow aspirate in a child treated for Common B-ALL. Morphologic remission (<5% blasts by light microscopy), evaluated by high-sensitivity multiparameter flow cytometry.',
    cbc: {
      wbc: '4.9 × 10⁹/L',
      hb: '11.2 g/dL',
      platelets: '195 × 10⁹/L',
      blastsPeripheral: '0%',
      blastsMarrow: '1.5% by Morphology (Testing for MRD ≥ 0.01%)'
    },
    morphologyDescription: 'Normocellular regenerating marrow in morphologic remission. Flow cytometry interrogates whether residual CD19+ cells represent normal hematogones or persistent Leukemic-Associated Immunophenotype (LAIP).',
    morphologyFeatures: ['LAIP (Leukemia-Associated Immunophenotype)', 'Difference from Normal (DfN) Strategy', 'Overexpression of CD10, CD34, and CD58', 'Threshold: 0.01% (10⁻⁴) of Nucleated Cells'],
    cytogenetics: 'Prior hyperdiploid B-ALL clone.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Most cells are normal maturing granulocytes and lymphocytes; a small residual cluster sits in the CD45-very-dim region.' },
      { id: 't2', name: 'Tube 2: CD19 vs CD10 (Overexpression)', xAxis: 'CD19', yAxis: 'CD10', description: 'Residual leukemic clone shows abnormally ultra-bright CD10 compared to normal mature B-cells.' },
      { id: 't3', name: 'Tube 3: CD58 vs CD19 (MRD Discriminator)', xAxis: 'CD19', yAxis: 'CD58', description: 'CD58 is brightly overexpressed on residual B-ALL blasts compared to normal B-precursors.' },
      { id: 't4', name: 'Tube 4: Asynchronous CD34 vs CD20', xAxis: 'CD34', yAxis: 'CD20', description: 'Tight cluster of CD34-bright / CD20-negative blasts lacking the normal hematogone maturation trail.' }
    ],
    clusters: [
      { id: 'c10-deb', count: 150, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c10-lym', count: 850, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c10-mon', count: 250, ...BASE_NORMAL_CLUSTERS.Monocytes },
      { id: 'c10-gra', count: 1100, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c10-mrd',
        name: 'Residual B-ALL Clone (MRD+)',
        populationType: 'Blasts',
        count: 180,
        color: '#ef4444',
        means: {
          'FSC-A': 40, 'SSC-A': 16, 'CD45': 24,
          'CD19': 82, 'CD10': 92, 'CD58': 88, 'CD34': 86, 'CD20': 10, 'TdT': 82, 'cMPO': 9
        },
        stds: { 'CD45': 3, 'SSC-A': 3, 'CD19': 4, 'CD10': 3, 'CD58': 4, 'CD34': 4 }
      }
    ],
    expectedBlastGate: { cd45Min: 14, cd45Max: 36, sscMin: 5, sscMax: 28 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Bright', hint: 'B-cell gate on Tube 2 & 3' },
      { marker: 'CD10', expected: 'Bright', hint: 'Abnormally bright CALLA (Tube 2)' },
      { marker: 'CD58', expected: 'Bright', hint: 'Key MRD discriminator over hematogones (Tube 3)' },
      { marker: 'CD34', expected: 'Bright', hint: 'Tightly arrested CD34+ cluster (Tube 4)' },
      { marker: 'CD20', expected: 'Negative', hint: 'No maturation trail into CD20 (Tube 4)' }
    ],
    correctDiagnosis: 'Positive Minimal Residual Disease (B-ALL MRD+)',
    differentialOptions: [
      'Negative MRD — Only Normal Regenerating Hematogones',
      'Positive Minimal Residual Disease (B-ALL MRD+)',
      'Lineage Switch to Acute Myeloid Leukemia',
      'T-ALL Relapse',
      'Reactive T-Cell Lymphocytosis'
    ],
    whoExplanation: 'Although the marrow is in morphologic remission (<5% blasts by microscopy), flow cytometry identifies a cohesive cluster of CD19+ cells exhibiting a classic Leukemia-Associated Immunophenotype (LAIP) and Difference from Normal (DfN): ultra-bright CD10, bright CD34 without a maturation trail into CD20, abnormally dim CD45, and bright overexpression of CD58.',
    keyTakeaway: 'MRD flow cytometry reaches 10⁻⁴ (0.01%) sensitivity using LAIP and Difference-from-Normal (DfN) markers such as bright CD58, CD10/CD34 overexpression, and absence of the normal hematogone maturation curve.'
  },
  {
    id: 'case-11',
    number: 11,
    title: 'Chronic Lymphocytic Leukemia (CLL — Matutes Score 5/5)',
    category: 'Mature B-Cell Neoplasm (CLPD)',
    difficulty: 'Intermediate',
    patientAge: '68 years old',
    patientSex: 'Male',
    clinicalVignette: 'Asymptomatic elderly patient found on routine checkup to have absolute lymphocytosis and generalized painless cervical/axillary lymphadenopathy.',
    cbc: {
      wbc: '74.0 × 10⁹/L',
      hb: '12.6 g/dL',
      platelets: '165 × 10⁹/L',
      blastsPeripheral: '88% Mature Small Lymphocytes + Smudge Cells',
      blastsMarrow: '75% Interstitial/Nodular Small B-Cells'
    },
    morphologyDescription: 'Small mature-appearing lymphocytes with clumped "soccer-ball / cracked-earth" chromatin, scant cytoplasm, and numerous Gumprecht "Smudge / Basket cells" on peripheral blood film.',
    morphologyFeatures: ['Smudge / Basket Cells', 'Soccer-Ball Clumped Chromatin', 'CD5+ / CD23+ Co-expression', 'Dim CD20 & Dim Surface Ig (Matutes 5/5)'],
    cytogenetics: 'del(13q14.3) — Favorable prognosis CLL.',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Cells sit in the CD45-bright, low-SSC mature lymphocyte gate (NOT the dim blast window!).' },
      { id: 't2', name: 'Tube 2: Aberrant CD5 on B-Cells', xAxis: 'CD19', yAxis: 'CD5', description: 'Hallmark co-expression of pan-B CD19 with T-cell marker CD5.' },
      { id: 't3', name: 'Tube 3: CD23 vs FMC7 (Matutes)', xAxis: 'CD23', yAxis: 'FMC7', description: 'CLL is strongly CD23(+) and FMC7(-), distinguishing it from Mantle Cell Lymphoma.' },
      { id: 't4', name: 'Tube 4: Dim CD20 & Dim Kappa', xAxis: 'CD20', yAxis: 'Kappa', description: 'Characteristic DIM CD20 and DIM monoclonal Kappa surface light chain restriction.' }
    ],
    clusters: [
      { id: 'c11-deb', count: 100, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c11-gra', count: 250, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c11-cll',
        name: 'Neoplastic CLL B-Cells',
        populationType: 'Blasts',
        count: 1850,
        color: '#ef4444',
        means: {
          'FSC-A': 32, 'SSC-A': 15, 'CD45': 86,
          'CD19': 82, 'CD5': 78, 'CD23': 84, 'FMC7': 10,
          'CD20': 42, 'Kappa': 44, 'Lambda': 9, 'CD10': 9, 'CD34': 9, 'TdT': 9
        },
        stds: { 'CD45': 4, 'SSC-A': 3, 'CD19': 5, 'CD5': 5, 'CD23': 5, 'CD20': 4, 'Kappa': 4 }
      }
    ],
    expectedBlastGate: { cd45Min: 72, cd45Max: 98, sscMin: 5, sscMax: 28 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Bright', hint: 'B-lineage confirmation (Tube 2)' },
      { marker: 'CD5', expected: 'Positive', hint: 'Co-expressed with CD19 (Tube 2)' },
      { marker: 'CD23', expected: 'Bright', hint: 'Separates CLL from MCL (Tube 3)' },
      { marker: 'FMC7', expected: 'Negative', hint: 'Matutes score point when negative (Tube 3)' },
      { marker: 'CD20', expected: 'Dim', hint: 'Characteristically dim in CLL (Tube 4)' }
    ],
    correctDiagnosis: 'Chronic Lymphocytic Leukemia (CLL — Matutes 5/5)',
    differentialOptions: [
      'Chronic Lymphocytic Leukemia (CLL — Matutes 5/5)',
      'Mantle Cell Lymphoma (MCL — Leukemic Phase)',
      'Follicular Lymphoma (CD10+)',
      'Hairy Cell Leukemia (HCL)',
      'Common B-ALL (B-II)'
    ],
    whoExplanation: 'Classic CLL achieves 5/5 on the Moreau/Matutes scoring system: (1) CD5 positive, (2) CD23 positive, (3) FMC7 negative, (4) Dim CD20/CD79b, and (5) Dim monoclonal surface immunoglobulin (Kappa or Lambda). Notice that the cells reside in the CD45-bright mature lymphocyte region and lack CD34/TdT.',
    keyTakeaway: 'CLL = Mature Lymphocyte Gate (CD45 bright) + CD19(+) + CD5(+) + CD23(+) + FMC7(-) + Dim CD20 + Dim clonal light chain.'
  },
  {
    id: 'case-12',
    number: 12,
    title: 'Mantle Cell Lymphoma (MCL — CD5+ / CD23- / Cyclin D1+)',
    category: 'Mature B-Cell Neoplasm (CLPD)',
    difficulty: 'Advanced',
    patientAge: '63 years old',
    patientSex: 'Male',
    clinicalVignette: 'Presented with generalized lymphadenopathy, splenomegaly, GI polyps (lymphomatous polyposis), and circulating cleaved lymphoma cells.',
    cbc: {
      wbc: '46.0 × 10⁹/L',
      hb: '10.8 g/dL',
      platelets: '95 × 10⁹/L',
      blastsPeripheral: '65% Cleaved Small-to-Medium Lymphoid Cells',
      blastsMarrow: '70%'
    },
    morphologyDescription: 'Small-to-intermediate lymphoid cells with irregular, indented/cleaved nuclear contours and moderately condensed chromatin. No smudge cells.',
    morphologyFeatures: ['CD5+ / CD23- Phenotype', 'Bright CD20 & Bright sIg', 'FMC7 Positive', 't(11;14) Cyclin D1 (BCL1) Overexpression'],
    cytogenetics: 't(11;14)(q13;q32) [IGH::CCND1 / Cyclin D1+].',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'CD45-bright, low-SSC mature lymphocyte gate.' },
      { id: 't2', name: 'Tube 2: CD19 vs CD5', xAxis: 'CD19', yAxis: 'CD5', description: 'Like CLL, Mantle Cell Lymphoma is a CD5-positive B-cell neoplasm.' },
      { id: 't3', name: 'Tube 3: CD23 vs FMC7 (Discriminator)', xAxis: 'CD23', yAxis: 'FMC7', description: 'Unlike CLL, Mantle Cell Lymphoma is CD23 NEGATIVE and FMC7 BRIGHT POSITIVE!' },
      { id: 't4', name: 'Tube 4: Bright CD20 & Bright Lambda', xAxis: 'CD20', yAxis: 'Lambda', description: 'Bright surface CD20 and bright Lambda clonal light chain restriction.' }
    ],
    clusters: [
      { id: 'c12-deb', count: 100, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c12-gra', count: 300, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c12-mcl',
        name: 'Mantle Cell Lymphoma Cells',
        populationType: 'Blasts',
        count: 1750,
        color: '#ef4444',
        means: {
          'FSC-A': 38, 'SSC-A': 18, 'CD45': 85,
          'CD19': 84, 'CD5': 80, 'CD23': 10, 'FMC7': 86,
          'CD20': 88, 'Lambda': 86, 'Kappa': 10, 'CD10': 10, 'CD34': 9, 'TdT': 9
        },
        stds: { 'CD45': 4, 'SSC-A': 4, 'CD19': 5, 'CD5': 5, 'CD23': 3, 'FMC7': 5, 'CD20': 4 }
      }
    ],
    expectedBlastGate: { cd45Min: 70, cd45Max: 98, sscMin: 6, sscMax: 32 },
    keyMarkersToInterpret: [
      { marker: 'CD19', expected: 'Bright', hint: 'Tube 2 X-axis' },
      { marker: 'CD5', expected: 'Positive', hint: 'Tube 2 Y-axis' },
      { marker: 'CD23', expected: 'Negative', hint: 'Crucial distinction from CLL (Tube 3)' },
      { marker: 'FMC7', expected: 'Bright', hint: 'Strongly positive in MCL (Tube 3)' },
      { marker: 'CD20', expected: 'Bright', hint: 'Bright unlike CLL (Tube 4)' }
    ],
    correctDiagnosis: 'Mantle Cell Lymphoma (MCL — CD5+ / CD23- / FMC7+)',
    differentialOptions: [
      'Chronic Lymphocytic Leukemia (CLL)',
      'Mantle Cell Lymphoma (MCL — CD5+ / CD23- / FMC7+)',
      'Hairy Cell Leukemia (HCL)',
      'Follicular Lymphoma',
      'Mature B-ALL / Burkitt'
    ],
    whoExplanation: 'Both CLL and Mantle Cell Lymphoma co-express CD19 and CD5. However, MCL has a low Matutes score (1/5): it is CD23(-), FMC7(+), with BRIGHT CD20 and BRIGHT clonal surface light chain, confirmed by t(11;14) Cyclin D1 / SOX11 positivity.',
    keyTakeaway: 'CD19(+) + CD5(+) + CD23(-) + FMC7(+) + Bright CD20/sIg = Mantle Cell Lymphoma — confirm with Cyclin D1 / t(11;14)!'
  },
  {
    id: 'case-13',
    number: 13,
    title: 'Hairy Cell Leukemia (HCL — CD11c+ / CD25+ / CD103+)',
    category: 'Mature B-Cell Neoplasm (CLPD)',
    difficulty: 'Advanced',
    patientAge: '58 years old',
    patientSex: 'Male',
    clinicalVignette: 'Presented with massive splenomegaly, pancytopenia, absolute monocytopenia, and a "dry tap" on bone marrow aspiration due to reticulin fibrosis.',
    cbc: {
      wbc: '2.4 × 10⁹/L (Monocytopenia)',
      hb: '8.7 g/dL',
      platelets: '52 × 10⁹/L',
      blastsPeripheral: '32% Hairy Lymphoid Cells',
      blastsMarrow: 'Dry Tap — Interstitial Tartrate-Resistant Acid Phosphatase (TRAP+) Infiltrate'
    },
    morphologyDescription: 'Medium-sized lymphoid cells with oval/reniform nuclei, abundant pale blue cytoplasm, and circumferential hair-like cytoplasmic projections. Positive for TRAP stain.',
    morphologyFeatures: ['Circumferential Hair-Like Projections', 'Massive Splenomegaly & Monocytopenia', 'Dry Tap (Marrow Fibrosis)', 'BRAF V600E Mutation & TRAP+'],
    cytogenetics: 'BRAF V600E somatic mutation (present in >95% of classic HCL).',
    tubes: [
      { id: 't1', name: 'Tube 1: CD45 vs SSC ("Monocyte Gate" Shift)', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Hairy projections give HCL cells unusually high FSC/SSC (sitting in the monocyte region with bright CD45, while true monocytes are absent!).' },
      { id: 't2', name: 'Tube 2: Bright CD19 & CD20', xAxis: 'CD19', yAxis: 'CD20', description: 'Ultra-bright expression of both CD19 and CD20.' },
      { id: 't3', name: 'Tube 3: Classic HCL Triad', xAxis: 'CD103', yAxis: 'CD25', description: 'Co-expression of mucosal integrin CD103 and IL-2Rα (CD25).' },
      { id: 't4', name: 'Tube 4: Ultra-Bright CD11c & Kappa', xAxis: 'CD11c', yAxis: 'Kappa', description: 'Intensely bright CD11c co-expressed with monoclonal Kappa light chain.' }
    ],
    clusters: [
      { id: 'c13-deb', count: 120, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c13-lym', count: 350, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c13-gra', count: 350, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c13-hcl',
        name: 'Hairy Leukemia Cells',
        populationType: 'Blasts',
        count: 1400,
        color: '#ef4444',
        means: {
          'FSC-A': 58, 'SSC-A': 38, 'CD45': 88,
          'CD19': 88, 'CD20': 92, 'CD103': 85, 'CD25': 84, 'CD11c': 92,
          'Kappa': 82, 'Lambda': 10, 'CD5': 10, 'CD23': 10, 'CD10': 10
        },
        stds: { 'CD45': 4, 'SSC-A': 5, 'CD19': 4, 'CD20': 4, 'CD103': 5, 'CD25': 5, 'CD11c': 4 }
      }
    ],
    expectedBlastGate: { cd45Min: 74, cd45Max: 98, sscMin: 24, sscMax: 54 },
    keyMarkersToInterpret: [
      { marker: 'CD20', expected: 'Bright', hint: 'Ultra-bright on Tube 2' },
      { marker: 'CD103', expected: 'Bright', hint: 'Specific HCL integrin (Tube 3)' },
      { marker: 'CD25', expected: 'Positive', hint: 'Positive in classic HCL, negative in HCL-variant (Tube 3)' },
      { marker: 'CD11c', expected: 'Bright', hint: 'Ultra-bright on Tube 4' },
      { marker: 'Kappa', expected: 'Bright', hint: 'Clonal restriction on Tube 4' }
    ],
    correctDiagnosis: 'Hairy Cell Leukemia (HCL — CD11c++ / CD25+ / CD103+)',
    differentialOptions: [
      'Chronic Lymphocytic Leukemia (CLL)',
      'Hairy Cell Leukemia (HCL — CD11c++ / CD25+ / CD103+)',
      'Acute Monocytic Leukemia (AML-M5)',
      'Splenic Marginal Zone Lymphoma',
      'Mantle Cell Lymphoma (MCL)'
    ],
    whoExplanation: 'Hairy Cell Leukemia cells sit in the bright-CD45 / moderate-SSC region (mimicking monocytes on scatter, accompanied by true monocytopenia) and express ultra-bright CD19, CD20, and the classic HCL quartet: CD11c(bright+), CD25(+), CD103(+), and CD123(+).',
    keyTakeaway: 'HCL = Bright CD45 + Moderate SSC (Monocyte gate) + Bright CD19/CD20 + CD11c(++) + CD25(+) + CD103(+) + BRAF V600E.'
  },
  {
    id: 'case-14',
    number: 14,
    title: 'Multiple Myeloma / Plasma Cell Neoplasm (CD38++ / CD138++ / CD56+)',
    category: 'Plasma Cell Neoplasm',
    difficulty: 'Advanced',
    patientAge: '66 years old',
    patientSex: 'Female',
    clinicalVignette: 'Presented with lumbar back pain, lytic punched-out bone lesions, hypercalcemia, renal insufficiency, anemia (CRAB features), and a monoclonal IgG-Kappa M-spike on serum protein electrophoresis.',
    cbc: {
      wbc: '5.2 × 10⁹/L',
      hb: '8.1 g/dL (Rouleaux formation)',
      platelets: '130 × 10⁹/L',
      blastsPeripheral: '2% Circulating Plasma Cells',
      blastsMarrow: '48% Clonal Neoplastic Plasma Cells'
    },
    morphologyDescription: 'Sheets of eccentric-nucleated plasma cells with "clock-face" chromatin, abundant basophilic cytoplasm, prominent perinuclear Hof (Golgi zone), and Russell/Dutcher bodies.',
    morphologyFeatures: ['Rouleaux & CRAB Criteria', 'Eccentric Clock-Face Nucleus & Perinuclear Hof', 'Ultra-Bright CD38++ / CD138++ Gate', 'Aberrant CD56(+) & Loss of CD19/CD45'],
    cytogenetics: 't(4;14)(p16;q32) [IGH::FGFR3].',
    tubes: [
      { id: 't1', name: 'Tube 1: CD38 vs CD138 (Plasma Cell Gate)', xAxis: 'CD138', yAxis: 'CD38', description: 'Primary myeloma gate: Plasma cells are uniquely ULTRA-BRIGHT for both CD38 and CD138.' },
      { id: 't2', name: 'Tube 2: CD45 vs SSC', xAxis: 'CD45', yAxis: 'SSC-A', description: 'Neoplastic plasma cells typically downregulate CD45 (CD45-negative to dim) with intermediate SSC.' },
      { id: 't3', name: 'Tube 3: Aberrant CD56 vs Loss of CD19', xAxis: 'CD56', yAxis: 'CD19', description: 'Unlike normal plasma cells (CD19+/CD56-), malignant myeloma cells are CD19(-) and aberrantly CD56(+)!' },
      { id: 't4', name: 'Tube 4: Cytoplasmic Kappa vs Lambda', xAxis: 'Kappa', yAxis: 'Lambda', description: 'Demonstrates cytoplasmic Kappa light chain restriction ( plasma cells lack surface Ig).' }
    ],
    clusters: [
      { id: 'c14-deb', count: 120, ...BASE_NORMAL_CLUSTERS.Debris },
      { id: 'c14-lym', count: 400, ...BASE_NORMAL_CLUSTERS.Lymphocytes },
      { id: 'c14-gra', count: 550, ...BASE_NORMAL_CLUSTERS.Granulocytes },
      {
        id: 'c14-mm',
        name: 'Malignant Myeloma Plasma Cells',
        populationType: 'Blasts',
        count: 1350,
        color: '#ef4444',
        means: {
          'FSC-A': 62, 'SSC-A': 36, 'CD45': 16,
          'CD38': 92, 'CD138': 90, 'CD56': 84, 'CD19': 9, 'CD20': 10,
          'Kappa': 88, 'Lambda': 9, 'CD117': 65
        },
        stds: { 'CD45': 4, 'SSC-A': 5, 'CD38': 3, 'CD138': 4, 'CD56': 5, 'Kappa': 4 }
      }
    ],
    expectedBlastGate: { cd45Min: 6, cd45Max: 30, sscMin: 20, sscMax: 52 },
    keyMarkersToInterpret: [
      { marker: 'CD38', expected: 'Bright', hint: 'Ultra-bright on Tube 1' },
      { marker: 'CD138', expected: 'Bright', hint: 'Syndecan-1 plasma cell gate (Tube 1)' },
      { marker: 'CD56', expected: 'Bright', hint: 'Aberrant NCAM expression in Myeloma (Tube 3)' },
      { marker: 'CD19', expected: 'Negative', hint: 'Lost in neoplastic plasma cells (Tube 3)' },
      { marker: 'Kappa', expected: 'Bright', hint: 'Cytoplasmic light chain clonality (Tube 4)' }
    ],
    correctDiagnosis: 'Multiple Myeloma / Malignant Plasma Cell Neoplasm',
    differentialOptions: [
      'Normal Reactive Polyclonal Plasmacytosis',
      'Multiple Myeloma / Malignant Plasma Cell Neoplasm',
      'Waldenström Macroglobulinemia',
      'Acute Erythroid Leukemia (AML-M6)',
      'Chronic Lymphocytic Leukemia (CLL)'
    ],
    whoExplanation: 'Plasma cells are gated using ultra-bright CD38 and CD138 rather than CD45 alone. While normal bone marrow plasma cells are CD19(+), CD45(dim/+), CD56(-), and polyclonal, malignant Multiple Myeloma cells are CD19(-), CD45(-/very dim), aberrantly CD56(+) (in ~75% of cases) and/or CD117(+), with cytoplasmic Kappa or Lambda light chain restriction.',
    keyTakeaway: 'Malignant Myeloma Plasma Cells = CD38(++) / CD138(++) + CD19(-) + CD45(-/dim) + Aberrant CD56(+) + Cytoplasmic κ/λ clonality.'
  }
];

// ============================================================================
// 5. REUSABLE INTERACTIVE 2D DOT-PLOT CANVAS COMPONENT
// ============================================================================

// Raw biological value (0-100) <-> display/plot coordinate (0-100)
function toDisplay(val: number, mode: 'linear' | 'biexp'): number {
  if (mode === 'linear') return val;
  return clamp(Math.pow(val / 100, 0.85) * 100, 0, 100);
}

function toRaw(disp: number, mode: 'linear' | 'biexp'): number {
  if (mode === 'linear') return disp;
  return Math.pow(clamp(disp, 0, 100) / 100, 1 / 0.85) * 100;
}

interface DotPlotCanvasProps {
  events: SimulatedEvent[];
  xAxis: MarkerName;
  yAxis: MarkerName;
  quadrantX?: number;
  quadrantY?: number;
  onQuadrantChange?: (qx: number, qy: number) => void;
  showQuadrants?: boolean;
  scaleMode?: 'linear' | 'biexp';
  colorMode?: 'population' | 'density' | 'contour' | 'zebra';
  activePopulations?: Record<PopulationType, boolean>;
  gateMode?: 'none' | 'rect' | 'polygon';
  existingGate?: CustomGate | null;
  onCreateGate?: (points: Point2D[], type: 'rect' | 'polygon') => void;
  highlightBlastBox?: { xMin: number; xMax: number; yMin: number; yMax: number } | null;
  backgateFilter?: ((ev: SimulatedEvent) => boolean) | null;
  height?: number;
  isLightMode?: boolean;
}

const DotPlotCanvas: React.FC<DotPlotCanvasProps> = ({
  events,
  xAxis,
  yAxis,
  quadrantX = 50,
  quadrantY = 50,
  onQuadrantChange,
  showQuadrants = true,
  scaleMode = 'biexp',
  colorMode = 'population',
  activePopulations,
  gateMode = 'none',
  existingGate = null,
  onCreateGate,
  highlightBlastBox = null,
  backgateFilter = null,
  height = 380,
  isLightMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingQuad, setDraggingQuad] = useState(false);
  const [drawingRectStart, setDrawingRectStart] = useState<Point2D | null>(null);
  const [drawingRectCurrent, setDrawingRectCurrent] = useState<Point2D | null>(null);
  const [polyPoints, setPolyPoints] = useState<Point2D[]>([]);

  const PADDING = 44;

  // Transform 0-100 biological value according to scale mode
  const transformValue = (val: number): number => toDisplay(val, scaleMode);

  // Gates are stored in RAW data space so isEventInsideGate() stays correct
  // regardless of the display scale (mouse coordinates are in display space).
  const toRawPoint = (p: Point2D): Point2D => ({ x: toRaw(p.x, scaleMode), y: toRaw(p.y, scaleMode) });

  // Filtered events
  const visibleEvents = useMemo(() => {
    if (!activePopulations) return events;
    return events.filter((ev) => activePopulations[ev.populationType] !== false);
  }, [events, activePopulations]);

  // Quadrant statistics
  const quadStats = useMemo(() => {
    if (visibleEvents.length === 0) {
      return { ul: 0, ur: 0, ll: 0, lr: 0 };
    }
    let ul = 0, ur = 0, ll = 0, lr = 0;
    for (const ev of visibleEvents) {
      const vx = transformValue(ev.values[xAxis] ?? 10);
      const vy = transformValue(ev.values[yAxis] ?? 10);
      if (vx < quadrantX && vy >= quadrantY) ul++;
      else if (vx >= quadrantX && vy >= quadrantY) ur++;
      else if (vx < quadrantX && vy < quadrantY) ll++;
      else lr++;
    }
    const total = visibleEvents.length;
    return {
      ul: ((ul / total) * 100).toFixed(1),
      ur: ((ur / total) * 100).toFixed(1),
      ll: ((ll / total) * 100).toFixed(1),
      lr: ((lr / total) * 100).toFixed(1)
    };
  }, [visibleEvents, xAxis, yAxis, quadrantX, quadrantY, scaleMode]);

  // Draw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const plotW = w - PADDING * 1.5;
    const plotH = h - PADDING * 1.5;
    const originX = PADDING;
    const originY = h - PADDING;

    const valToPxX = (v: number) => originX + (v / 100) * plotW;
    const valToPxY = (v: number) => originY - (v / 100) * plotH;

    // 1. Background
    ctx.fillStyle = isLightMode ? '#ffffff' : '#090d16';
    ctx.fillRect(0, 0, w, h);

    // 2. Grid lines
    ctx.strokeStyle = isLightMode ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 100; i += 20) {
      const gx = valToPxX(i);
      const gy = valToPxY(i);
      ctx.beginPath();
      ctx.moveTo(gx, originY - plotH);
      ctx.lineTo(gx, originY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(originX, gy);
      ctx.lineTo(originX + plotW, gy);
      ctx.stroke();
    }

    // 3. Optional Highlight Blast Window Box
    if (highlightBlastBox) {
      const bx1 = valToPxX(transformValue(highlightBlastBox.xMin));
      const bx2 = valToPxX(transformValue(highlightBlastBox.xMax));
      const by1 = valToPxY(transformValue(highlightBlastBox.yMax));
      const by2 = valToPxY(transformValue(highlightBlastBox.yMin));

      ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
      ctx.fillRect(bx1, by1, bx2 - bx1, by2 - by1);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx1, by1, bx2 - bx1, by2 - by1);
      ctx.setLineDash([]);

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('Canonical Blast Window', bx1 + 6, by1 + 15);
    }

    // 4. Precompute density grid for density/contour/zebra modes
    const gridBins = 26;
    const densityGrid: number[][] = Array.from({ length: gridBins }, () => Array(gridBins).fill(0));
    let maxDensity = 1;
    if (colorMode === 'density' || colorMode === 'contour' || colorMode === 'zebra') {
      for (const ev of visibleEvents) {
        const vx = transformValue(ev.values[xAxis] ?? 10);
        const vy = transformValue(ev.values[yAxis] ?? 10);
        const gx = Math.min(gridBins - 1, Math.floor((vx / 100) * gridBins));
        const gy = Math.min(gridBins - 1, Math.floor((vy / 100) * gridBins));
        densityGrid[gx][gy]++;
        if (densityGrid[gx][gy] > maxDensity) maxDensity = densityGrid[gx][gy];
      }
    }

    // 5. Render Cell Events (and optional Topological Contour Rings)
    for (const ev of visibleEvents) {
      const vx = transformValue(ev.values[xAxis] ?? 10);
      const vy = transformValue(ev.values[yAxis] ?? 10);
      const px = valToPxX(vx);
      const py = valToPxY(vy);

      const isBackgated = backgateFilter ? backgateFilter(ev) : false;

      ctx.beginPath();
      ctx.arc(px, py, isBackgated ? 3.2 : colorMode === 'contour' ? 1.5 : 2.1, 0, Math.PI * 2);

      if (backgateFilter) {
        ctx.fillStyle = isBackgated ? '#ec4899' : isLightMode ? 'rgba(148, 163, 184, 0.28)' : 'rgba(71, 85, 105, 0.28)';
      } else if (colorMode === 'density') {
        const gx = Math.min(gridBins - 1, Math.floor((vx / 100) * gridBins));
        const gy = Math.min(gridBins - 1, Math.floor((vy / 100) * gridBins));
        const ratio = densityGrid[gx][gy] / maxDensity;
        if (ratio > 0.75) ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        else if (ratio > 0.45) ctx.fillStyle = 'rgba(234, 179, 8, 0.8)';
        else if (ratio > 0.2) ctx.fillStyle = 'rgba(16, 185, 129, 0.75)';
        else ctx.fillStyle = 'rgba(6, 182, 212, 0.65)';
      } else if (colorMode === 'zebra') {
        const gx = Math.min(gridBins - 1, Math.floor((vx / 100) * gridBins));
        const gy = Math.min(gridBins - 1, Math.floor((vy / 100) * gridBins));
        const band = Math.floor((densityGrid[gx][gy] / maxDensity) * 6);
        ctx.fillStyle = band % 2 === 0 ? '#06b6d4cc' : '#f43f5ecc';
      } else if (colorMode === 'contour') {
        ctx.fillStyle = isLightMode ? 'rgba(100, 116, 139, 0.35)' : 'rgba(148, 163, 184, 0.3)';
      } else {
        ctx.fillStyle = ev.color + 'b3';
      }
      ctx.fill();
    }

    // Draw topological contour rings when in 'contour' or 'zebra' mode
    if (colorMode === 'contour' || colorMode === 'zebra') {
      for (let gx = 0; gx < gridBins; gx++) {
        for (let gy = 0; gy < gridBins; gy++) {
          const count = densityGrid[gx][gy];
          if (count < maxDensity * 0.15) continue;
          const cx = valToPxX(((gx + 0.5) / gridBins) * 100);
          const cy = valToPxY(((gy + 0.5) / gridBins) * 100);
          const ratio = count / maxDensity;
          ctx.beginPath();
          ctx.arc(cx, cy, (plotW / gridBins) * (0.45 + ratio * 0.65), 0, Math.PI * 2);
          ctx.strokeStyle =
            ratio > 0.7
              ? '#ef4444'
              : ratio > 0.4
              ? '#f59e0b'
              : isLightMode
              ? '#0284c7'
              : '#38bdf8';
          ctx.lineWidth = ratio > 0.65 ? 1.8 : 1.1;
          ctx.stroke();
        }
      }
    }

    // 6. Render Existing Custom Gate
    if (existingGate && existingGate.xAxis === xAxis && existingGate.yAxis === yAxis && existingGate.points.length >= 2) {
      const gatePts = existingGate.points.map((p) => ({ x: transformValue(p.x), y: transformValue(p.y) }));
      ctx.strokeStyle = existingGate.color || '#10b981';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.14)';
      ctx.lineWidth = 2;

      if (existingGate.type === 'rect') {
        const [p1, p2] = gatePts;
        const rx = valToPxX(Math.min(p1.x, p2.x));
        const ry = valToPxY(Math.max(p1.y, p2.y));
        const rw = Math.abs(valToPxX(p2.x) - valToPxX(p1.x));
        const rh = Math.abs(valToPxY(p2.y) - valToPxY(p1.y));
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(existingGate.name, rx + 6, ry + 15);
      } else {
        ctx.beginPath();
        gatePts.forEach((pt, idx) => {
          const px = valToPxX(pt.x);
          const py = valToPxY(pt.y);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const first = gatePts[0];
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText(existingGate.name, valToPxX(first.x) + 6, valToPxY(first.y) - 6);
      }
    }

    // 7. Render Active Drawing Gate Preview
    if (gateMode === 'rect' && drawingRectStart && drawingRectCurrent) {
      const rx = valToPxX(Math.min(drawingRectStart.x, drawingRectCurrent.x));
      const ry = valToPxY(Math.max(drawingRectStart.y, drawingRectCurrent.y));
      const rw = Math.abs(valToPxX(drawingRectCurrent.x) - valToPxX(drawingRectStart.x));
      const rh = Math.abs(valToPxY(drawingRectCurrent.y) - valToPxY(drawingRectStart.y));
      ctx.strokeStyle = '#06b6d4';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 2;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    }

    if (gateMode === 'polygon' && polyPoints.length > 0) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      polyPoints.forEach((pt, idx) => {
        const px = valToPxX(pt.x);
        const py = valToPxY(pt.y);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      polyPoints.forEach((pt, idx) => {
        ctx.fillStyle = idx === 0 ? '#10b981' : '#06b6d4';
        ctx.beginPath();
        ctx.arc(valToPxX(pt.x), valToPxY(pt.y), idx === 0 ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 8. Quadrant Crosshairs & Percentages
    if (showQuadrants) {
      const qxPx = valToPxX(quadrantX);
      const qyPx = valToPxY(quadrantY);

      ctx.strokeStyle = '#94a3b8';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(qxPx, originY - plotH);
      ctx.lineTo(qxPx, originY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(originX, qyPx);
      ctx.lineTo(originX + plotW, qyPx);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center handle
      ctx.fillStyle = isLightMode ? '#1e293b' : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(qxPx, qyPx, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Quadrant labels
      ctx.font = '600 11px Inter, monospace';
      ctx.fillStyle = isLightMode ? '#1e293b' : '#cbd5e1';
      ctx.fillText(`UL: ${quadStats.ul}%`, originX + 8, originY - plotH + 16);
      ctx.fillText(`UR: ${quadStats.ur}%`, originX + plotW - 68, originY - plotH + 16);
      ctx.fillText(`LL: ${quadStats.ll}%`, originX + 8, originY - 8);
      ctx.fillText(`LR: ${quadStats.lr}%`, originX + plotW - 68, originY - 8);
    }

    // 9. Axes Border & Labels
    ctx.strokeStyle = isLightMode ? '#64748b' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(originX, originY - plotH, plotW, plotH);

    // Tick labels
    ctx.fillStyle = isLightMode ? '#475569' : '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    const ticks = scaleMode === 'biexp' ? ['0', '10²', '10³', '10⁴', '10⁵'] : ['0', '25', '50', '75', '100'];
    ticks.forEach((lbl, idx) => {
      const val = idx * 25;
      ctx.fillText(lbl, valToPxX(val) - 8, originY + 14);
      ctx.fillText(lbl, originX - 28, valToPxY(val) + 3);
    });

    // Axis titles
    ctx.fillStyle = isLightMode ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`${xAxis} (${scaleMode === 'biexp' ? 'Log/Biexp' : 'Linear'}) →`, originX + plotW / 2 - 55, h - 8);

    ctx.save();
    ctx.translate(14, originY - plotH / 2 + 40);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${yAxis} (${scaleMode === 'biexp' ? 'Log/Biexp' : 'Linear'}) →`, 0, 0);
    ctx.restore();
  }, [
    visibleEvents,
    xAxis,
    yAxis,
    quadrantX,
    quadrantY,
    showQuadrants,
    scaleMode,
    colorMode,
    existingGate,
    gateMode,
    drawingRectStart,
    drawingRectCurrent,
    polyPoints,
    highlightBlastBox,
    quadStats,
    isLightMode,
    backgateFilter
  ]);

  // Convert Mouse Event to 0-100 data coordinates
  const getCoordsFromMouse = (e: React.MouseEvent<HTMLCanvasElement>): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 50, y: 50 };
    const rect = canvas.getBoundingClientRect();
    const plotW = rect.width - PADDING * 1.5;
    const plotH = rect.height - PADDING * 1.5;
    const originX = PADDING;
    const originY = rect.height - PADDING;

    const rawX = ((e.clientX - rect.left - originX) / plotW) * 100;
    const rawY = ((originY - (e.clientY - rect.top)) / plotH) * 100;
    return { x: clamp(rawX, 0, 100), y: clamp(rawY, 0, 100) };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCoordsFromMouse(e);
    if (gateMode === 'rect') {
      setDrawingRectStart(pt);
      setDrawingRectCurrent(pt);
      return;
    }
    if (gateMode === 'polygon') {
      if (polyPoints.length >= 3) {
        const first = polyPoints[0];
        const dist = Math.hypot(pt.x - first.x, pt.y - first.y);
        if (dist < 8) {
          onCreateGate?.(polyPoints.map(toRawPoint), 'polygon');
          setPolyPoints([]);
          return;
        }
      }
      setPolyPoints((prev) => [...prev, pt]);
      return;
    }
    if (showQuadrants && onQuadrantChange) {
      setDraggingQuad(true);
      onQuadrantChange(Math.round(pt.x), Math.round(pt.y));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCoordsFromMouse(e);
    if (gateMode === 'rect' && drawingRectStart) {
      setDrawingRectCurrent(pt);
      return;
    }
    if (draggingQuad && onQuadrantChange) {
      onQuadrantChange(Math.round(pt.x), Math.round(pt.y));
    }
  };

  const handleMouseUp = () => {
    if (gateMode === 'rect' && drawingRectStart && drawingRectCurrent) {
      const dist = Math.hypot(drawingRectCurrent.x - drawingRectStart.x, drawingRectCurrent.y - drawingRectStart.y);
      if (dist > 4) {
        onCreateGate?.([toRawPoint(drawingRectStart), toRawPoint(drawingRectCurrent)], 'rect');
      }
      setDrawingRectStart(null);
      setDrawingRectCurrent(null);
    }
    setDraggingQuad(false);
  };

  return (
    <div className="relative w-full select-none">
      <canvas
        ref={canvasRef}
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full rounded-xl border ${isLightMode ? 'border-slate-300 bg-white' : 'border-slate-800 bg-[#090d16]'} shadow-inner ${
          gateMode !== 'none' ? 'cursor-crosshair' : showQuadrants ? 'cursor-move' : 'cursor-default'
        }`}
      />
      {gateMode === 'polygon' && polyPoints.length > 0 && (
        <div className="absolute top-3 left-14 flex items-center gap-2 rounded-lg bg-slate-900/90 px-3 py-1.5 text-xs text-cyan-300 border border-cyan-500/40">
          <span>Polygon vertices: {polyPoints.length} (Click green start point or Finish to close)</span>
          {polyPoints.length >= 3 && (
            <button
              onClick={() => {
                onCreateGate?.(polyPoints.map(toRawPoint), 'polygon');
                setPolyPoints([]);
              }}
              className="rounded bg-emerald-600 px-2 py-0.5 font-semibold text-white hover:bg-emerald-500"
            >
              Finish Gate
            </button>
          )}
          <button
            onClick={() => setPolyPoints([])}
            className="rounded bg-slate-700 px-2 py-0.5 text-slate-300 hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 6. POINT-IN-GATE HELPER FUNCTIONS
// ============================================================================

function isEventInsideGate(ev: SimulatedEvent, gate: CustomGate): boolean {
  const vx = ev.values[gate.xAxis] ?? 10;
  const vy = ev.values[gate.yAxis] ?? 10;

  if (gate.type === 'rect' && gate.points.length >= 2) {
    const [p1, p2] = gate.points;
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    return vx >= minX && vx <= maxX && vy >= minY && vy <= maxY;
  }

  if (gate.type === 'polygon' && gate.points.length >= 3) {
    let inside = false;
    const pts = gate.points;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y;
      const xj = pts[j].x, yj = pts[j].y;
      const intersect = yi > vy !== yj > vy && vx < ((xj - xi) * (vy - yi)) / (yj - yi + 1e-9) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
  return true;
}

// ============================================================================
// 7. MAIN APPLICATION COMPONENT
// ============================================================================


const ARABIC_CASE_EXPLANATIONS: Record<string, { summary: string; pearl: string }> = {
  'case-1': {
    summary: 'حالة لوكيميا ليمفاوية حادة (Common B-ALL B-II): الخلايا تقع في منطقة الـ Blast Window (CD45 dim / Low SSC) وتعبر بقوة عن CD19 مع وجود CD10 (CALLA) إيجابي قوي، بالإضافة إلى دلالات الخلايا الأولية CD34 و TdT و HLA-DR، مع سلبية الـ cMPO والـ cCD3.',
    pearl: 'الـ CD10 (CALLA) الإيجابي القوي يميز الـ Common B-ALL (أشهر نوع في الأطفال) عن الـ Pro-B ALL.'
  },
  'case-2': {
    summary: 'حالة لوكيميا promyelocytic حادة (APL / AML-M3): الخلايا تتميز بـ Side Scatter عالي جداً بسبب كثافة الحبيبات ووجود حزم Auer rods (خلايا Faggot)، مع سلبية تامة لكل من CD34 و HLA-DR، وإيجابية شديدة لـ cMPO و CD33 و CD117.',
    pearl: 'انتبه لفخ الـ APL: علو الـ SSC مع سلبية CD34 وسلبية HLA-DR وإيجابية MPO القوية يستدعي بدء علاج الـ ATRA فوراً لمنع الـ DIC!'
  },
  'case-3': {
    summary: 'حالة Cortical T-ALL (T-III) في مراهق يعاني من كتلة في المنصف الأمامي (Mediastinal mass): إيجابية الـ cCD3 تحسم انتماء الخلايا للـ T-Lineage، ووجود CD1a مع التعبير المزدوج (Double Positive) لـ CD4+ و CD8+ يشخص مرحلة الـ Cortical T-ALL.',
    pearl: 'إيجابية الـ CD1a مع الـ Double Positivity (CD4+/CD8+) هي العلامة المميزة لـ Cortical T-ALL صاحبة أفضل استجابة علاجية.'
  },
  'case-4': {
    summary: 'حالة لوكيميا وحيدة الخلية الحادة (Acute Monocytic Leukemia AML-M5): تضخم اللثة مع خلايا كبيرة ذات أنوية ملتفة. حتى لو كان الـ cMPO سلبياً، فإن منظمة الصحة العالمية تشخص الـ Monocytic lineage بوجود اثنين أو أكثر من (CD64, CD14, CD11c) مع HLA-DR و CD33 قوي.',
    pearl: 'الـ Monoblasts النقية غالباً تكون سلبية الـ MPO؛ اعتمد على إيجابية CD64 و CD14 و CD11c لتشخيص الـ AML-M5.'
  },
  'case-5': {
    summary: 'حالة Pro-B ALL (B-I) في رضيع أقل من سنة: إيجابية قوية لـ CD19 مع cCD79a و cCD22 و TdT، ولكن سلبية تامة لـ CD10 (CALLA Negative). ترتبط غالباً بطفرة الجين KMT2A (MLL) t(4;11).',
    pearl: 'الـ Pro-B ALL تكون CD19+ و cCD79a+ ولكن CD10 سلبي تماماً.'
  },
  'case-6': {
    summary: 'حالة Mature B-ALL / Burkitt Leukemia (B-IV): خلايا L3 ذات فجوات دهنية واضحة ومتلازمة تحلل الورم (TLS). اختفت منها دلالات الخلايا البدائية (TdT سلبي و CD34 سلبي) واكتسبت CD20 قوي و Surface IgM مع تقييد أحادي النسيلة لسلسلة Kappa.',
    pearl: 'الـ Mature B-ALL (Burkitt) تتميز بسلبية TdT و CD34 مع إيجابية الـ Surface IgM وتقييد الـ Light Chain.'
  },
  'case-7': {
    summary: 'حالة لوكيميا مختلطة النمط الظاهري (B/Myeloid MPAL Biphenotypic): نفس تجمع الـ Blasts يحقق شروط الـ WHO الكاملة للـ B-Lineage (CD19 قوي + cCD79a و CD10) وشروط الـ Myeloid الكاملة (cMPO إيجابي قوي) في آن واحد.',
    pearl: 'لا تشخص MPAL بمجرد وجود CD13 أو CD33 عابر، بل يجب تحقق شروط الـ WHO الكاملة لكلا السلالتين (مثل CD19+cCD79a مع cMPO).'
  },
  'case-8': {
    summary: 'نخاع عظم متجدد طبيعي (Regenerating Bone Marrow Hematogones): يظهر مسار نضج متصل ومتدرج يبدأ من Stage 1 (CD34+ / CD10 bright / CD20-) وينساب بسلاسة إلى Stage 2/3 (فقدان CD34 واكتساب CD20 تدريجياً وارتفاع CD45) مع CD58 طبيعي غير مرتفع.',
    pearl: 'الـ Hematogones تظهر كشريط نضج متصل بدون توقف (No maturation arrest)، بينما الـ B-ALL تتجمع ككتلة متوقفة النمو مع علو CD58.'
  },
  'case-9': {
    summary: 'حالة Early T-Cell Precursor ALL (ETP-ALL): خلايا T بدائية جداً (cCD3+ و CD7+) تتميز بسلبية تامة لكل من CD1a و CD8، وضعف CD5، مع وجود دلالات الخلايا الجذعية والـ Myeloid (مثل CD34 و CD117 و CD13/CD33) ولكن مع سلبية الـ cMPO.',
    pearl: 'معادلة الـ ETP-ALL: إيجابية cCD3 و CD7 + سلبية CD1a و CD8 + وجود دلالات جذعية/مايلويد مع سلبية الـ MPO.'
  },
  'case-10': {
    summary: 'الكشف عن المرض المتبقي الضئيل (Positive B-ALL MRD): رغم أن النخاع يبدو في شفاء شكلي تحت الميكروسكوب (<5%)، إلا أن الـ Flow Cytometry يكشف بؤرة خلايا شاذة (LAIP) تتميز بفرط التعبير عن CD58 و CD10 و CD34 دون التدرج الطبيعي للـ Hematogones.',
    pearl: 'الـ Flow MRD يصل لحساسية 0.01% (10⁻⁴) باستخدام فرط التعبير عن CD58 والشذوذ عن مسار النضج الطبيعي (DfN).'
  },
  'case-11': {
    summary: 'لوكيميا ليمفاوية مزمنة (CLL — Matutes Score 5/5): الخلايا تقع في منطقة الـ Mature Lymphocytes (CD45 bright / Low SSC) مع وجود Smudge cells. تحقق 5 من 5 في مقياس Matutes: إيجابية CD5، إيجابية CD23، سلبية FMC7، ضعف (Dim) CD20، وضعف السلسلة الخفيفة السطحية Kappa.',
    pearl: 'تذكر خماسية الـ CLL: خلايا ناضجة CD19+ تشترك في التعبير عن CD5+ و CD23+ مع سلبية FMC7 وضعف CD20 و sIg.'
  },
  'case-12': {
    summary: 'ليمفوما خلايا الرداء (Mantle Cell Lymphoma — MCL): تشترك مع الـ CLL في إيجابية CD19 و CD5، لكنها تختلف عنها بكونها سلبية الـ CD23، وإيجابية قوية لـ FMC7، وإيجابية ساطعة (Bright) لكل من CD20 والسلسلة الخفيفة Lambda، وترتبط بـ t(11;14) Cyclin D1.',
    pearl: 'الفرق الحاسم بين CLL و MCL: كلاهما CD19+/CD5+، لكن الـ MCL تكون CD23(-) و FMC7(+) و CD20 Bright!'
  },
  'case-13': {
    summary: 'لوكيميا الخلايا المشعرة (Hairy Cell Leukemia — HCL): خلايا ذات زوائد شعرية، تضخم طحال، ونقص شديد في الـ Monocytes. تقع الخلايا في منطقة الـ Monocyte gate (CD45 bright مع SSC متوسط) وتعبر بقوة فائقة عن CD19 و CD20 والرباعي المميز: CD11c++ و CD25+ و CD103+ و CD123+.',
    pearl: 'الـ Hairy Cell Leukemia تسكن منطقة الـ Monocytes في الـ Scatter وتعبر عن الثالوث الذهبي: CD11c(bright) + CD25 + CD103.'
  },
  'case-14': {
    summary: 'المايلوما المتعددة (Multiple Myeloma / Plasma Cell Neoplasm): يتم عزل خلايا البلازما عبر إيجابيتها الفائقة لـ CD38++ و CD138++. تتميز خلايا المايلوما الخبيثة بفقدان CD19 وضعف/سلبية CD45، مع اكتساب شاذ لـ CD56+ وتقييد أحادي النسيلة للسلسلة الخفيفة داخل السيتوبلازم (Cytoplasmic Kappa).',
    pearl: 'بوابة خلايا البلازما هي CD38++/CD138++؛ خلايا المايلوما الخبيثة تكون CD19(-) و CD56(+) مع تقييد Kappa أو Lambda سيتوبلازمي.'
  }
};


// ============================================================================
// 8. SHARED UI HELPERS & NEW INSTRUMENT-LAB COMPONENTS
// ============================================================================

interface UI {
  page: string;
  card: string;
  muted: string;
  soft: string;
  input: string;
  btn: string;
  subtle: string;
}

const UI_DARK: UI = {
  page: 'bg-slate-950 text-slate-100',
  card: 'rounded-2xl border border-slate-800 bg-slate-900/60',
  muted: 'text-slate-400',
  soft: 'text-slate-300',
  input: 'border border-slate-700 bg-slate-800 text-slate-100',
  btn: 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700',
  subtle: 'bg-slate-800/60'
};

const UI_LIGHT: UI = {
  page: 'bg-slate-50 text-slate-900',
  card: 'rounded-2xl border border-slate-200 bg-white',
  muted: 'text-slate-500',
  soft: 'text-slate-700',
  input: 'border border-slate-300 bg-white text-slate-900',
  btn: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100',
  subtle: 'bg-slate-100'
};

type GateTool = 'none' | 'rect' | 'polygon';
type ScaleMode = 'linear' | 'biexp';
type ColorMode = 'population' | 'density' | 'contour' | 'zebra';

const AXIS_OPTIONS: MarkerName[] = [...ALL_MARKERS, 'FSC-H'];

const ALL_POPS_ON: Record<PopulationType, boolean> = {
  Debris: true,
  Lymphocytes: true,
  Monocytes: true,
  Granulocytes: true,
  Blasts: true,
  Hematogones_Early: true,
  Hematogones_Late: true
};

const TOGGLE_POPULATIONS: { key: PopulationType; label: string; color: string }[] = [
  { key: 'Debris', label: 'Debris', color: '#6b7280' },
  { key: 'Lymphocytes', label: 'Lymphocytes', color: '#3b82f6' },
  { key: 'Monocytes', label: 'Monocytes', color: '#10b981' },
  { key: 'Granulocytes', label: 'Granulocytes', color: '#f59e0b' },
  { key: 'Blasts', label: 'Abnormal / Blasts', color: '#ef4444' }
];

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Maps the 0-100 simulation scale onto pseudo fluorescence intensity so it
// matches the plot tick labels (25 -> 10^2 ... 100 -> 10^5).
function rawToIntensity(v: number): number {
  if (v <= 25) return (v / 25) * 100;
  return Math.pow(10, 2 + 0.04 * (v - 25));
}

function formatIntensity(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function pct(n: number, d: number): string {
  return d === 0 ? '0.0' : ((n / d) * 100).toFixed(1);
}

interface AxisSelectProps {
  label: string;
  value: MarkerName;
  onChange: (m: MarkerName) => void;
  ui: UI;
}

const AxisSelect: React.FC<AxisSelectProps> = ({ label, value, onChange, ui }) => (
  <label className="flex items-center gap-1.5 text-xs">
    <span className={ui.muted}>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MarkerName)}
      className={`rounded-lg px-2 py-1 text-xs ${ui.input}`}
    >
      {AXIS_OPTIONS.map((m) => (
        <option key={m} value={m}>
          {m}
        </option>
      ))}
    </select>
  </label>
);

interface StatTileProps {
  label: string;
  value: string;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  ui: UI;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, tone = 'neutral', ui }) => {
  const toneClass =
    tone === 'good' ? 'text-emerald-500' : tone === 'warn' ? 'text-amber-500' : tone === 'bad' ? 'text-rose-500' : '';
  return (
    <div className={`rounded-xl px-3 py-2 ${ui.subtle}`}>
      <div className={`text-[11px] uppercase tracking-wide ${ui.muted}`}>{label}</div>
      <div className={`text-lg font-bold ${toneClass}`}>{value}</div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// 1D HISTOGRAM WITH LIVE MFI
// ----------------------------------------------------------------------------

interface HistogramPanelProps {
  allEvents: SimulatedEvent[];
  gatedEvents: SimulatedEvent[] | null;
  marker: MarkerName;
  isLightMode: boolean;
  ui: UI;
}

const HistogramPanel: React.FC<HistogramPanelProps> = ({ allEvents, gatedEvents, marker, isLightMode, ui }) => {
  const BINS = 50;
  const W = 600;
  const H = 150;

  const stats = useMemo(() => {
    const build = (evs: SimulatedEvent[]) => {
      const bins: number[] = Array(BINS).fill(0);
      const vals: number[] = [];
      for (const ev of evs) {
        const v = ev.values[marker] ?? 0;
        vals.push(v);
        bins[Math.min(BINS - 1, Math.floor((toDisplay(v, 'biexp') / 100) * BINS))]++;
      }
      const maxBin = Math.max(1, ...bins);
      const meanIntensity = vals.length ? vals.reduce((a, v) => a + rawToIntensity(v), 0) / vals.length : 0;
      return { bins, maxBin, n: vals.length, mfi: rawToIntensity(median(vals)), meanIntensity };
    };
    return { all: build(allEvents), gated: gatedEvents ? build(gatedEvents) : null };
  }, [allEvents, gatedEvents, marker]);

  const pathFor = (bins: number[], maxBin: number): string => {
    const bw = W / BINS;
    let d = `M0,${H}`;
    bins.forEach((count, i) => {
      const y = H - (count / maxBin) * (H - 8);
      d += ` L${(i * bw).toFixed(1)},${y.toFixed(1)} L${((i + 1) * bw).toFixed(1)},${y.toFixed(1)}`;
    });
    d += ` L${W},${H} Z`;
    return d;
  };

  const ticks = [
    { v: 0, label: '0' },
    { v: 25, label: '10²' },
    { v: 50, label: '10³' },
    { v: 75, label: '10⁴' },
    { v: 100, label: '10⁵' }
  ];

  const ratio = stats.gated && stats.all.mfi > 0 ? stats.gated.mfi / stats.all.mfi : null;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full">
        <rect x={0} y={0} width={W} height={H} fill={isLightMode ? '#ffffff' : '#090d16'} stroke={isLightMode ? '#cbd5e1' : '#1e293b'} />
        <path d={pathFor(stats.all.bins, stats.all.maxBin)} fill="#64748b" fillOpacity={0.45} stroke="#64748b" />
        {stats.gated && (
          <path d={pathFor(stats.gated.bins, stats.gated.maxBin)} fill="#10b981" fillOpacity={0.45} stroke="#10b981" strokeWidth={1.5} />
        )}
        {ticks.map((t) => {
          const x = (toDisplay(t.v, 'biexp') / 100) * W;
          return (
            <text key={t.label} x={Math.min(W - 10, Math.max(8, x))} y={H + 15} fontSize={11} textAnchor="middle" fill={isLightMode ? '#475569' : '#94a3b8'}>
              {t.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile ui={ui} label={`All events · MFI (median)`} value={formatIntensity(stats.all.mfi)} />
        <StatTile ui={ui} label="All events · mean" value={formatIntensity(stats.all.meanIntensity)} />
        <StatTile ui={ui} label="Gated · MFI (median)" value={stats.gated && stats.gated.n ? formatIntensity(stats.gated.mfi) : '—'} tone="good" />
        <StatTile ui={ui} label="MFI ratio gated / all" value={ratio ? `${ratio.toFixed(2)}×` : '—'} />
      </div>
      <p className={`mt-1 text-[11px] ${ui.muted}`}>
        {marker}: grey = all events, green = gated events (each normalised to its own mode). MFI is the median fluorescence intensity in arbitrary units.
      </p>
    </div>
  );
};

// ----------------------------------------------------------------------------
// GENERIC SCATTER (used by the compensation lab)
// ----------------------------------------------------------------------------

interface ScatterPoint {
  x: number;
  y: number;
  c: string;
}

interface RefLine {
  axis: 'x' | 'y';
  value: number;
  color: string;
  label?: string;
}

interface SimpleScatterProps {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  ticks: { pos: number; label: string }[];
  refLines?: RefLine[];
  height?: number;
  isLightMode: boolean;
}

const SimpleScatter: React.FC<SimpleScatterProps> = ({ points, xLabel, yLabel, ticks, refLines = [], height = 380, isLightMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const PAD = 44;
    const w = rect.width;
    const h = rect.height;
    const plotW = w - PAD * 1.5;
    const plotH = h - PAD * 1.5;
    const ox = PAD;
    const oy = h - PAD;
    const px = (v: number) => ox + (v / 100) * plotW;
    const py = (v: number) => oy - (v / 100) * plotH;

    ctx.fillStyle = isLightMode ? '#ffffff' : '#090d16';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = isLightMode ? '#e2e8f0' : '#1e293b';
    ctx.lineWidth = 1;
    ticks.forEach((t) => {
      ctx.beginPath();
      ctx.moveTo(px(t.pos), oy - plotH);
      ctx.lineTo(px(t.pos), oy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ox, py(t.pos));
      ctx.lineTo(ox + plotW, py(t.pos));
      ctx.stroke();
    });

    for (const p of points) {
      ctx.beginPath();
      ctx.arc(px(p.x), py(p.y), 1.9, 0, Math.PI * 2);
      ctx.fillStyle = p.c + 'b3';
      ctx.fill();
    }

    refLines.forEach((rl) => {
      ctx.strokeStyle = rl.color;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      if (rl.axis === 'y') {
        ctx.moveTo(ox, py(rl.value));
        ctx.lineTo(ox + plotW, py(rl.value));
      } else {
        ctx.moveTo(px(rl.value), oy - plotH);
        ctx.lineTo(px(rl.value), oy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      if (rl.label) {
        ctx.fillStyle = rl.color;
        ctx.font = 'bold 11px Inter, sans-serif';
        if (rl.axis === 'y') ctx.fillText(rl.label, ox + plotW - 150, py(rl.value) - 5);
        else ctx.fillText(rl.label, px(rl.value) + 5, oy - plotH + 14);
      }
    });

    ctx.strokeStyle = isLightMode ? '#64748b' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ox, oy - plotH, plotW, plotH);

    ctx.fillStyle = isLightMode ? '#475569' : '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ticks.forEach((t) => {
      ctx.fillText(t.label, px(t.pos) - 8, oy + 14);
      ctx.fillText(t.label, ox - 30, py(t.pos) + 3);
    });

    ctx.fillStyle = isLightMode ? '#0f172a' : '#f8fafc';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`${xLabel} →`, ox + plotW / 2 - 40, h - 8);
    ctx.save();
    ctx.translate(14, oy - plotH / 2 + 30);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${yLabel} →`, 0, 0);
    ctx.restore();
  }, [points, xLabel, yLabel, ticks, refLines, isLightMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height: `${height}px` }}
      className={`w-full rounded-xl border ${isLightMode ? 'border-slate-300 bg-white' : 'border-slate-800 bg-[#090d16]'}`}
    />
  );
};

// ----------------------------------------------------------------------------
// FLUORESCENCE COMPENSATION ENGINE
// ----------------------------------------------------------------------------

type CompPop = 'DN' | 'FITC' | 'PE';

interface CompEvent {
  pop: CompPop;
  obsF: number; // observed FITC (linear a.u.)
  obsP: number; // observed PE (linear a.u.)
}

interface SpilloverSpec {
  fitcIntoPe: number; // fraction, e.g. 0.25
  peIntoFitc: number;
}

function spilloverForSeed(seed: number): SpilloverSpec {
  const rng = createSeededRandom(seed * 7919 + 104729);
  for (let i = 0; i < 5; i++) rng(); // warm up the small-seed LCG
  return {
    fitcIntoPe: Math.round((0.16 + 0.2 * rng()) * 1000) / 1000,
    peIntoFitc: Math.round((0.02 + 0.07 * rng()) * 1000) / 1000
  };
}

// CD3-FITC / CD19-PE style tube: T cells FITC+, B cells PE+, no true double positives.
function generateCompensationData(seed: number, spill: SpilloverSpec): CompEvent[] {
  const rng = createSeededRandom(seed);
  const spec: { pop: CompPop; n: number; f: number; p: number }[] = [
    { pop: 'DN', n: 900, f: 150, p: 150 },
    { pop: 'FITC', n: 500, f: 25000, p: 150 },
    { pop: 'PE', n: 500, f: 150, p: 20000 }
  ];
  const out: CompEvent[] = [];
  for (const s of spec) {
    for (let i = 0; i < s.n; i++) {
      const [z0, z1] = generateGaussianPair(rng);
      const [z2, z3] = generateGaussianPair(rng);
      const trueF = s.f * Math.exp((s.f > 1000 ? 0.3 : 0.45) * z0);
      const trueP = s.p * Math.exp((s.p > 1000 ? 0.3 : 0.45) * z1);
      out.push({
        pop: s.pop,
        obsF: trueF + spill.peIntoFitc * trueP + 70 * z2,
        obsP: trueP + spill.fitcIntoPe * trueF + 70 * z3
      });
    }
  }
  return out;
}

// Biexponential-style (arcsinh) display so negative compensated values stay visible.
function biexDisplay(x: number): number {
  const f = (v: number) => Math.asinh(v / 150);
  const lo = f(-2000);
  const hi = f(100000);
  return clamp(((f(x) - lo) / (hi - lo)) * 100, 0, 100);
}

const COMP_TICKS: { pos: number; label: string }[] = [
  { pos: biexDisplay(-1000), label: '-10³' },
  { pos: biexDisplay(0), label: '0' },
  { pos: biexDisplay(1000), label: '10³' },
  { pos: biexDisplay(10000), label: '10⁴' },
  { pos: biexDisplay(100000), label: '10⁵' }
];

const COMP_TOLERANCE = 400; // linear a.u. median offset considered "aligned"

interface CompensationLabProps {
  ui: UI;
  isLight: boolean;
  onSolved: () => void;
}

const CompensationLab: React.FC<CompensationLabProps> = ({ ui, isLight, onSolved }) => {
  const [tubeSeed, setTubeSeed] = useState<number>(1);
  const [compFitcToPe, setCompFitcToPe] = useState<number>(0); // % of FITC subtracted from PE
  const [compPeToFitc, setCompPeToFitc] = useState<number>(0); // % of PE subtracted from FITC
  const [showTruth, setShowTruth] = useState<boolean>(false);

  const spill = useMemo(() => spilloverForSeed(tubeSeed), [tubeSeed]);
  const data = useMemo(() => generateCompensationData(tubeSeed * 5113, spill), [tubeSeed, spill]);

  const compensated = useMemo(
    () =>
      data.map((ev) => ({
        pop: ev.pop,
        cF: ev.obsF - (compPeToFitc / 100) * ev.obsP,
        cP: ev.obsP - (compFitcToPe / 100) * ev.obsF
      })),
    [data, compFitcToPe, compPeToFitc]
  );

  const metrics = useMemo(() => {
    const pick = (pop: CompPop, key: 'cF' | 'cP') => compensated.filter((e) => e.pop === pop).map((e) => e[key]);
    const medPeDn = median(pick('DN', 'cP'));
    const medPeFitc = median(pick('FITC', 'cP'));
    const medFitcDn = median(pick('DN', 'cF'));
    const medFitcPe = median(pick('PE', 'cF'));
    return {
      medPeDn,
      medPeFitc,
      medFitcDn,
      medFitcPe,
      dPe: medPeFitc - medPeDn,
      dFitc: medFitcPe - medFitcDn
    };
  }, [compensated]);

  const points = useMemo<ScatterPoint[]>(
    () =>
      compensated.map((e) => ({
        x: biexDisplay(e.cF),
        y: biexDisplay(e.cP),
        c: e.pop === 'DN' ? '#94a3b8' : e.pop === 'FITC' ? '#22c55e' : '#f97316'
      })),
    [compensated]
  );

  const refLines = useMemo<RefLine[]>(
    () => [
      { axis: 'y', value: biexDisplay(metrics.medPeDn), color: '#94a3b8', label: 'PE median: double-neg' },
      { axis: 'y', value: biexDisplay(metrics.medPeFitc), color: '#22c55e', label: 'PE median: FITC+ cells' },
      { axis: 'x', value: biexDisplay(metrics.medFitcDn), color: '#94a3b8' },
      { axis: 'x', value: biexDisplay(metrics.medFitcPe), color: '#f97316', label: 'FITC median: PE+ cells' }
    ],
    [metrics]
  );

  const peAligned = Math.abs(metrics.dPe) <= COMP_TOLERANCE;
  const fitcAligned = Math.abs(metrics.dFitc) <= COMP_TOLERANCE;

  useEffect(() => {
    if (peAligned && fitcAligned && compFitcToPe > 0) onSolved();
  }, [peAligned, fitcAligned, compFitcToPe, onSolved]);

  const verdict = (aligned: boolean, d: number): { text: string; tone: string } => {
    if (aligned) return { text: 'Aligned ✓', tone: 'text-emerald-500' };
    return d > 0 ? { text: 'Under-compensated', tone: 'text-amber-500' } : { text: 'Over-compensated', tone: 'text-rose-500' };
  };
  const vPe = verdict(peAligned, metrics.dPe);
  const vFitc = verdict(fitcAligned, metrics.dFitc);

  const newTube = () => {
    setTubeSeed((s) => s + 1);
    setCompFitcToPe(0);
    setCompPeToFitc(0);
    setShowTruth(false);
  };

  const autoSet = () => {
    setCompFitcToPe(Math.round(spill.fitcIntoPe * 200) / 2);
    setCompPeToFitc(Math.round(spill.peIntoFitc * 200) / 2);
  };

  return (
    <div className="space-y-4">
      <div className={`${ui.card} p-4`}>
        <h2 className="text-lg font-bold">Fluorescence Compensation Lab</h2>
        <p className={`mt-1 text-sm ${ui.soft}`}>
          FITC emission spills into the PE detector. In this single-stain-style tube (CD3-FITC T cells, CD19-PE B cells, and no true double positives), any diagonal smear
          is spillover, not biology. Adjust the sliders until the median PE of the FITC⁺ cells sits level with the double-negative cells (and the same for FITC on the PE⁺ cells).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${ui.card} p-4 lg:col-span-2`}>
          <SimpleScatter
            points={points}
            xLabel="FITC-A (CD3)"
            yLabel="PE-A (CD19)"
            ticks={COMP_TICKS}
            refLines={refLines}
            isLightMode={isLight}
          />
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />Double-negative</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />FITC⁺ (T cells)</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />PE⁺ (B cells)</span>
          </div>
        </div>

        <div className={`${ui.card} space-y-4 p-4`}>
          <div>
            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
              <span>% FITC − %PE (FITC spill into PE)</span>
              <span className="font-mono text-cyan-500">{compFitcToPe.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={0.5}
              value={compFitcToPe}
              onChange={(e) => setCompFitcToPe(Number(e.target.value))}
              className="w-full"
            />
            <div className={`text-xs ${vPe.tone}`}>
              {vPe.text} · PE offset of FITC⁺ cells: {formatIntensity(metrics.dPe)}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-sm font-semibold">
              <span>% PE − %FITC (PE spill into FITC)</span>
              <span className="font-mono text-cyan-500">{compPeToFitc.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={0.5}
              value={compPeToFitc}
              onChange={(e) => setCompPeToFitc(Number(e.target.value))}
              className="w-full"
            />
            <div className={`text-xs ${vFitc.tone}`}>
              {vFitc.text} · FITC offset of PE⁺ cells: {formatIntensity(metrics.dFitc)}
            </div>
          </div>

          <div
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              peAligned && fitcAligned && compFitcToPe > 0 ? 'bg-emerald-600/20 text-emerald-500' : ui.subtle
            }`}
          >
            {peAligned && fitcAligned && compFitcToPe > 0
              ? 'Compensated: both medians align. Spillover removed.'
              : 'Goal: make the dashed median lines level with each other.'}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowTruth((v) => !v)} className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
              {showTruth ? 'Hide' : 'Reveal'} true spillover
            </button>
            <button onClick={autoSet} className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
              Auto-compensate
            </button>
            <button
              onClick={() => {
                setCompFitcToPe(0);
                setCompPeToFitc(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}
            >
              Reset sliders
            </button>
            <button onClick={newTube} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500">
              New tube (new spillover)
            </button>
          </div>

          {showTruth && (
            <div className={`rounded-xl p-3 text-xs ${ui.subtle}`}>
              True spillover this tube: FITC → PE = <b>{(spill.fitcIntoPe * 100).toFixed(1)}%</b>, PE → FITC = <b>{(spill.peIntoFitc * 100).toFixed(1)}%</b>.
            </div>
          )}

          <ul className={`list-disc space-y-1 pl-4 text-xs ${ui.muted}`}>
            <li>Under-compensation leaves FITC⁺ cells floating above the negatives in PE (false double positives).</li>
            <li>Over-compensation pushes them below zero, squashing the population onto the axis.</li>
            <li>Always set compensation from single-stained controls, never from the patient tube.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODULE: GATING LAB (back-gating, contour / zebra, histogram + MFI)
// ----------------------------------------------------------------------------

interface LabProps {
  ui: UI;
  isLight: boolean;
  cases: ClinicalCase[];
}

interface GatingLabProps extends LabProps {
  onGateCreated: () => void;
}

const GatingLab: React.FC<GatingLabProps> = ({ ui, isLight, cases, onGateCreated }) => {
  const [caseIdx, setCaseIdx] = useState<number>(0);
  const labCase = cases[caseIdx] ?? cases[0];
  const events = useMemo(() => generateEventsFromClusters(labCase.clusters, labCase.number * 131 + 5), [labCase]);

  const [xAxis, setXAxis] = useState<MarkerName>('CD45');
  const [yAxis, setYAxis] = useState<MarkerName>('SSC-A');
  const [x2, setX2] = useState<MarkerName>('CD19');
  const [y2, setY2] = useState<MarkerName>('CD10');
  const [histMarker, setHistMarker] = useState<MarkerName>('CD34');
  const [scale, setScale] = useState<ScaleMode>('biexp');
  const [colorMode, setColorMode] = useState<ColorMode>('population');
  const [gateTool, setGateTool] = useState<GateTool>('none');
  const [gate, setGate] = useState<CustomGate | null>(null);
  const [gateName, setGateName] = useState<string>('Gate P1');
  const [backgate, setBackgate] = useState<boolean>(false);
  const [quad1, setQuad1] = useState<Point2D>({ x: 50, y: 50 });
  const [quad2, setQuad2] = useState<Point2D>({ x: 50, y: 50 });
  const [pops, setPops] = useState<Record<PopulationType, boolean>>(ALL_POPS_ON);

  useEffect(() => {
    setGate(null);
    setBackgate(false);
    setGateTool('none');
  }, [caseIdx]);

  const gated = useMemo(() => (gate ? events.filter((ev) => isEventInsideGate(ev, gate)) : null), [events, gate]);
  const backgateFilter = useMemo(() => (backgate ? (ev: SimulatedEvent) => ev.populationType === 'Blasts' : null), [backgate]);

  const gateStats = useMemo(() => {
    if (!gated) return null;
    const totalBlasts = events.filter((e) => e.populationType === 'Blasts').length;
    const blastInside = gated.filter((e) => e.populationType === 'Blasts').length;
    return {
      inside: gated.length,
      pctOfTotal: pct(gated.length, events.length),
      purity: pct(blastInside, gated.length),
      recall: pct(blastInside, totalBlasts)
    };
  }, [gated, events]);

  const plot2Events = gated ?? events;

  return (
    <div className="space-y-4">
      <div className={`${ui.card} p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">Gating Lab</h2>
          <label className="flex items-center gap-1.5 text-xs">
            <span className={ui.muted}>Sample</span>
            <select value={caseIdx} onChange={(e) => setCaseIdx(Number(e.target.value))} className={`rounded-lg px-2 py-1 text-xs ${ui.input}`}>
              {cases.map((c, i) => (
                <option key={c.id} value={i}>
                  #{c.number} {c.title}
                </option>
              ))}
            </select>
          </label>
          <AxisSelect ui={ui} label="Plot 1 X" value={xAxis} onChange={setXAxis} />
          <AxisSelect ui={ui} label="Y" value={yAxis} onChange={setYAxis} />
          <select value={scale} onChange={(e) => setScale(e.target.value as ScaleMode)} className={`rounded-lg px-2 py-1 text-xs ${ui.input}`}>
            <option value="biexp">Biexponential</option>
            <option value="linear">Linear</option>
          </select>
          <select value={colorMode} onChange={(e) => setColorMode(e.target.value as ColorMode)} className={`rounded-lg px-2 py-1 text-xs ${ui.input}`}>
            <option value="population">Population colours</option>
            <option value="density">Pseudocolour density</option>
            <option value="contour">Contour rings</option>
            <option value="zebra">Zebra</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(['none', 'rect', 'polygon'] as GateTool[]).map((tool) => (
            <button
              key={tool}
              onClick={() => setGateTool(tool)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${gateTool === tool ? 'bg-cyan-600 text-white' : ui.btn}`}
            >
              {tool === 'none' ? 'Move quadrants' : tool === 'rect' ? 'Rectangle gate' : 'Polygon gate'}
            </button>
          ))}
          <input
            value={gateName}
            onChange={(e) => setGateName(e.target.value)}
            placeholder="Gate name"
            className={`w-32 rounded-lg px-2 py-1.5 text-xs ${ui.input}`}
          />
          {gate && (
            <button onClick={() => setGate(null)} className="rounded-lg bg-rose-600/20 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-600/30">
              Clear gate
            </button>
          )}
          <button
            onClick={() => setBackgate((v) => !v)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${backgate ? 'bg-pink-600 text-white' : ui.btn}`}
          >
            {backgate ? 'Back-gate ON (abnormal cells highlighted)' : 'Back-gate abnormal cells'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {TOGGLE_POPULATIONS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPops((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${pops[p.key] ? ui.btn : 'border border-dashed opacity-50 ' + ui.btn}`}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${ui.card} p-4`}>
          <div className="mb-2 text-sm font-bold">
            Plot 1: all events ({events.length.toLocaleString()} cells) · {xAxis} vs {yAxis}
          </div>
          <p className={`mb-2 text-xs ${ui.muted}`}>
            {gateTool === 'none'
              ? 'Drag the crosshair to move quadrants.'
              : gateTool === 'rect'
              ? 'Click and drag to draw a rectangle gate.'
              : 'Click vertices, then click the first (green) vertex or press Finish.'}
          </p>
          <DotPlotCanvas
            isLightMode={isLight}
            events={events}
            xAxis={xAxis}
            yAxis={yAxis}
            quadrantX={quad1.x}
            quadrantY={quad1.y}
            onQuadrantChange={(qx, qy) => setQuad1({ x: qx, y: qy })}
            showQuadrants={gateTool === 'none'}
            scaleMode={scale}
            colorMode={colorMode}
            activePopulations={pops}
            backgateFilter={backgateFilter}
            gateMode={gateTool}
            existingGate={gate}
            onCreateGate={(pts, type) => {
              setGate({ id: 'g-1', name: gateName || 'Gate', type, xAxis, yAxis, points: pts, color: '#10b981' });
              setGateTool('none');
              onGateCreated();
            }}
          />
        </div>

        <div className={`${ui.card} p-4`}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="text-sm font-bold">
              Plot 2: {gate ? `gated on "${gate.name}" (${gated?.length.toLocaleString()} cells)` : 'no gate yet (showing all events)'}
            </div>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <AxisSelect ui={ui} label="X" value={x2} onChange={setX2} />
            <AxisSelect ui={ui} label="Y" value={y2} onChange={setY2} />
            {labCase.tubes.map((t, i) => (
              <button
                key={t.id}
                onClick={() => {
                  setX2(t.xAxis);
                  setY2(t.yAxis);
                }}
                className={`rounded-lg px-2 py-1 text-[11px] ${ui.btn}`}
                title={t.name}
              >
                Tube {i + 1}
              </button>
            ))}
          </div>
          <DotPlotCanvas
            isLightMode={isLight}
            events={plot2Events}
            xAxis={x2}
            yAxis={y2}
            quadrantX={quad2.x}
            quadrantY={quad2.y}
            onQuadrantChange={(qx, qy) => setQuad2({ x: qx, y: qy })}
            scaleMode={scale}
            colorMode={colorMode}
            activePopulations={pops}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${ui.card} p-4`}>
          <div className="mb-2 text-sm font-bold">Gate statistics</div>
          {gateStats ? (
            <div className="grid grid-cols-2 gap-2">
              <StatTile ui={ui} label="Events in gate" value={gateStats.inside.toLocaleString()} />
              <StatTile ui={ui} label="% of all events" value={`${gateStats.pctOfTotal}%`} />
              <StatTile ui={ui} label="Abnormal-cell purity" value={`${gateStats.purity}%`} tone={Number(gateStats.purity) >= 85 ? 'good' : 'warn'} />
              <StatTile ui={ui} label="Abnormal-cell recovery" value={`${gateStats.recall}%`} tone={Number(gateStats.recall) >= 85 ? 'good' : 'warn'} />
            </div>
          ) : (
            <p className={`text-sm ${ui.muted}`}>Draw a rectangle or polygon gate on Plot 1 to see purity and recovery of the abnormal population.</p>
          )}
        </div>

        <div className={`${ui.card} p-4 lg:col-span-2`}>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <div className="text-sm font-bold">Histogram & MFI</div>
            <AxisSelect ui={ui} label="Marker" value={histMarker} onChange={setHistMarker} />
          </div>
          <HistogramPanel ui={ui} isLightMode={isLight} allEvents={events} gatedEvents={gated} marker={histMarker} />
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODULE: SINGLET (DOUBLET) DISCRIMINATION
// ----------------------------------------------------------------------------

const IDEAL_SINGLET_POLYGON: Point2D[] = [
  { x: 1, y: 0.85 },
  { x: 99, y: 84.2 },
  { x: 99, y: 99 },
  { x: 1, y: 1.01 }
];

interface SingletLabProps extends LabProps {
  onPassed: () => void;
}

const SingletLab: React.FC<SingletLabProps> = ({ ui, isLight, cases, onPassed }) => {
  const [caseIdx, setCaseIdx] = useState<number>(0);
  const labCase = cases[caseIdx] ?? cases[0];
  const events = useMemo(() => generateEventsFromClusters(labCase.clusters, labCase.number * 131 + 5, 0.12), [labCase]);

  const [gateTool, setGateTool] = useState<GateTool>('polygon');
  const [gate, setGate] = useState<CustomGate | null>(null);
  const [reveal, setReveal] = useState<boolean>(false);
  const [quad, setQuad] = useState<Point2D>({ x: 50, y: 50 });

  useEffect(() => {
    setGate(null);
  }, [caseIdx]);

  const revealFilter = useMemo(() => (reveal ? (ev: SimulatedEvent) => !!ev.isDoublet : null), [reveal]);

  const stats = useMemo(() => {
    const doublets = events.filter((e) => e.isDoublet);
    const singlets = events.length - doublets.length;
    if (!gate) return { doublets: doublets.length, singlets, retained: null, excluded: null, gated: null as SimulatedEvent[] | null };
    const inside = events.filter((e) => isEventInsideGate(e, gate));
    const singletsInside = inside.filter((e) => !e.isDoublet).length;
    const doubletsInside = inside.length - singletsInside;
    return {
      doublets: doublets.length,
      singlets,
      retained: singlets ? singletsInside / singlets : 0,
      excluded: doublets.length ? 1 - doubletsInside / doublets.length : 1,
      gated: inside
    };
  }, [events, gate]);

  const passed = stats.retained !== null && stats.excluded !== null && stats.retained >= 0.9 && stats.excluded >= 0.85;

  useEffect(() => {
    if (passed) onPassed();
  }, [passed, onPassed]);

  const blastWindowPct = (evs: SimulatedEvent[]): string => {
    const inWindow = evs.filter((e) => {
      const w = labCase.expectedBlastGate;
      const cd45 = e.values['CD45'];
      const ssc = e.values['SSC-A'];
      return cd45 >= w.cd45Min && cd45 <= w.cd45Max && ssc >= w.sscMin && ssc <= w.sscMax;
    }).length;
    return pct(inWindow, evs.length);
  };

  return (
    <div className="space-y-4">
      <div className={`${ui.card} p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">Singlet Discrimination (FSC-A vs FSC-H)</h2>
          <label className="flex items-center gap-1.5 text-xs">
            <span className={ui.muted}>Sample</span>
            <select value={caseIdx} onChange={(e) => setCaseIdx(Number(e.target.value))} className={`rounded-lg px-2 py-1 text-xs ${ui.input}`}>
              {cases.map((c, i) => (
                <option key={c.id} value={i}>
                  #{c.number} {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className={`mt-2 text-sm ${ui.soft}`}>
          A single cell produces a pulse whose area and height rise together, so singlets form a diagonal (height ≈ 0.9 × area). Two cells passing together make a wider pulse:
          the area grows but the height does not, so doublets fall <b>below</b> the diagonal. Draw a gate that keeps the diagonal band and excludes everything beneath it, before you look at CD45 vs SSC.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${ui.card} p-4`}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="text-sm font-bold">FSC-A vs FSC-H ({events.length.toLocaleString()} events)</div>
            {(['rect', 'polygon'] as GateTool[]).map((tool) => (
              <button
                key={tool}
                onClick={() => setGateTool(tool)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${gateTool === tool ? 'bg-cyan-600 text-white' : ui.btn}`}
              >
                {tool === 'rect' ? 'Rectangle' : 'Polygon'}
              </button>
            ))}
          </div>
          <DotPlotCanvas
            isLightMode={isLight}
            events={events}
            xAxis="FSC-A"
            yAxis="FSC-H"
            quadrantX={quad.x}
            quadrantY={quad.y}
            onQuadrantChange={(qx, qy) => setQuad({ x: qx, y: qy })}
            showQuadrants={false}
            scaleMode="linear"
            colorMode="density"
            backgateFilter={revealFilter}
            gateMode={gateTool}
            existingGate={gate}
            onCreateGate={(pts, type) => {
              setGate({ id: 'singlet', name: 'Singlets', type, xAxis: 'FSC-A', yAxis: 'FSC-H', points: pts, color: '#10b981' });
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setGate({ id: 'singlet', name: 'Singlets', type: 'polygon', xAxis: 'FSC-A', yAxis: 'FSC-H', points: IDEAL_SINGLET_POLYGON, color: '#10b981' })}
              className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}
            >
              Show an ideal singlet gate
            </button>
            <button onClick={() => setGate(null)} className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
              Clear gate
            </button>
            <button
              onClick={() => setReveal((v) => !v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${reveal ? 'bg-pink-600 text-white' : ui.btn}`}
            >
              {reveal ? 'Doublets revealed' : 'Reveal doublets'}
            </button>
          </div>
        </div>

        <div className={`${ui.card} space-y-3 p-4`}>
          <div className="text-sm font-bold">Gate quality</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile ui={ui} label="Doublets in sample" value={`${stats.doublets} (${pct(stats.doublets, events.length)}%)`} />
            <StatTile
              ui={ui}
              label="Singlets kept"
              value={stats.retained === null ? '—' : `${(stats.retained * 100).toFixed(1)}%`}
              tone={stats.retained === null ? 'neutral' : stats.retained >= 0.9 ? 'good' : 'warn'}
            />
            <StatTile
              ui={ui}
              label="Doublets removed"
              value={stats.excluded === null ? '—' : `${(stats.excluded * 100).toFixed(1)}%`}
              tone={stats.excluded === null ? 'neutral' : stats.excluded >= 0.85 ? 'good' : 'bad'}
            />
            <StatTile ui={ui} label="Result" value={!gate ? '—' : passed ? 'Pass ✓' : 'Refine'} tone={!gate ? 'neutral' : passed ? 'good' : 'warn'} />
          </div>
          <p className={`text-xs ${ui.muted}`}>Pass requires keeping ≥ 90% of singlets while removing ≥ 85% of doublets.</p>
          {gate && !passed && stats.retained !== null && stats.excluded !== null && (
            <p className="text-xs text-amber-500">
              {stats.retained < 0.9
                ? 'You are cutting away real singlets. Widen the band along the diagonal, especially at the low and high ends.'
                : 'Doublets are leaking into your gate. Pull the lower edge of the band up toward the diagonal.'}
            </p>
          )}
          <div className={`rounded-xl p-3 text-xs ${ui.subtle}`}>
            Why it matters: doublets have inflated FSC and SSC, so they can land inside or next to the blast window and inflate blast percentages, and at MRD sensitivity (10⁻⁴) they
            create false events.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${ui.card} p-4`}>
          <div className="mb-2 text-sm font-bold">
            CD45 vs SSC-A: without singlet gate · {blastWindowPct(events)}% of events in the expected window
          </div>
          <DotPlotCanvas isLightMode={isLight} events={events} xAxis="CD45" yAxis="SSC-A" showQuadrants={false} scaleMode="biexp" colorMode="density" backgateFilter={revealFilter} highlightBlastBox={{ xMin: labCase.expectedBlastGate.cd45Min, xMax: labCase.expectedBlastGate.cd45Max, yMin: labCase.expectedBlastGate.sscMin, yMax: labCase.expectedBlastGate.sscMax }} />
        </div>
        <div className={`${ui.card} p-4`}>
          <div className="mb-2 text-sm font-bold">
            CD45 vs SSC-A: after singlet gate {stats.gated ? `· ${blastWindowPct(stats.gated)}% in window` : ''}
          </div>
          {stats.gated ? (
            <DotPlotCanvas isLightMode={isLight} events={stats.gated} xAxis="CD45" yAxis="SSC-A" showQuadrants={false} scaleMode="biexp" colorMode="density" highlightBlastBox={{ xMin: labCase.expectedBlastGate.cd45Min, xMax: labCase.expectedBlastGate.cd45Max, yMin: labCase.expectedBlastGate.sscMin, yMax: labCase.expectedBlastGate.sscMax }} />
          ) : (
            <div className={`flex h-[380px] items-center justify-center rounded-xl text-sm ${ui.subtle} ${ui.muted}`}>Draw a singlet gate to see the cleaned CD45 vs SSC plot.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODULE: MARKER GLOSSARY
// ----------------------------------------------------------------------------

const GlossaryModule: React.FC<{ ui: UI }> = ({ ui }) => {
  const items = useMemo(() => Object.values(GLOSSARY_DB), []);
  const [query, setQuery] = useState<string>('');
  const [selected, setSelected] = useState<string>(items[0]?.marker ?? '');

  const filtered = items.filter((g) => `${g.marker} ${g.fullName}`.toLowerCase().includes(query.toLowerCase()));
  const item = GLOSSARY_DB[selected];
  const usedIn = CLINICAL_CASES.filter((c) => c.keyMarkersToInterpret.some((k) => k.marker === selected));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className={`${ui.card} p-4`}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markers..."
          className={`mb-3 w-full rounded-lg px-3 py-2 text-sm ${ui.input}`}
        />
        <div className="flex max-h-[520px] flex-wrap gap-2 overflow-y-auto">
          {filtered.map((g) => (
            <button
              key={g.marker}
              onClick={() => setSelected(g.marker)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${selected === g.marker ? 'bg-cyan-600 text-white' : ui.btn}`}
            >
              {g.marker}
            </button>
          ))}
          {filtered.length === 0 && <span className={`text-sm ${ui.muted}`}>No matching markers.</span>}
        </div>
      </div>

      <div className={`${ui.card} space-y-3 p-5 lg:col-span-2`}>
        {item ? (
          <>
            <div>
              <h2 className="text-xl font-bold">{item.marker}</h2>
              <div className={`text-sm ${ui.soft}`}>{item.fullName}</div>
              <div className="mt-2 flex gap-2 text-xs">
                <span className="rounded-full bg-cyan-600/20 px-2.5 py-1 text-cyan-500">{item.compartment}</span>
                <span className="rounded-full bg-violet-600/20 px-2.5 py-1 text-violet-500">{item.category}</span>
              </div>
            </div>
            <div>
              <div className={`text-xs font-semibold uppercase ${ui.muted}`}>Biological role</div>
              <p className="text-sm">{item.role}</p>
            </div>
            <div>
              <div className={`text-xs font-semibold uppercase ${ui.muted}`}>Normal expression</div>
              <p className="text-sm">{item.normalExpression}</p>
            </div>
            <div>
              <div className={`text-xs font-semibold uppercase ${ui.muted}`}>Relevance in leukaemia / lymphoma</div>
              <p className="text-sm">{item.leukemiaRelevance}</p>
            </div>
            {usedIn.length > 0 && (
              <div>
                <div className={`text-xs font-semibold uppercase ${ui.muted}`}>Interpreted in cases</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {usedIn.map((c) => (
                    <span key={c.id} className={`rounded-lg px-2 py-1 text-xs ${ui.subtle}`}>
                      #{c.number} {c.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className={ui.muted}>Select a marker.</p>
        )}
      </div>
    </div>
  );
};


// ============================================================================
// 9. CLINICAL CASE SIMULATOR (diagnostic workflow, OSCE, bilingual, case builder)
// ============================================================================

interface CaseResult {
  gateF1: number; // 0-1
  recall: number;
  purity: number;
  markerPct: number; // 0-1
  diagnosisCorrect: boolean;
  totalScore: number; // 0-100
}

const EXPRESSION_LEVELS: ExpressionLevel[] = ['Negative', 'Dim', 'Positive', 'Bright'];

function speakExplanation(text: string, lang: 'en-US' | 'ar-EG') {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      utter.rate = 0.98;
      window.speechSynthesis.speak(utter);
    }
  } catch {
    // speech synthesis may be restricted
  }
}

function arabicFor(caseId: string): { summary: string; pearl: string } | undefined {
  return ARABIC_CASE_EXPLANATIONS[caseId] ?? ARABIC_CASE_EXPLANATIONS[caseId.replace(/^custom-\d+-/, '')];
}

interface CaseBuilderModalProps {
  ui: UI;
  customCases: ClinicalCase[];
  setCustomCases: React.Dispatch<React.SetStateAction<ClinicalCase[]>>;
  onCreated: (newIndex: number) => void;
  onClose: () => void;
}

const PRESETS: { key: string; label: string; baseId: string }[] = [
  { key: 'B-ALL', label: 'B-ALL (common)', baseId: 'case-1' },
  { key: 'APL-M3', label: 'APL / AML-M3', baseId: 'case-2' },
  { key: 'CLL', label: 'CLL', baseId: 'case-11' }
];

const CaseBuilderModal: React.FC<CaseBuilderModalProps> = ({ ui, customCases, setCustomCases, onCreated, onClose }) => {
  const [preset, setPreset] = useState<string>('B-ALL');
  const [title, setTitle] = useState<string>('Custom B-ALL Teaching Case');
  const [age, setAge] = useState<string>('9 years old');
  const [vignette, setVignette] = useState<string>('Custom patient presenting with cytopenias and circulating blasts.');
  const [blastCount, setBlastCount] = useState<number>(1400);
  const [ioText, setIoText] = useState<string>('');
  const [ioMessage, setIoMessage] = useState<string>('');

  const create = () => {
    const base = CLINICAL_CASES.find((c) => c.id === (PRESETS.find((p) => p.key === preset)?.baseId ?? 'case-1')) ?? CLINICAL_CASES[0];
    const clone: ClinicalCase = JSON.parse(JSON.stringify(base));
    const serial = customCases.length + 1;
    clone.id = `custom-${Date.now()}-${base.id}`;
    clone.number = 100 + serial;
    clone.title = title.trim() || `Custom case ${serial}`;
    clone.patientAge = age;
    clone.clinicalVignette = vignette;
    clone.clusters = clone.clusters.map((cl) => (cl.populationType === 'Blasts' ? { ...cl, count: blastCount } : cl));
    setCustomCases((prev) => [...prev, clone]);
    onCreated(CLINICAL_CASES.length + customCases.length);
    onClose();
  };

  const exportJson = () => {
    setIoText(JSON.stringify(customCases, null, 2));
    setIoMessage(customCases.length ? `Exported ${customCases.length} case(s). Copy the JSON below.` : 'No custom cases to export yet.');
  };

  const importJson = () => {
    try {
      const parsed: unknown = JSON.parse(ioText);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array of cases');
      const valid = parsed.filter(
        (p): p is ClinicalCase =>
          !!p && typeof p.id === 'string' && typeof p.title === 'string' && Array.isArray(p.clusters) && Array.isArray(p.tubes) && Array.isArray(p.keyMarkersToInterpret)
      );
      if (valid.length === 0) throw new Error('No valid cases found');
      const stamped = valid.map((c, i) => ({ ...c, id: `custom-${Date.now()}-${i}-${c.id}`, number: 100 + customCases.length + i + 1 }));
      setCustomCases((prev) => [...prev, ...stamped]);
      setIoMessage(`Imported ${stamped.length} case(s).`);
    } catch (err) {
      setIoMessage(`Import failed: ${err instanceof Error ? err.message : 'invalid JSON'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 ${ui.page} border border-slate-700`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Professor Mode: Custom Case Builder</h3>
          <button onClick={onClose} className={`rounded-lg px-3 py-1 text-sm ${ui.btn}`}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className={ui.muted}>Template</span>
            <select value={preset} onChange={(e) => setPreset(e.target.value)} className={`mt-1 w-full rounded-lg px-2 py-2 text-sm ${ui.input}`}>
              {PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className={ui.muted}>Patient age</span>
            <input value={age} onChange={(e) => setAge(e.target.value)} className={`mt-1 w-full rounded-lg px-2 py-2 text-sm ${ui.input}`} />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className={ui.muted}>Case title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={`mt-1 w-full rounded-lg px-2 py-2 text-sm ${ui.input}`} />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className={ui.muted}>Clinical vignette</span>
            <textarea value={vignette} onChange={(e) => setVignette(e.target.value)} rows={3} className={`mt-1 w-full rounded-lg px-2 py-2 text-sm ${ui.input}`} />
          </label>
          <label className="text-xs sm:col-span-2">
            <span className={ui.muted}>Abnormal-cell events: {blastCount}</span>
            <input type="range" min={100} max={2500} step={50} value={blastCount} onChange={(e) => setBlastCount(Number(e.target.value))} className="mt-1 w-full" />
          </label>
        </div>
        <button onClick={create} className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
          Create case
        </button>

        <hr className="my-4 border-slate-700" />
        <div className="mb-2 text-sm font-bold">Import / export cases (JSON)</div>
        <textarea
          value={ioText}
          onChange={(e) => setIoText(e.target.value)}
          rows={6}
          placeholder="Paste exported JSON here to import..."
          className={`w-full rounded-lg px-2 py-2 font-mono text-xs ${ui.input}`}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick={exportJson} className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
            Export custom cases
          </button>
          <button onClick={importJson} className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
            Import from text
          </button>
          {ioMessage && <span className={`text-xs ${ui.muted}`}>{ioMessage}</span>}
        </div>
      </div>
    </div>
  );
};

interface CaseSimulatorProps {
  ui: UI;
  isLight: boolean;
  cases: ClinicalCase[];
  customCases: ClinicalCase[];
  setCustomCases: React.Dispatch<React.SetStateAction<ClinicalCase[]>>;
  solvedIds: string[];
  onSolved: (caseId: string) => void;
}

const CaseSimulator: React.FC<CaseSimulatorProps> = ({ ui, isLight, cases, customCases, setCustomCases, solvedIds, onSolved }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const currentCase = cases[selectedIdx] ?? cases[0];
  const caseEvents = useMemo(() => generateEventsFromClusters(currentCase.clusters, currentCase.number * 777), [currentCase]);

  const gateTubeIndex = useMemo(() => {
    const i = currentCase.tubes.findIndex((t) => t.xAxis === 'CD45' && t.yAxis === 'SSC-A');
    return i >= 0 ? i : 0;
  }, [currentCase]);

  const [activeTube, setActiveTube] = useState<number>(0);
  const [gateTool, setGateTool] = useState<GateTool>('none');
  const [userGate, setUserGate] = useState<CustomGate | null>(null);
  const [quad, setQuad] = useState<Point2D>({ x: 50, y: 50 });
  const [showColors, setShowColors] = useState<boolean>(false);
  const [markerAnswers, setMarkerAnswers] = useState<Record<string, ExpressionLevel>>({});
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [result, setResult] = useState<CaseResult | null>(null);
  const [showReport, setShowReport] = useState<boolean>(false);
  const [lang, setLang] = useState<'EN' | 'AR'>('EN');
  const [osce, setOsce] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [showBuilder, setShowBuilder] = useState<boolean>(false);

  // Reset the workspace whenever the case changes
  useEffect(() => {
    setActiveTube(gateTubeIndex);
    setGateTool('none');
    setUserGate(null);
    setMarkerAnswers({});
    setDiagnosis('');
    setResult(null);
    setShowReport(false);
    setShowColors(false);
    setTimeLeft(180);
  }, [currentCase, gateTubeIndex]);

  useEffect(() => {
    setTimeLeft(180);
  }, [osce]);

  // OSCE countdown
  useEffect(() => {
    if (!osce || result) return;
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [osce, result]);

  const tube = currentCase.tubes[activeTube] ?? currentCase.tubes[0];
  const isGateTube = activeTube === gateTubeIndex;

  const gatedEvents = useMemo(() => (userGate ? caseEvents.filter((ev) => isEventInsideGate(ev, userGate)) : null), [caseEvents, userGate]);
  const plotEvents = isGateTube ? caseEvents : gatedEvents ?? caseEvents;

  const submitCase = () => {
    if (result) return;
    let recall = 0;
    let purity = 0;
    let f1 = 0;
    const totalBlasts = caseEvents.filter((e) => e.populationType === 'Blasts').length;
    if (userGate && totalBlasts > 0) {
      let inside = 0;
      let blastInside = 0;
      for (const ev of caseEvents) {
        if (isEventInsideGate(ev, userGate)) {
          inside++;
          if (ev.populationType === 'Blasts') blastInside++;
        }
      }
      recall = blastInside / totalBlasts;
      purity = inside ? blastInside / inside : 0;
      f1 = recall + purity > 0 ? (2 * recall * purity) / (recall + purity) : 0;
    }

    let pts = 0;
    for (const km of currentCase.keyMarkersToInterpret) {
      const answer = markerAnswers[km.marker];
      if (!answer) continue;
      const diff = Math.abs(EXPRESSION_LEVELS.indexOf(answer) - EXPRESSION_LEVELS.indexOf(km.expected));
      pts += diff === 0 ? 1 : diff === 1 ? 0.5 : 0;
    }
    const markerPct = currentCase.keyMarkersToInterpret.length ? pts / currentCase.keyMarkersToInterpret.length : 0;
    const diagnosisCorrect = diagnosis === currentCase.correctDiagnosis;
    const totalScore = Math.round(100 * (0.4 * f1 + 0.3 * markerPct + (diagnosisCorrect ? 0.3 : 0)));

    setResult({ gateF1: f1, recall, purity, markerPct, diagnosisCorrect, totalScore });
    if (diagnosisCorrect) onSolved(currentCase.id);
  };

  // Auto-submit when the OSCE timer expires
  useEffect(() => {
    if (osce && !result && timeLeft === 0) submitCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, osce, result]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  const arabic = arabicFor(currentCase.id);
  const explanationEN = `${currentCase.whoExplanation} ${currentCase.keyTakeaway}`;
  const explanationAR = arabic ? `${arabic.summary} ${arabic.pearl}` : '';

  const colorMode: ColorMode = result || (showColors && !osce) ? 'population' : 'density';
  const showBox = !!result && isGateTube && tube.xAxis === 'CD45' && tube.yAxis === 'SSC-A';
  const eg = currentCase.expectedBlastGate;

  const gateReady = !!userGate;
  const markersAnswered = Object.keys(markerAnswers).length;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className={`${ui.card} p-4`}>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">Clinical Case Simulator</h2>
          <select value={selectedIdx} onChange={(e) => setSelectedIdx(Number(e.target.value))} className={`max-w-xs rounded-lg px-2 py-1.5 text-sm ${ui.input}`}>
            {cases.map((c, i) => (
              <option key={c.id} value={i}>
                {solvedIds.includes(c.id) ? '✓ ' : ''}#{c.number} {c.title} ({c.difficulty})
              </option>
            ))}
          </select>
          <button
            onClick={() => setOsce((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${osce ? 'bg-rose-600 text-white' : ui.btn}`}
          >
            {osce ? 'OSCE exam ON (no hints)' : 'OSCE exam mode'}
          </button>
          {osce && (
            <span className={`rounded-lg px-3 py-1 font-mono text-sm font-bold ${timeLeft <= 30 ? 'bg-rose-600/20 text-rose-500' : ui.subtle}`}>
              {mm}:{ss}
            </span>
          )}
          <div className="flex overflow-hidden rounded-lg border border-slate-600/50 text-xs">
            {(['EN', 'AR'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 ${lang === l ? 'bg-cyan-600 text-white' : ui.btn}`}>
                {l === 'EN' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowBuilder(true)} className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
            Case builder
          </button>
        </div>
      </div>

      {/* Patient info */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${ui.card} space-y-2 p-4 lg:col-span-2`}>
          <div className="text-xs font-semibold uppercase text-cyan-500">
            {currentCase.category} · {currentCase.patientAge} · {currentCase.patientSex}
          </div>
          <p className="text-sm">{currentCase.clinicalVignette}</p>
          <p className={`text-sm ${ui.soft}`}>
            <b>Morphology:</b> {currentCase.morphologyDescription}
          </p>
          <p className={`text-sm ${ui.soft}`}>
            <b>Cytogenetics / molecular:</b> {currentCase.cytogenetics}
          </p>
        </div>
        <div className={`${ui.card} p-4`}>
          <div className="mb-2 text-sm font-bold">CBC & marrow</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <StatTile ui={ui} label="WBC" value={currentCase.cbc.wbc} />
            <StatTile ui={ui} label="Hb" value={currentCase.cbc.hb} />
            <StatTile ui={ui} label="Platelets" value={currentCase.cbc.platelets} />
            <StatTile ui={ui} label="PB abnormal cells" value={currentCase.cbc.blastsPeripheral} />
          </div>
          <div className={`mt-2 text-xs ${ui.muted}`}>Marrow: {currentCase.cbc.blastsMarrow}</div>
        </div>
      </div>

      {/* Tubes */}
      <div className={`${ui.card} p-4`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {currentCase.tubes.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveTube(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${activeTube === i ? 'bg-cyan-600 text-white' : ui.btn}`}
            >
              {osce ? `Tube ${i + 1}: ${t.xAxis} vs ${t.yAxis}` : t.name}
            </button>
          ))}
        </div>

        {isGateTube ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`text-xs ${ui.muted}`}>Step 1: gate the abnormal population on this plot.</span>
            {(['none', 'rect', 'polygon'] as GateTool[]).map((tool) => (
              <button
                key={tool}
                onClick={() => setGateTool(tool)}
                disabled={!!result}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${gateTool === tool ? 'bg-cyan-600 text-white' : ui.btn}`}
              >
                {tool === 'none' ? 'Move quadrants' : tool === 'rect' ? 'Rectangle' : 'Polygon'}
              </button>
            ))}
            {userGate && !result && (
              <button onClick={() => setUserGate(null)} className="rounded-lg bg-rose-600/20 px-2.5 py-1 text-xs text-rose-500">
                Clear gate
              </button>
            )}
            {!osce && !result && (
              <button onClick={() => setShowColors((v) => !v)} className={`rounded-lg px-2.5 py-1 text-xs ${ui.btn}`}>
                {showColors ? 'Hide' : 'Show'} population colours
              </button>
            )}
          </div>
        ) : (
          <div className={`mb-3 text-xs ${ui.muted}`}>
            {gatedEvents ? `Showing only events inside your gate (${gatedEvents.length.toLocaleString()} cells).` : 'Draw your gate first on the CD45 vs SSC-A tube; until then this plot shows all events.'}
          </div>
        )}

        {!osce && <p className={`mb-2 text-xs ${ui.soft}`}>{tube.description}</p>}

        <DotPlotCanvas
          isLightMode={isLight}
          events={plotEvents}
          xAxis={tube.xAxis}
          yAxis={tube.yAxis}
          quadrantX={quad.x}
          quadrantY={quad.y}
          onQuadrantChange={(qx, qy) => setQuad({ x: qx, y: qy })}
          showQuadrants={!(isGateTube && gateTool !== 'none')}
          scaleMode="biexp"
          colorMode={colorMode}
          gateMode={isGateTube && !result ? gateTool : 'none'}
          existingGate={isGateTube ? userGate : null}
          onCreateGate={(pts, type) => {
            setUserGate({ id: 'user-gate', name: 'My gate', type, xAxis: tube.xAxis, yAxis: tube.yAxis, points: pts, color: '#10b981' });
            setGateTool('none');
          }}
          highlightBlastBox={showBox ? { xMin: eg.cd45Min, xMax: eg.cd45Max, yMin: eg.sscMin, yMax: eg.sscMax } : null}
        />
      </div>

      {/* Interpretation */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${ui.card} p-4`}>
          <div className="mb-3 text-sm font-bold">Step 2: interpret the key markers</div>
          <div className="space-y-2">
            {currentCase.keyMarkersToInterpret.map((km) => {
              const answer = markerAnswers[km.marker];
              const correct = result && answer === km.expected;
              return (
                <div key={km.marker} className={`rounded-xl p-2.5 ${ui.subtle}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold">{km.marker}</span>
                    <div className="flex gap-1">
                      {EXPRESSION_LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          disabled={!!result}
                          onClick={() => setMarkerAnswers((prev) => ({ ...prev, [km.marker]: lvl }))}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold ${answer === lvl ? 'bg-cyan-600 text-white' : ui.btn}`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!osce && !result && <div className={`mt-1 text-[11px] ${ui.muted}`}>Hint: {km.hint}</div>}
                  {result && (
                    <div className={`mt-1 text-[11px] ${correct ? 'text-emerald-500' : 'text-amber-500'}`}>
                      Expected: <b>{km.expected}</b> {correct ? '✓' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${ui.card} p-4`}>
          <div className="mb-3 text-sm font-bold">Step 3: final diagnosis</div>
          <div className="space-y-2">
            {currentCase.differentialOptions.map((opt) => {
              const isCorrect = result && opt === currentCase.correctDiagnosis;
              const isWrongPick = result && opt === diagnosis && opt !== currentCase.correctDiagnosis;
              return (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    isCorrect ? 'border-emerald-500 bg-emerald-500/10' : isWrongPick ? 'border-rose-500 bg-rose-500/10' : diagnosis === opt ? 'border-cyan-500' : 'border-slate-600/40'
                  }`}
                >
                  <input type="radio" name="dx" checked={diagnosis === opt} disabled={!!result} onChange={() => setDiagnosis(opt)} />
                  {opt}
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={submitCase}
              disabled={!!result || !diagnosis}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              Submit case
            </button>
            <span className={`text-xs ${ui.muted}`}>
              Gate {gateReady ? '✓' : '·'} &nbsp; Markers {markersAnswered}/{currentCase.keyMarkersToInterpret.length} &nbsp; Diagnosis {diagnosis ? '✓' : '·'}
            </span>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`${ui.card} space-y-4 p-5`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className={`text-4xl font-black ${result.totalScore >= 80 ? 'text-emerald-500' : result.totalScore >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
              {result.totalScore}/100
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile ui={ui} label="Gate quality (F1)" value={`${Math.round(result.gateF1 * 100)}%`} tone={result.gateF1 >= 0.8 ? 'good' : 'warn'} />
              <StatTile ui={ui} label="Purity / recovery" value={`${Math.round(result.purity * 100)}% / ${Math.round(result.recall * 100)}%`} />
              <StatTile ui={ui} label="Marker accuracy" value={`${Math.round(result.markerPct * 100)}%`} tone={result.markerPct >= 0.8 ? 'good' : 'warn'} />
              <StatTile ui={ui} label="Diagnosis" value={result.diagnosisCorrect ? 'Correct ✓' : 'Incorrect'} tone={result.diagnosisCorrect ? 'good' : 'bad'} />
            </div>
          </div>

          <div className={`rounded-xl p-4 ${ui.subtle}`} dir={lang === 'AR' ? 'rtl' : 'ltr'}>
            <div className="mb-1 text-xs font-semibold uppercase text-cyan-500">{lang === 'AR' ? 'الشرح' : 'WHO-based explanation'}</div>
            {lang === 'AR' && !arabic ? (
              <p className="text-sm">لا يوجد شرح عربي لهذه الحالة المخصصة. الشرح بالإنجليزية: {explanationEN}</p>
            ) : (
              <>
                <p className="text-sm leading-relaxed">{lang === 'AR' && arabic ? arabic.summary : currentCase.whoExplanation}</p>
                <p className="mt-2 text-sm font-semibold text-amber-500">
                  {lang === 'AR' && arabic ? `💡 ${arabic.pearl}` : `💡 ${currentCase.keyTakeaway}`}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => (lang === 'AR' && arabic ? speakExplanation(explanationAR, 'ar-EG') : speakExplanation(explanationEN, 'en-US'))}
              className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}
            >
              Read aloud
            </button>
            <button onClick={() => setShowReport(true)} className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
              Case report
            </button>
            <button
              onClick={() => {
                setResult(null);
                setUserGate(null);
                setMarkerAnswers({});
                setDiagnosis('');
                setGateTool('none');
                setTimeLeft(180);
                setActiveTube(gateTubeIndex);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}
            >
              Retry case
            </button>
            {selectedIdx < cases.length - 1 && (
              <button onClick={() => setSelectedIdx((i) => i + 1)} className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500">
                Next case
              </button>
            )}
          </div>
        </div>
      )}

      {showReport && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 text-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Flow Cytometry Case Report</h3>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-white">
                  Print
                </button>
                <button onClick={() => setShowReport(false)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">
                  Close
                </button>
              </div>
            </div>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {[
                  ['Case', `#${currentCase.number} ${currentCase.title}`],
                  ['Patient', `${currentCase.patientAge}, ${currentCase.patientSex}`],
                  ['Presentation', currentCase.clinicalVignette],
                  ['CBC', `WBC ${currentCase.cbc.wbc} · Hb ${currentCase.cbc.hb} · Plt ${currentCase.cbc.platelets}`],
                  ['Genetics', currentCase.cytogenetics],
                  ['Your diagnosis', diagnosis],
                  ['Reference diagnosis', currentCase.correctDiagnosis],
                  ['Score', `${result.totalScore}/100 (gate ${Math.round(result.gateF1 * 100)}%, markers ${Math.round(result.markerPct * 100)}%)`]
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-slate-200">
                    <td className="w-40 py-2 pr-3 align-top font-semibold">{k}</td>
                    <td className="py-2">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 text-sm font-semibold">Marker interpretation</div>
            <table className="mt-1 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left">
                  <th className="py-1">Marker</th>
                  <th>Your call</th>
                  <th>Expected</th>
                </tr>
              </thead>
              <tbody>
                {currentCase.keyMarkersToInterpret.map((km) => (
                  <tr key={km.marker} className="border-b border-slate-100">
                    <td className="py-1 font-mono">{km.marker}</td>
                    <td>{markerAnswers[km.marker] ?? '—'}</td>
                    <td>{km.expected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-sm">{currentCase.whoExplanation}</p>
          </div>
        </div>
      )}

      {showBuilder && (
        <CaseBuilderModal
          ui={ui}
          customCases={customCases}
          setCustomCases={setCustomCases}
          onCreated={(newIndex) => setSelectedIdx(newIndex)}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// 10. MASTERY BADGES
// ============================================================================

interface MasteryStats {
  gatesCreated: number;
  solvedCaseIds: string[];
  singletPassed: boolean;
  compensationSolved: boolean;
}

const BadgesModal: React.FC<{ ui: UI; stats: MasteryStats; onClose: () => void }> = ({ ui, stats, onClose }) => {
  const builtInSolved = stats.solvedCaseIds.filter((id) => CLINICAL_CASES.some((c) => c.id === id)).length;
  const badges: { name: string; desc: string; earned: boolean }[] = [
    { name: 'First Gate', desc: 'Draw your first gate in the Gating Lab.', earned: stats.gatesCreated >= 1 },
    { name: 'Gating Pro', desc: 'Create 10 gates.', earned: stats.gatesCreated >= 10 },
    { name: 'Singlet Sentinel', desc: 'Pass the singlet discrimination challenge.', earned: stats.singletPassed },
    { name: 'Compensation Master', desc: 'Align both medians in the compensation lab.', earned: stats.compensationSolved },
    { name: 'Case Solver', desc: 'Diagnose 3 clinical cases correctly.', earned: builtInSolved >= 3 },
    { name: 'Hematopathology Fellow', desc: `Diagnose all ${CLINICAL_CASES.length} built-in cases.`, earned: builtInSolved >= CLINICAL_CASES.length }
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full max-w-md rounded-2xl border border-slate-700 p-5 ${ui.page}`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Mastery badges</h3>
          <button onClick={onClose} className={`rounded-lg px-3 py-1 text-sm ${ui.btn}`}>
            Close
          </button>
        </div>
        <div className="space-y-2">
          {badges.map((b) => (
            <div key={b.name} className={`flex items-center gap-3 rounded-xl p-3 ${b.earned ? 'bg-emerald-500/15' : ui.subtle}`}>
              <Award className={`h-6 w-6 ${b.earned ? 'text-emerald-500' : ui.muted}`} />
              <div>
                <div className="text-sm font-bold">{b.name}</div>
                <div className={`text-xs ${ui.muted}`}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className={`mt-3 text-xs ${ui.muted}`}>
          Cases solved: {builtInSolved}/{CLINICAL_CASES.length} · Gates drawn: {stats.gatesCreated}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// 11. MAIN APPLICATION
// ============================================================================

type ModuleId = 1 | 2 | 3 | 4 | 5;

const MODULES: { id: ModuleId; label: string; icon: React.ReactNode }[] = [
  { id: 1, label: 'Gating Lab', icon: <Crosshair className="h-4 w-4" /> },
  { id: 2, label: 'Singlet Gating', icon: <Layers className="h-4 w-4" /> },
  { id: 3, label: 'Compensation', icon: <Sliders className="h-4 w-4" /> },
  { id: 4, label: 'Marker Glossary', icon: <BookOpen className="h-4 w-4" /> },
  { id: 5, label: 'Clinical Cases', icon: <Microscope className="h-4 w-4" /> }
];

export default function App() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const isLight = themeMode === 'light';
  const ui = isLight ? UI_LIGHT : UI_DARK;
  const [activeModule, setActiveModule] = useState<ModuleId>(1);
  const [showBadgesModal, setShowBadgesModal] = useState<boolean>(false);
  const [customCases, setCustomCases] = useState<ClinicalCase[]>([]);
  const allClinicalCases = useMemo(() => [...CLINICAL_CASES, ...customCases], [customCases]);

  const [masteryStats, setMasteryStats] = useState<MasteryStats>({
    gatesCreated: 0,
    solvedCaseIds: [],
    singletPassed: false,
    compensationSolved: false
  });

  const handleGateCreated = useCallback(() => {
    setMasteryStats((prev) => ({ ...prev, gatesCreated: prev.gatesCreated + 1 }));
  }, []);
  const handleSingletPassed = useCallback(() => {
    setMasteryStats((prev) => (prev.singletPassed ? prev : { ...prev, singletPassed: true }));
  }, []);
  const handleCompSolved = useCallback(() => {
    setMasteryStats((prev) => (prev.compensationSolved ? prev : { ...prev, compensationSolved: true }));
  }, []);
  const handleCaseSolved = useCallback((id: string) => {
    setMasteryStats((prev) => (prev.solvedCaseIds.includes(id) ? prev : { ...prev, solvedCaseIds: [...prev.solvedCaseIds, id] }));
  }, []);

  return (
    <div className={`min-h-screen ${ui.page}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur ${isLight ? 'border-slate-200 bg-white/90' : 'border-slate-800 bg-slate-950/90'}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-2 flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-cyan-500" />
            <div>
              <div className="text-base font-black leading-tight">Egypt Flow Educational App</div>
              <div className={`text-[11px] leading-tight ${ui.muted}`}>Clinical flow cytometry simulator</div>
            </div>
          </div>
          <nav className="flex flex-1 flex-wrap gap-1.5">
            {MODULES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${activeModule === m.id ? 'bg-cyan-600 text-white' : ui.btn}`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </nav>
          <button onClick={() => setShowBadgesModal(true)} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs ${ui.btn}`}>
            <Award className="h-4 w-4" /> Badges
          </button>
          <button onClick={() => setThemeMode(isLight ? 'dark' : 'light')} className={`rounded-lg p-2 ${ui.btn}`} aria-label="Toggle theme">
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        {activeModule === 1 && <GatingLab ui={ui} isLight={isLight} cases={allClinicalCases} onGateCreated={handleGateCreated} />}
        {activeModule === 2 && <SingletLab ui={ui} isLight={isLight} cases={allClinicalCases} onPassed={handleSingletPassed} />}
        {activeModule === 3 && <CompensationLab ui={ui} isLight={isLight} onSolved={handleCompSolved} />}
        {activeModule === 4 && <GlossaryModule ui={ui} />}
        {activeModule === 5 && (
          <CaseSimulator
            ui={ui}
            isLight={isLight}
            cases={allClinicalCases}
            customCases={customCases}
            setCustomCases={setCustomCases}
            solvedIds={masteryStats.solvedCaseIds}
            onSolved={handleCaseSolved}
          />
        )}
      </main>

      {showBadgesModal && <BadgesModal ui={ui} stats={masteryStats} onClose={() => setShowBadgesModal(false)} />}
    </div>
  );
}
