import { saveMaterialForOffline } from '../group-d/offline/offlineMaterials';
import { getMaterial, putMaterial } from '../group-d/offline/indexedDB';
import { queueOfflineChange } from '../group-d/offline/sync';

const DAY = 86_400_000;
const sample = [
  { id: 'm1', title: 'The Art of Paying Attention', author: 'Elena Rivers', category: 'Personal Growth', fileName: 'art.epub', mimeType: 'application/epub+zip', size: 18.4e6, pageCount: 248, ago: 2, progressLabel: 'Page 42 of 248' },
  { id: 'm2', title: 'Beneath the Blue', author: 'Dr. Maya Chan', category: 'Science & Nature', fileName: 'blue.pdf', mimeType: 'application/pdf', size: 45.2e6, pageCount: 186, ago: 1, progressLabel: 'Annotated (3 notes)' },
  { id: 'm3', title: 'Cities for Tomorrow', author: 'Atlas Documentary Studio', category: 'Design & Society', fileName: 'cities.mp4', mimeType: 'video/mp4', size: 480e6, durationSeconds: 42 * 60, ago: 3, progressLabel: 'HD 1080p' },
  { id: 'm4', title: 'A Map of Elsewhere', author: 'Oliver Hayes', category: 'Literature & Fiction', fileName: 'map.epub', mimeType: 'application/epub+zip', size: 24.1e6, pageCount: 312, ago: 5 },
  { id: 'm5', title: 'The Living Forest', author: 'Sofia Laurent', category: 'Science & Nature', fileName: 'forest.mp3', mimeType: 'audio/mpeg', size: 310e6, durationSeconds: 5 * 3600 + 24 * 60, ago: 7, progressLabel: 'Ch. 3 at 14:10' },
  { id: 'm6', title: 'A Field Guide to Good Design', author: 'Marcus Reid', category: 'Art & Design', fileName: 'field.pdf', mimeType: 'application/pdf', size: 32.8e6, pageCount: 124, ago: 14 },
];

/** Dev only: store sample materials (tiny placeholder blobs; metadata reports realistic sizes). */
export async function seedDemoMaterials(): Promise<void> {
  for (const s of sample) {
    await saveMaterialForOffline({
      material: {
        id: s.id, title: s.title, author: s.author, category: s.category, fileName: s.fileName,
        mimeType: s.mimeType, fileSize: s.size, pageCount: s.pageCount, durationSeconds: s.durationSeconds,
        progressLabel: s.progressLabel, ownerUserId: 'local-user',
      },
      fileBlob: new Blob([`demo:${s.title}`], { type: s.mimeType }),
      permission: { allowed: true, offlineAllowedUntil: new Date(Date.now() + 30 * DAY).toISOString(), validatedAt: new Date().toISOString() },
    });
    const rec = await getMaterial(s.id);
    if (rec) await putMaterial({ ...rec, metadata: { ...rec.metadata, savedAt: new Date(Date.now() - s.ago * DAY).toISOString() } });
  }
  await queueOfflineChange({ entity: 'bookmark', action: 'upsert', materialId: 'm1', payload: { page: 42 } });
  console.info('LORIS demo materials saved. Reload the page.');
}
