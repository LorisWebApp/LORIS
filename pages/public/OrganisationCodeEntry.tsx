import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button } from '../../components/shared';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { useOrganisation } from '../../hooks/useOrganisation';
import { ROUTES } from '../../routes/paths';
import { ApiError } from '../../services/http';
import { validateOrganisationCode } from '../../services/organisation.service';

function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'CODE_EXPIRED' || err.status === 410) return 'This code has expired. Ask your organisation for a new one.';
    if (err.code === 'CODE_USED') return 'This code has already been used.';
    if (err.status === 400 || err.status === 404) return "That code isn't valid. Check it and try again.";
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

/** Public step 1 of joining an organisation: validate the invitation code, then continue to /register. */
export function OrganisationCodeEntry() {
  const navigate = useNavigate();
  const { setOrganisation } = useOrganisation();
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    setFormError(null);
    if (!trimmed) return setFieldError('Enter your invitation code.');
    setFieldError(null);

    setSubmitting(true);
    try {
      const res = await validateOrganisationCode(trimmed);
      if (!res.valid || !res.organisation) {
        setFormError("That code isn't valid. Check it and try again.");
        return;
      }
      setOrganisation({ id: res.organisation.id, name: res.organisation.name, code: trimmed });
      navigate(`${ROUTES.register}?code=${encodeURIComponent(trimmed)}`);
    } catch (err) {
      setFormError(messageFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Join an Organisation"
      description="Enter the invitation code you received from your organisation."
      footer={
        <p className="space-x-1">
          <Link to={ROUTES.login} className="font-semibold text-deep underline underline-offset-4">Back to login</Link>
          <span>·</span>
          <Link to={ROUTES.organisationRegistration} className="font-semibold text-deep underline underline-offset-4">Register an organisation</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <Input label="Invitation Code" autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => { setCode(e.target.value); setFieldError(null); }} error={fieldError ?? undefined} disabled={submitting} />
        <Button type="submit" variant="secondary" loading={submitting}>Continue</Button>
      </form>
    </AuthLayout>
  );
}
