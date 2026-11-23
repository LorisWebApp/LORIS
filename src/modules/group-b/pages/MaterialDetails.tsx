import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../../group-a/contexts/AuthContext";
import { BookOpen, X, PlayCircle, Headphones, CloudDownload } from "lucide-react";
import { PageHeader, Button, DetailRow, StatusBadge, ToastNotification } from "../shared";
import { FavouriteToggle } from "../../group-c/components/user/FavouriteToggle";
import { listFavouriteIds, setFavourite } from "../../group-c/services/favourites.service";
import { saveMaterialForOffline } from "../../../group-d/offline/offlineMaterials";
import { getAccessToken } from "../../../integration/loris";
import { useProtectedFile } from "../../../hooks/useProtectedFile";
import { ProtectedMedia, ProtectedPdfViewer } from "../../../components/reader/ProtectedViewer";
import { toHttps, pathOf } from "../../../lib/secureUrl";

export default function MaterialDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isOrgAdmin, isPlatformManager } = useAuth();

  const [material, setMaterial] = useState<any>(null);
  const [isReading, setIsReading] = useState(false);
  const [isFavourite, setIsFavourite] = useState(false);
  const [toast, setToast] = useState<{message: string; variant: "success" | "error"} | null>(null);
  const [savingOffline, setSavingOffline] = useState(false);
  const protectedFile = useProtectedFile(id, Boolean(user && isReading));

  useEffect(() => {
    // Guests read the public preview view (description only, no file link).
    supabase
      .from(user ? "materials" : "public_materials")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setMaterial(data));
  }, [id, user]);

  useEffect(() => {
    if (!user || !id) { setIsFavourite(false); return; }
    let cancelled = false;
    listFavouriteIds().then((ids) => { if (!cancelled) setIsFavourite(ids.includes(String(id))); }).catch((error) => console.warn("Could not load favourite state", error));
    return () => { cancelled = true; };
  }, [id, user]);

  if (!material) {
    return (
      <div className="p-10 text-center text-muted font-serif">Loading...</div>
    );
  }

  const fileType = material.file_type ? material.file_type.toLowerCase() : "";

  const isAudio = fileType.includes("audio") || fileType.includes("mp3");
  const isVideo = fileType.includes("video") || fileType.includes("mp4");
  const isPDF = fileType.includes("pdf");
  const isEPUB = fileType.includes("epub");
  const isImage = fileType.includes("image") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(String(material.file_url ?? ""));

  /**
   * Opens EPUB materials using the existing Group C Reader.
   */
  const openEpubReader = () => {
    if (!id) {
      console.error("Cannot open EPUB: material ID is missing.");
      return;
    }

    navigate(`/user/reader/${encodeURIComponent(id)}`);
  };

  const saveOffline = async () => {
    if (!user || !material || savingOffline) return;
    if (!navigator.onLine) { setToast({ message: "Connect to the internet to save this material offline.", variant: "error" }); return; }
    setSavingOffline(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Sign in to save materials offline.");
      const apiBase = toHttps(((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").trim().replace(/\/+$/, ""));
      if (!apiBase) throw new Error("The offline download service is not configured (VITE_API_BASE_URL).");
      const grantResponse = await fetch(`${apiBase}/api/offline/materials/${encodeURIComponent(String(material.id))}/download`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const grant = await grantResponse.json().catch(() => ({})) as { url?: string; sizeBytes?: number; expiresAt?: string; error?: string };
      if (!grantResponse.ok || !grant.url || !grant.expiresAt) throw new Error(grant.error || "The server could not authorise this offline download.");
      // Never trust the host/protocol in the server-issued URL (proxy makes it http://); re-base on our API origin.
      const fileResponse = await fetch(toHttps(`${apiBase}${pathOf(grant.url)}`), { headers: { Authorization: `Bearer ${token}` } });
      if (!fileResponse.ok) throw new Error("The material file could not be downloaded.");
      const fileBlob = await fileResponse.blob();
      await saveMaterialForOffline({
        material: {
          id: String(material.id), title: material.title, author: material.author ?? "", category: material.category_name ?? "General",
          fileName: material.file_name ?? `${material.title}.${String(material.file_type ?? "").split("/").pop() || "file"}`,
          mimeType: material.file_type ?? fileBlob.type ?? "application/octet-stream", fileSize: fileBlob.size || Number(grant.sizeBytes ?? 0),
          sourceUrl: material.file_url, organisationId: material.organisation_id ? String(material.organisation_id) : undefined,
          ownerUserId: user.id, coverUrl: material.image_url ?? undefined,
        },
        fileBlob,
        permission: { allowed: true, offlineAllowedUntil: grant.expiresAt, validatedAt: new Date().toISOString() },
      });
      setToast({ message: "Material saved to this device for offline access.", variant: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Could not save this material offline.", variant: "error" });
    } finally { setSavingOffline(false); }
  };

  return (
    <div className="min-h-screen bg-page font-serif pb-20">
      {/* HEADER */}
      <div className="bg-white border-b border-line">
        <div className="max-w-[1312px] mx-auto px-8 py-8">
          <PageHeader
            title={material.title}
            breadcrumbs={[
              { label: "Catalogue", to: "/catalogue" },
              { label: "Details" },
            ]}
          />
        </div>
      </div>

      <main className="max-w-[1312px] mx-auto px-8 py-10 grid md:grid-cols-[300px_1fr] gap-12">
        {/* Cover Image */}
        <div className="aspect-[3/4] bg-mint border border-line overflow-hidden rounded-lg shadow-sm relative">
          {material.image_url ? (
            <img
              src={material.image_url}
              alt={material.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <BookOpen size={48} />
            </div>
          )}
          {user && <FavouriteToggle active={isFavourite} materialTitle={material.title} onToggle={() => void (async () => {
            const previous = isFavourite;
            setIsFavourite(!previous);
            try { await setFavourite(String(material.id), !previous); setToast({ message: previous ? "Removed from favourites." : "Added to favourites.", variant: "success" }); }
            catch (error) { setIsFavourite(previous); setToast({ message: error instanceof Error ? error.message : "Could not update favourite.", variant: "error" }); }
          })()} />}
        </div>


        {/* Details Info */}
        <div>
          <StatusBadge
            label={material.category_name || "General"}
            variant="accent"
          />

          <h1 className="text-[38px] font-medium text-deep mt-4 leading-tight">
            {material.title}
          </h1>

          <p className="text-[17px] text-muted mt-2">
            By {material.author || "Unknown Author"}
          </p>

          <div className="mt-8 border-t border-line">
            <DetailRow
              label="Format"
              value={material.file_type?.split("/")[1]?.toUpperCase() || "FILE"}
              divider
            />

            <DetailRow
              label="Description"
              value={material.description || "No description provided."}
              layout="stacked"
              divider
            />
          </div>

          {/* ACTION BUTTONS */}
          {!user && (
            <div className="mt-8 rounded-xl border border-line bg-mint-soft p-6">
              <p className="font-semibold text-deep">
                Sign in to read this resource
              </p>

              <p className="mt-1 text-sm text-muted">
                Anyone can browse the catalogue. An account is needed to read,
                listen or watch, and to save materials to your library.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-deep"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-lg border border-ink/25 px-5 py-2.5 text-sm font-semibold text-ink no-underline hover:bg-mint"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}

          <div className={`mt-8 flex flex-wrap gap-4 ${user ? "" : "hidden"}`}>
            {isPDF && (
              <>
                <Button onClick={openEpubReader} leftIcon={<BookOpen size={16} />}>Read Document</Button>
                <Button variant="outline" onClick={() => setIsReading(true)} leftIcon={<BookOpen size={16} />}>View pages</Button>
              </>
            )}

            {isEPUB && (
              <Button
                onClick={openEpubReader}
                leftIcon={<BookOpen size={16} />}
              >
                Open EPUB
              </Button>
            )}

            {isAudio && (
              <Button
                onClick={() => setIsReading(true)}
                leftIcon={<Headphones size={16} />}
              >
                Listen Now
              </Button>
            )}

            {isVideo && (
              <Button
                onClick={() => setIsReading(true)}
                leftIcon={<PlayCircle size={16} />}
              >
                Watch Video
              </Button>
            )}
            {isImage && <Button onClick={() => setIsReading(true)} leftIcon={<BookOpen size={16} />}>View Image</Button>}
            {user && !isOrgAdmin && !isPlatformManager && <Button variant="outline" onClick={() => void saveOffline()} loading={savingOffline} leftIcon={<CloudDownload size={16} />}>Save offline</Button>}

          </div>
        </div>
      </main>

      {/* MEDIA VIEWER MODAL - PDF, AUDIO AND VIDEO */}
      {user && isReading && (
        <div className="fixed inset-0 bg-deep/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`bg-white w-full ${
              isAudio || isVideo ? "max-w-2xl" : "max-w-6xl h-full"
            } rounded-xl flex flex-col overflow-hidden shadow-2xl`}
          >
            {/* Modal Header */}
            <div className="bg-ink px-6 py-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-semibold font-serif truncate pr-4">
                {material.title}
              </h3>

              <button
                onClick={() => setIsReading(false)}
                className="hover:bg-white/20 p-2 rounded-md transition shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: content comes from the authenticated API and is shown only by LORIS viewers */}
            {protectedFile.loading && <p className="p-8 text-center text-muted">Loading…</p>}
            {protectedFile.error && <p role="alert" className="p-8 text-center text-rose-text">{protectedFile.error}</p>}
            {protectedFile.blob && (
              isAudio ? (
                <div className="p-8 flex flex-col items-center justify-center bg-mint-soft">
                  {material.image_url && <img src={material.image_url} alt={material.title} draggable={false} className="h-48 w-48 object-cover rounded-lg shadow-lg mb-8" />}
                  <ProtectedMedia kind="audio" blob={protectedFile.blob} title={material.title} />
                </div>
              ) : isVideo ? (
                <div className="w-full bg-black flex items-center justify-center"><ProtectedMedia kind="video" blob={protectedFile.blob} title={material.title} /></div>
              ) : isImage ? (
                <div className="w-full flex-1 bg-black flex items-center justify-center p-4 overflow-auto"><ProtectedMedia kind="image" blob={protectedFile.blob} title={material.title} /></div>
              ) : isPDF ? (
                <div className="flex-1 min-h-0"><ProtectedPdfViewer blob={protectedFile.blob} /></div>
              ) : (
                <p className="p-8 text-center text-muted">This file type cannot be displayed in LORIS.</p>
              )
            )}
          </div>
        </div>
      )}
      <ToastNotification open={!!toast} message={toast?.message ?? ""} variant={toast?.variant ?? "success"} onClose={() => setToast(null)} placement="top-right" />
    </div>
  );
}
