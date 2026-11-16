import { RefreshCw } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AsyncView } from '../../components/common/AsyncView';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Textarea } from '../../components/common/Textarea';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { OrganisationStatus } from '../../components/organisation/OrganisationStatus';
import { Alert, DetailRow } from '../../components/shared';
import { useAsync } from '../../hooks/useAsync';
import { ApiError } from '../../services/api';
import { organisationService } from '../../services/organisation.service';
import type { RegistrationMessage, RegistrationTracking } from '../../types/organisation';
import { ROUTES } from '../../utils/constants';
import { formatWhen } from '../../utils/format';
import { loadTrackingToken, saveTrackingToken } from '../../utils/registrationTracking';

const POLL_MS = 30_000;

const HEADINGS: Record<RegistrationTracking['status'], { title: string; description: string }> = {
  pending: { title: 'Registration pending', description: 'Your request has been sent to the Platform Manager. We will update this page when there is a decision.' },
  more_details: { title: 'More information needed', description: 'The Platform Manager needs a little more information before deciding.' },
  accepted: { title: 'Registration approved', description: 'Your organisation has been approved.' },
  rejected: { title: 'Registration not approved', description: 'Your request was not approved.' },
};

function Thread({ messages }: { messages: RegistrationMessage[] }) {
  if (messages.length === 0) return null;
  return (
    <section aria-labelledby="thread-title" className="mt-6">
      <h2 id="thread-title" className="mb-3 text-[18px] font-medium text-deep">
        Messages
      </h2>
      <ol className="space-y-3">
        {messages.map((m) => (
          <li key={m.id} className={`rounded-md p-3 ${m.from === 'platform' ? 'bg-mint-soft' : 'border border-line'}`}>
            <p className="text-[14px] text-muted">
              <span className="font-semibold text-deep">{m.from === 'platform' ? 'Platform Manager' : 'You'}</span> · {formatWhen(m.at)}
            </p>
            <p className="mt-1 whitespace-pre-line text-[16px] text-ink">{m.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * The page an organisation lands on after registering. It shows where the request stands, lets the
 * organisation answer a "more details" request, and shows a rejection. Everything comes from the backend.
 */
export default function RegistrationPending() {
  const { reference = '' } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? loadTrackingToken(reference);

  useEffect(() => {
    const fromLink = searchParams.get('token');
    if (fromLink) saveTrackingToken(reference, fromLink);
  }, [reference, searchParams]);

  const { data, loading, error, reload, setData } = useAsync(
    (signal) => (token ? organisationService.getRegistrationStatus(reference, token, signal) : Promise.reject(new ApiError('missing-token'))),
    [reference, token],
  );

  const [response, setResponse] = useState('');
  const [responseError, setResponseError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  // Quietly re-check while the request is still open.
  const status = data?.status;
  useEffect(() => {
    if (!token || (status !== 'pending' && status !== 'more_details')) return undefined;
    const timer = window.setInterval(() => {
      organisationService
        .getRegistrationStatus(reference, token)
        .then(setData)
        .catch(() => undefined);
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [reference, token, status, setData]);

  const submitResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!response.trim()) {
      setResponseError('Write your answer before sending.');
      document.getElementById('response')?.focus();
      return;
    }
    if (!token) return;
    setSending(true);
    try {
      const updated = await organisationService.respondToRegistration(reference, token, response.trim());
      setData(updated);
      setResponse('');
      setSent(true);
    } catch (caught) {
      setFormError(caught instanceof ApiError ? caught.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const footer = (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" leftIcon={<RefreshCw size={14} aria-hidden />} onClick={() => reload()}>
        Check status
      </Button>
      <Button to={ROUTES.organisationLogin} variant="outline" size="sm">
        Organisation Admin login
      </Button>
    </div>
  );

  if (!token) {
    return (
      <AuthLayout title="Registration status" footer={<Button to={ROUTES.organisationRegister} variant="text">Register an organisation</Button>}>
        <Alert severity="info">We can't open this request on this device. Use the link in the email we sent you, or submit a new registration.</Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout wide title={data ? HEADINGS[data.status].title : 'Registration status'} description={data ? HEADINGS[data.status].description : undefined} footer={footer}>
      <AsyncView data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Loading your request…">
        {(r) => {
          const lastFromPlatform = [...r.thread].reverse().find((m) => m.from === 'platform');
          return (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <OrganisationStatus status={r.status} label={r.status === 'pending' ? 'Pending review' : undefined} />
                <p className="text-[14px] text-muted">
                  Reference {r.reference} · Submitted {formatWhen(r.submittedAt)}
                </p>
              </div>

              {r.status === 'rejected' && lastFromPlatform && (
                <div className="mt-4">
                  <Alert severity="error">{lastFromPlatform.message}</Alert>
                </div>
              )}
              {r.status === 'rejected' && !lastFromPlatform && (
                <div className="mt-4">
                  <Alert severity="error">The Platform Manager did not give a reason. You can submit a new registration.</Alert>
                </div>
              )}
              {r.status === 'rejected' && (
                <div className="mt-4">
                  <Button to={ROUTES.organisationRegister} variant="secondary">
                    Submit a new registration
                  </Button>
                </div>
              )}
              {r.status === 'accepted' && (
                <div className="mt-4">
                  <Button to={ROUTES.organisationLogin} variant="primary">
                    Go to Organisation Admin login
                  </Button>
                </div>
              )}

              {r.status === 'more_details' && (
                <form onSubmit={submitResponse} noValidate className="mt-5 space-y-3 rounded-md border border-line p-4">
                  <h2 className="text-[18px] font-medium text-deep">Send the information requested</h2>
                  <ErrorMessage message={formError} />
                  <Textarea
                    id="response"
                    name="response"
                    label="Your response"
                    rows={5}
                    required
                    value={response}
                    onChange={(e) => {
                      setResponse(e.target.value);
                      setResponseError(undefined);
                    }}
                    error={responseError}
                  />
                  <Button type="submit" variant="primary" loading={sending}>
                    Send to Platform Manager
                  </Button>
                </form>
              )}
              {sent && r.status === 'pending' && (
                <div className="mt-5">
                  <Alert severity="success" onDismiss={() => setSent(false)}>
                    Your response has been sent. Your registration is back with the Platform Manager.
                  </Alert>
                </div>
              )}

              <Thread messages={r.thread} />

              <section aria-labelledby="submitted-title" className="mt-6">
                <h2 id="submitted-title" className="mb-1 text-[18px] font-medium text-deep">
                  What you submitted
                </h2>
                <dl className="grid gap-x-10 border-t border-line pt-3 sm:grid-cols-2">
                  <DetailRow layout="stacked" label="Organisation name" value={r.organisationName} />
                  <DetailRow layout="stacked" label="Email" value={r.email} />
                  <DetailRow layout="stacked" label="Organisation type" value={r.organisationType} />
                  <DetailRow layout="stacked" label="Country" value={r.country} />
                  <DetailRow layout="stacked" label="Province / state" value={r.provinceOrState} />
                  <DetailRow layout="stacked" label="City / town" value={r.cityOrTown} />
                  <DetailRow layout="stacked" label="Postal code" value={r.postalCode} />
                </dl>
              </section>
            </div>
          );
        }}
      </AsyncView>
    </AuthLayout>
  );
}
