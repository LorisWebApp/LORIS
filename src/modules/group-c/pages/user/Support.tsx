import { LifeBuoy, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  SelectField,
  TextAreaField,
  TextField,
} from "../../components/user/FormFields";

import {
  Alert,
  Button,
  EmptyState,
  LoadingIndicator,
  PageHeader,
  SectionHeader,
  StatusBadge,
  TabNavigation,
  ToastNotification,
  type StatusVariant,
} from "../../components/user/sharedUi";

import { supportService } from "../../services/support.service";

import {
  SUPPORT_CATEGORIES,
  SUPPORT_STATUS_LABEL,
  type SupportCategory,
  type SupportRequest,
  type SupportStatus,
} from "../../types/support.types";

const STATUS_VARIANT: Record<SupportStatus, StatusVariant> = {
  open: "info",
  in_progress: "warning",
  resolved: "success",
};

const categoryLabel = (category: SupportCategory) =>
  SUPPORT_CATEGORIES.find((item) => item.value === category)?.label ?? category;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  `${formatDate(iso)}, ${new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

type Filter = "all" | SupportStatus;

const EMPTY_FORM = {
  subject: "",
  category: "" as SupportCategory | "",
  description: "",
};

/** System Support (Group C). Route: /user/support. */
export function Support() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const [form, setForm] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState<{
    subject?: string;
    category?: string;
    description?: string;
  }>({});

  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  /** Loads the user's support requests. */
  const load = useCallback(async () => {
    setState("loading");

    try {
      const result = await supportService.list();
      setRequests(result);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Close the request details dialog with Escape. */
  useEffect(() => {
    if (!selectedId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId]);

  /** Validates and submits a new support request. */
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) return;

    const subject = form.subject.trim();
    const description = form.description.trim();

    const nextErrors: typeof errors = {};

    if (subject.length < 3) {
      nextErrors.subject = "Enter a subject of at least 3 characters.";
    } else if (subject.length > 100) {
      nextErrors.subject = "Keep the subject under 100 characters.";
    }

    if (!form.category) {
      nextErrors.category = "Choose a category.";
    }

    if (description.length < 10) {
      nextErrors.description =
        "Describe the problem in at least 10 characters.";
    } else if (description.length > 2000) {
      nextErrors.description = "Keep the description under 2000 characters.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      const created = await supportService.create({
        subject,
        category: form.category as SupportCategory,
        description,
      });

      setRequests((current) => [
        created,
        ...current.filter((request) => request.id !== created.id),
      ]);

      setForm(EMPTY_FORM);
      setErrors({});
      setFilter("all");
      setQuery("");

      setToast({
        variant: "success",
        message: `Request ${created.reference} submitted.`,
      });
    } catch {
      setToast({
        variant: "error",
        message: "We couldn’t submit your request. Try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /** Counts requests by status. */
  const counts = useMemo(
    () => ({
      all: requests.length,
      open: requests.filter((request) => request.status === "open").length,
      in_progress: requests.filter(
        (request) => request.status === "in_progress",
      ).length,
      resolved: requests.filter((request) => request.status === "resolved")
        .length,
    }),
    [requests],
  );

  /** Applies status and text filters. */
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = filter === "all" || request.status === filter;

      const searchableText =
        `${request.subject} ${request.reference} ${request.description}`.toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [requests, filter, query]);

  const selected =
    requests.find((request) => request.id === selectedId) ?? null;

  return (
    <div className="min-h-screen">
      <PageHeader
        tone="dark"
        size="md"
        className="px-4 py-10 lg:px-10"
        eyebrow="— We’re here to help"
        title="System Support"
        description="Report a problem or ask a question, then follow the progress of every request you’ve sent."
      />

      <div className="mx-auto grid w-full max-w-[1312px] grid-cols-[minmax(0,1fr)] gap-10 px-4 py-8 lg:grid-cols-[400px_minmax(0,1fr)] lg:px-10">
        {/* New support request form */}
        <form
          onSubmit={submit}
          noValidate
          aria-label="New support request"
          className="space-y-4 self-start"
        >
          <SectionHeader title="New request" size="sm" as="h2" divider />

          <TextField
            label="Subject"
            value={form.subject}
            error={errors.subject}
            maxLength={100}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                subject: event.target.value,
              }));
            }}
            placeholder="Briefly, what’s wrong?"
          />

          <SelectField
            label="Category"
            value={form.category}
            error={errors.category}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                category: event.target.value as SupportCategory | "",
              }));
            }}
            options={[
              { value: "", label: "Select a category…" },
              ...SUPPORT_CATEGORIES,
            ]}
          />

          <TextAreaField
            label="Description"
            rows={6}
            value={form.description}
            error={errors.description}
            hint={`${form.description.length} / 2000`}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }));
            }}
            placeholder="What happened, and what did you expect? Include the material title if relevant."
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </form>

        {/* Existing support requests */}
        <section aria-label="Your requests">
          <SectionHeader title="Your requests" size="sm" as="h2" divider />

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <TabNavigation
              variant="pill"
              aria-label="Filter by status"
              activeId={filter}
              onChange={(id) => setFilter(id as Filter)}
              tabs={[
                { id: "all", label: "All", count: counts.all },
                { id: "open", label: "Open", count: counts.open },
                {
                  id: "in_progress",
                  label: "In Progress",
                  count: counts.in_progress,
                },
                {
                  id: "resolved",
                  label: "Resolved",
                  count: counts.resolved,
                },
              ]}
            />

            <input
              type="search"
              aria-label="Search support requests"
              placeholder="Search requests"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-56 border-0 border-b border-line bg-transparent px-2 py-2 text-[15px] text-deep outline-none placeholder:text-muted focus:border-brand focus:ring-0"
            />
          </div>

          <div className="mt-4">
            {state === "loading" && (
              <LoadingIndicator centered label="Loading your requests…" />
            )}

            {state === "error" && (
              <Alert
                severity="error"
                title="We couldn’t load your requests"
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void load()}
                  >
                    Try again
                  </Button>
                }
              >
                Check your connection and try again.
              </Alert>
            )}

            {state === "ready" && visible.length === 0 && (
              <EmptyState
                icon={<LifeBuoy size={32} />}
                title={
                  requests.length === 0
                    ? "No requests yet"
                    : "No matching requests"
                }
                description={
                  requests.length === 0
                    ? "Use the form to send your first request."
                    : "Try a different status or search term."
                }
                action={
                  requests.length > 0 ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFilter("all");
                        setQuery("");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            )}

            {state === "ready" && visible.length > 0 && (
              <ul className="m-0 list-none divide-y divide-line border-y border-line p-0">
                {visible.map((request) => (
                  <li key={request.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(request.id)}
                      className="block w-full px-2 py-4 text-left transition-colors hover:bg-mint-soft focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
                    >
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
                          {request.reference} ·{" "}
                          {categoryLabel(request.category)}
                        </span>

                        <StatusBadge
                          variant={STATUS_VARIANT[request.status]}
                          label={SUPPORT_STATUS_LABEL[request.status]}
                        />
                      </span>

                      <span className="mt-1 block text-[19px] font-semibold text-deep">
                        {request.subject}
                      </span>

                      <span className="mt-0.5 block text-[15px] text-muted">
                        Submitted {formatDate(request.createdAt)} ·{" "}
                        {request.responses.length === 0
                          ? "No response yet"
                          : `${request.responses.length} ${
                              request.responses.length === 1
                                ? "response"
                                : "responses"
                            }`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Request details dialog */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedId(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-dialog-title"
            className="my-auto w-full max-w-2xl rounded-[4px] bg-white p-5 shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <h2
                  id="support-dialog-title"
                  className="m-0 text-[23px] font-semibold text-deep"
                >
                  {selected.subject}
                </h2>

                <p className="m-0 mt-1 text-[14px] text-muted">
                  {selected.reference} · {categoryLabel(selected.category)}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close request details"
                onClick={() => setSelectedId(null)}
                className="rounded p-2 text-muted hover:bg-mint-soft hover:text-deep focus-visible:outline-2 focus-visible:outline-brand"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-muted">
                <StatusBadge
                  variant={STATUS_VARIANT[selected.status]}
                  label={SUPPORT_STATUS_LABEL[selected.status]}
                />

                <span>Submitted {formatDateTime(selected.createdAt)}</span>

                <span>Updated {formatDateTime(selected.updatedAt)}</span>
              </div>

              <div>
                <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Your description
                </h3>

                <p className="m-0 mt-1 whitespace-pre-wrap text-[17px] text-deep">
                  {selected.description}
                </p>
              </div>

              <div>
                <h3 className="m-0 text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Responses
                </h3>

                {selected.responses.length === 0 ? (
                  <p className="m-0 mt-1 text-[16px] text-muted">
                    No response yet. You’ll see replies here when the support
                    team answers.
                  </p>
                ) : (
                  <ul className="m-0 mt-2 list-none space-y-3 p-0">
                    {selected.responses.map((response) => (
                      <li
                        key={response.id}
                        className="rounded-[4px] border border-line bg-mint-soft px-4 py-3"
                      >
                        <p className="m-0 text-[14px] text-muted">
                          {response.author} ·{" "}
                          {formatDateTime(response.createdAt)}
                        </p>

                        <p className="m-0 mt-1 whitespace-pre-wrap text-[16px] text-deep">
                          {response.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-line pt-4">
              <Button variant="outline" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
          </section>
        </div>
      )}

      <ToastNotification
        open={toast !== null}
        variant={toast?.variant ?? "info"}
        message={toast?.message ?? ""}
        onClose={closeToast}
      />
    </div>
  );
}

export default Support;
