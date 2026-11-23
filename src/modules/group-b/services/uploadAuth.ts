import { supabase } from '../supabase'
import { toHttps } from '../../../lib/secureUrl'

export interface UploadAuthContext {
  accessToken: string
  userId: string
  organisationId: number
}

/**
 * Resolve an organisation the signed-in user is allowed to administer.
 * Memberships.user_id references Profiles.id, not auth.users.id.
 */
export async function getUploadAuthContext(
  preferredOrganisationId?: number | string | null,
): Promise<UploadAuthContext> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError

  const session = sessionData.session
  if (!session?.user || !session.access_token) {
    throw new Error('Please sign in before uploading or managing materials.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('Profiles')
    .select('id, platform_role')
    .eq('auth_user_id', session.user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Your LORIS profile could not be verified.')
  }

  let organisationIds: number[] = []

  if (profile.platform_role === 'platform_manager') {
    const { data: organisations, error } = await supabase
      .from('Organisation')
      .select('id')
      .order('id', { ascending: true })
    if (error) throw error
    organisationIds = (organisations ?? []).map((item) => Number(item.id))
  } else {
    const { data: memberships, error } = await supabase
      .from('Memberships')
      .select('organisation_id')
      .eq('user_id', profile.id)
      .eq('role', 'admin')
      .eq('status', 'active')
    if (error) throw error
    organisationIds = (memberships ?? []).map((item) => Number(item.organisation_id))
  }

  const uniqueIds = [...new Set(organisationIds.filter(Number.isFinite))]
  const selectedId = preferredOrganisationId == null
    ? null
    : Number(preferredOrganisationId)

  if (selectedId != null && uniqueIds.includes(selectedId)) {
    return { accessToken: session.access_token, userId: session.user.id, organisationId: selectedId }
  }

  if (uniqueIds.length === 1) {
    return { accessToken: session.access_token, userId: session.user.id, organisationId: uniqueIds[0] }
  }

  if (uniqueIds.length === 0) {
    throw new Error('Your account does not have an active organisation-admin membership.')
  }

  throw new Error('Your account administers multiple organisations. Select the target organisation before continuing.')
}

export function getUploadApiBaseUrl(): string {
  const value = import.meta.env.VITE_API_BASE_URL
  if (!value) throw new Error('VITE_API_BASE_URL is not configured.')
  return toHttps(value.replace(/\/$/, ''))
}
