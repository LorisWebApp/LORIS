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

const MAX_RECOMMENDATIONS = 4;

/**
 * Recommended materials based on the user's current reading activity.
 *
 * Recommendations are supplied by the application data source.
 * This component does not generate AI recommendations.
 */
export function RecommendedSection({
  materials,
  favouriteIds,
  offlineMaterialIds,
  onToggleFavourite,
}: RecommendedSectionProps) {
  const recommendations = materials
    .filter((material) => Boolean(material.id))
    .slice(0, MAX_RECOMMENDATIONS);

  if (recommendations.length === 0) {
    return null;
  }

  const entries = recommendations.map((material) =>
    buildMaterialEntry(material, {
      layout: "card",
      variant: "recommendation",
      isOffline: offlineMaterialIds.has(material.id),
      isFavourite: favouriteIds.has(material.id),
      onToggleFavourite,
    }),
  );

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
          materials={entries}
        />
      </div>
    </section>
  );
}
