import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Input } from '../../components/common/Input';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { Alert } from '../../components/shared';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../services/api';
import type { LoginPortal, UserRole } from '../../types/user';
import { ROUTES } from '../../utils/constants';
import { required, validEmail, validate } from '../../utils/validators';

interface PortalConfig {
  title: string;
  role: UserRole;
  asksForOrganisation: boolean;
  registerLink: { prompt: string; label: string; to: string } | null;
}

const portals: Record<LoginPortal, PortalConfig> = {
  platform: { title: 'Platform Manager Login', role: 'platform_manager', asksForOrganisation: false, registerLink: null },
  organisation: {
    title: 'Organisation Admin Login',
    role: 'organisation_admin',
    asksForOrganisation: true,
    registerLink: { prompt: 'Is your organisation not registered yet?', label: 'Request registration', to: ROUTES.organisationRegister },
  },
};

const portalLinks: Array<{ portal: LoginPortal; label: string; to: string }> = [
  { portal: 'organisation', label: 'Organisation Admin login', to: ROUTES.organisationLogin },
  { portal: 'platform', label: 'Platform Manager login', to: ROUTES.platformLogin },
];

interface Values {
  organisationName: string;
  email: string;
  password: string;
}
type Errors = Partial<Record<keyof Values, string>>;

/** Sign-in for the Platform Manager and Organisation Admin pages; the portal decides the title, fields and expected role. */
export default function Login({ portal }: { portal: LoginPortal }) {
  const config = portals[portal];
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<Values>({ organisationName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [signedInNote, setSignedInNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof Values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSignedInNote(null);

    const found = validate(values, {
      organisationName: config.asksForOrganisation ? required('Organisation name') : undefined,
      email: validEmail,
      password: required('Password'),
    });
    setErrors(found);
    const firstInvalid = (['organisationName', 'email', 'password'] as const).find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const user = await login({
        portal,
        email: values.email.trim(),
        password: values.password,
        ...(config.asksForOrganisation ? { organisationName: values.organisationName.trim() } : {}),
      });
      // A portal never admits an account of a different role.
      if (user.role !== config.role) {
        await logout().catch(() => undefined);
        setFormError('This account cannot sign in here. Use the sign-in page for your account type.');
        return;
      }
      if (portal === 'platform') {
        navigate(ROUTES.platformDashboard, { replace: true });
      } else {
        setSignedInNote('You are signed in. The organisation dashboard is not part of this release yet.');
      }
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={config.title}
      footer={
        <div className="space-y-4">
          {config.registerLink && (
            <p>
              {config.registerLink.prompt}{' '}
              <Button to={config.registerLink.to} variant="text" size="sm">
                {config.registerLink.label}
              </Button>
            </p>
          )}
          <nav aria-label="Other sign-in pages" className="flex flex-wrap gap-2">
            {portalLinks
              .filter((link) => link.portal !== portal)
              .map((link) => (
                <Button key={link.portal} to={link.to} variant="outline" size="sm">
                  {link.label}
                </Button>
              ))}
          </nav>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <ErrorMessage message={formError} />
        {signedInNote && <Alert severity="success">{signedInNote}</Alert>}
        {config.asksForOrganisation && (
          <Input id="organisationName" name="organisationName" label="Organisation Name" autoComplete="organization" required value={values.organisationName} onChange={update('organisationName')} error={errors.organisationName} />
        )}
        <Input id="email" name="email" type="email" label={portal === 'organisation' ? 'Admin Email' : 'Email'} autoComplete="username" required value={values.email} onChange={update('email')} error={errors.email} />
        <Input id="password" name="password" type="password" label="Password" autoComplete="current-password" required value={values.password} onChange={update('password')} error={errors.password} />
        <div>
          <Button to={ROUTES.forgotPassword} variant="text" size="sm">
            Forgot Password?
          </Button>
        </div>
        <Button type="submit" variant="primary" loading={submitting} fullWidth>
          Login
        </Button>
      </form>
    </AuthLayout>
  );
}
