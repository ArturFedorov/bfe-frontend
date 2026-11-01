import { useState } from 'react';
import { PartnerAutocomplete, Partner } from './partner_autocomplete';

/**
 * Demo harness for PartnerAutocomplete — auto-discovered by the playground
 * (playground/App.tsx). This file is not part of the task: the spec lives in
 * README.md and the grader is partner_autocomplete.test.tsx.
 */

const PARTNERS: Partner[] = [
  { id: 'p01', name: 'Acme Studios' },
  { id: 'p02', name: 'Nordic Films' },
  { id: 'p03', name: 'Sakura Animation' },
  { id: 'p04', name: 'Meridian Pictures' },
  { id: 'p05', name: 'Baltic Crime Collective' },
  { id: 'p06', name: 'Andes Nature Media' },
  { id: 'p07', name: 'Netherfield Productions' },
  { id: 'p08', name: 'Neon Harbor Films' },
  { id: 'p09', name: 'Northwind Documentaries' },
  { id: 'p10', name: 'Lagos Lights Studio' },
  { id: 'p11', name: 'Seoul Wave Entertainment' },
  { id: 'p12', name: 'Mumbai Masala Films' },
  { id: 'p13', name: 'Patagonia Pictures' },
  { id: 'p14', name: 'Outback Originals' },
  { id: 'p15', name: 'Riviera Post House' },
  { id: 'p16', name: 'Kyoto Frame Works' },
  { id: 'p17', name: 'Berlin Cutting Room' },
  { id: 'p18', name: 'Sahara Sun Studios' },
  { id: 'p19', name: 'Fjord & Frame' },
  { id: 'p20', name: 'Highland Reels' },
  { id: 'p21', name: 'Prairie Wind Media' },
  { id: 'p22', name: 'Coral Reef Content' },
  { id: 'p23', name: 'Tundra Tales' },
  { id: 'p24', name: 'Monsoon Motion' },
  { id: 'p25', name: 'Alpine Echo Films' },
  { id: 'p26', name: 'Delta Blues Pictures' },
  { id: 'p27', name: 'Savanna Stories' },
  { id: 'p28', name: 'Pacific Rim Post' },
  { id: 'p29', name: 'Caspian Gate Media' },
  { id: 'p30', name: 'Atlas Peak Productions' },
];

// Mock search API: case-insensitive substring match over 30 partners with
// 300–800ms latency; honours the AbortSignal so cancelled requests reject.
function fetchPartners(
  query: string,
  opts?: { signal?: AbortSignal }
): Promise<Partner[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      resolve(PARTNERS.filter((p) => p.name.toLowerCase().includes(q)));
    }, 300 + Math.random() * 500);
    opts?.signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('aborted'));
    });
  });
}

export default function Demo() {
  const [selected, setSelected] = useState<Partner | null>(null);

  return (
    <div className="demo">
      <h2>Partner Autocomplete</h2>
      <p className="demo-note">
        Implement <code>PartnerAutocomplete</code> in{' '}
        <code>partner_autocomplete.tsx</code> — debounced combobox over a mock
        search API (30 partners, 300–800ms latency, abortable). Try
        "st", "film", or "nor"; navigate with ArrowDown/ArrowUp, select with
        Enter or click.
      </p>
      <div className="demo-stage">
        <PartnerAutocomplete
          fetchPartners={fetchPartners}
          onSelect={setSelected}
          debounceMs={300}
          label="Partner"
        />
        <p className="demo-note">
          Selected:{' '}
          {selected ? `${selected.name} (${selected.id})` : 'nothing yet'}
        </p>
      </div>
    </div>
  );
}
