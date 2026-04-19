
import { CHECKPOINTS } from '../lib/checkpoints';

const ids = CHECKPOINTS.map(c => c.id);
const uniqueIds = new Set(ids);
console.log('Total:', ids.length);
console.log('Unique:', uniqueIds.size);

if (ids.length !== uniqueIds.size) {
    const counts: Record<string, number> = {};
    ids.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
    });
    const duplicates = Object.entries(counts).filter(([id, count]) => count > 1);
    console.log('Duplicates:', duplicates);
}
