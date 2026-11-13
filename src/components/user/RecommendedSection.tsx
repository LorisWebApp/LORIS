import { USER_ROUTES } from "../../config/userRoutes";
import type { LibraryMaterial } from "../../types/userLibrary.types";
import { buildMaterialEntry } from "./materialEntries";
import { Button, MaterialList, SectionHeader } from "./sharedUi";

export interface RecommendedSectionProps {
  materials: LibraryMaterial[];
  favouriteIds: ReadonlySet<string>;
  offlineMaterialIds: ReadonlySet<string>;
  onToggleFavourite: (materialId: string) => void;
}

/**
 * "Recommended for Your Current Inquiries" (desktop only, as in the wireframes).
 * The list comes from the backend; AI recommendations are out of scope in the SRS, so the
 * backend should use a simple rule (e.g. same categories as the materials in progress).
 */
export function RecommendedSection({
  materials,
  favouriteIds,
  offlineMaterialIds,
  onToggleFavourite,
}: RecommendedSectionProps) {
  if (materials.length === 0) return null;

  return (
    <section aria-label="Recommended materials">
      <SectionHeader
        title="Recommended for Your Current Inquiries"
        actions={
          <Button to={USER_ROUTES.catalogue} variant="text" size="sm">
            Explore Catalogue ›
          </Button>
        }
      />
      <div className="mt-6">
        <MaterialList
          aria-label="Recommended materials"
          layout="grid"
          columns={4}
          framed
          materials={materials.slice(0, 4).map((m) =>
            buildMaterialEntry(m, {
              layout: "card",
              variant: "recommendation",
              isOffline: offlineMaterialIds.has(m.id),
              isFavourite: favouriteIds.has(m.id),
              onToggleFavourite,
            }),
          )}
        />
      </div>
    </section>
  );
}
