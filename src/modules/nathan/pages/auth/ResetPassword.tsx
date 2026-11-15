import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button } from '../../components/shared';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { ROUTES } from '../../routes/paths';
import { resetPassword } from '../../services/auth.service';
import { ApiError } from '../../services/http';
import { getErrorMessage, validateConfirm, validatePassword, type FieldErrors } from '../../utils/validation';

/** "Create Password" screen reached from the emailed reset link (?token=...). */
export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requestNewLink = (
    <Link to={ROUTES.forgotPassword} className="font-semibold text-deep underline underline-offset-4">Request a new reset link</Link>
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    const found: FieldErrors = {};
    const pw = validatePassword(password);
    const cf = validateConfirm(password, confirm);
    if (pw) found.password = pw;
    if (cf) found.confirm = cf;
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate(ROUTES.login, { replace: true, state: { notice: 'Your password has been updated. Log in with your new password.' } });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 404 || err.status === 410) && !err.fieldErrors) {
        setLinkExpired(true);
      } else {
        if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
        setFormError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token || linkExpired) {
    return (
      <AuthLayout title="Create Password" footer={requestNewLink}>
        <Alert severity="error" title="This reset link isn't valid">
          {linkExpired ? 'It may have expired or already been used.' : 'The link is missing its reset token.'}
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Password" footer={<Link to={ROUTES.login} className="font-semibold text-deep underline underline-offset-4">Back to login</Link>}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert severity="error">{formError}</Alert>}
        <Input label="Enter Password" type="password" autoComplete="new-password" hint="At least 8 characters, with a letter and a number." value={password} onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: '' })); }} error={errors.password} disabled={submitting} />
        <Input label="Confirm Password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setErrors((x) => ({ ...x, confirm: '' })); }} error={errors.confirm} disabled={submitting} />
        <div className="flex justify-center pt-2">
          <Button type="submit" variant="secondary" loading={submitting}>Submit</Button>
        </div>
      </form>
    </AuthLayout>
  );
}
