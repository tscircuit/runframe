import type { ComponentSearchResult } from './ImportComponentDialog';
import type { CircuitJson } from "circuit-json";

interface KicadFootprint extends ComponentSearchResult {
  circuitJson: CircuitJson;
}

const MOCK_KICAD_FOOTPRINTS: KicadFootprint[] = [
  {
    id: 'resistor_smd_r_0402',
    name: 'Resistor_SMD:R_0402_1005Metric',
    description: '0402 SMD Resistor footprint',
    source: 'kicad' as const,
    circuitJson: {
      nets: [],
      junctions: [],
      wires: [
        {
          name: 'body',
          layer: 'top',
          width: 10000,
          points: [
            { x: 0, y: 0 },
            { x: 1000000, y: 0 },
            { x: 1000000, y: 500000 },
            { x: 0, y: 500000 },
            { x: 0, y: 0 },
          ],
        },
      ],
      pads: [
        { name: '1', position: { x: 250000, y: 250000 }, layer: 'top', shape: 'circle', size: { x: 300000, y: 300000 } },
        { name: '2', position: { x: 750000, y: 250000 }, layer: 'top', shape: 'circle', size: { x: 300000, y: 300000 } },
      ],
      elements: [],
      buses: [],
      labels: [],
      notes: [],
    },
  },
  {
    id: 'capacitor_smd_c_0402',
    name: 'Capacitor_SMD:C_0402_1005Metric',
    description: '0402 SMD Capacitor footprint',
    source: 'kicad' as const,
    circuitJson: {
      nets: [],
      junctions: [],
      wires: [
        {
          name: 'body',
          layer: 'top',
          width: 10000,
          points: [
            { x: 0, y: 0 },
            { x: 1000000, y: 0 },
            { x: 1000000, y: 600000 },
            { x: 0, y: 600000 },
            { x: 0, y: 0 },
          ],
        },
      ],
      pads: [
        { name: '1', position: { x: 200000, y: 300000 }, layer: 'top', shape: 'circle', size: { x: 300000, y: 300000 } },
        { name: '2', position: { x: 800000, y: 300000 }, layer: 'top', shape: 'circle', size: { x: 300000, y: 300000 } },
      ],
      elements: [],
      buses: [],
      labels: [],
      notes: [],
    },
  },
  {
    id: 'led_smd_led_0603',
    name: 'LED_SMD:LED_0603_1608Metric',
    description: '0603 SMD LED footprint',
    source: 'kicad' as const,
    circuitJson: {
      nets: [],
      junctions: [],
      wires: [
        {
          name: 'body',
          layer: 'top',
          width: 10000,
          points: [
            { x: 0, y: 0 },
            { x: 1600000, y: 0 },
            { x: 1600000, y: 800000 },
            { x: 0, y: 800000 },
            { x: 0, y: 0 },
          ],
        },
      ],
      pads: [
        { name: 'A', position: { x: 400000, y: 400000 }, layer: 'top', shape: 'circle', size: { x: 400000, y: 400000 } },
        { name: 'K', position: { x: 1200000, y: 400000 }, layer: 'top', shape: 'circle', size: { x: 400000, y: 400000 } },
      ],
      elements: [],
      buses: [],
      labels: [],
      notes: [],
    },
  },
  {
    id: 'connector_sm_2pin',
    name: 'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical',
    description: '2-pin header connector',
    source: 'kicad' as const,
    circuitJson: {
      nets: [],
      junctions: [],
      wires: [
        {
          name: 'body',
          layer: 'top',
          width: 10000,
          points: [
            { x: 0, y: 0 },
            { x: 5000000, y: 0 },
            { x: 5000000, y: 2000000 },
            { x: 0, y: 2000000 },
            { x: 0, y: 0 },
          ],
        },
      ],
      pads: [
        { name: '1', position: { x: 1270000, y: 1000000 }, layer: 'top', shape: 'circle', size: { x: 600000, y: 600000 } },
        { name: '2', position: { x: 3730000, y: 1000000 }, layer: 'top', shape: 'circle', size: { x: 600000, y: 600000 } },
      ],
      elements: [],
      buses: [],
      labels: [],
      notes: [],
    },
  },
  {
    id: 'fuse_smd_fuse_1206',
    name: 'Fuse_SMD:Fuse_1206_3216Metric',
    description: '1206 SMD Fuse footprint',
    source: 'kicad' as const,
    circuitJson: {
      nets: [],
      junctions: [],
      wires: [
        {
          name: 'body',
          layer: 'top',
          width: 10000,
          points: [
            { x: 0, y: 0 },
            { x: 3200000, y: 0 },
            { x: 3200000, y: 1600000 },
            { x: 0, y: 1600000 },
            { x: 0, y: 0 },
          ],
        },
      ],
      pads: [
        { name: '1', position: { x: 800000, y: 800000 }, layer: 'top', shape: 'circle', size: { x: 800000, y: 800000 } },
        { name: '2', position: { x: 2400000, y: 800000 }, layer: 'top', shape: 'circle', size: { x: 800000, y: 800000 } },
      ],
      elements: [],
      buses: [],
      labels: [],
      notes: [],
    },
  },
];

export const searchKicadFootprints = async (query: string, limit: number = 20): Promise<KicadFootprint[]> => {
  try {
    // In production, this would scan the KiCad cache directory via a worker or backend API
    // For now, return mock data filtered by query
    if (!query.trim()) {
      return [];
    }

    const filtered = MOCK_KICAD_FOOTPRINTS.filter(footprint =>
      footprint.name.toLowerCase().includes(query.toLowerCase()) ||
      footprint.description!.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    return filtered;
  } catch (error) {
    console.error('Error searching KiCad footprints:', error);
    return [];
  }
};

export const mapKicadFootprintToSearchResult = (footprint: KicadFootprint): Omit<KicadFootprint, 'circuitJson'> => {
  return {
    id: footprint.id,
    name: footprint.name,
    description: footprint.description,
    source: footprint.source,
  };
};
