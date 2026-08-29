import {
  AuthError,
  getCurrentUser,
  fetchUserAttributes,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  confirmSignUp,
  confirmSignIn,
  resendSignUpCode,
  updateUserAttributes,
  autoSignIn,
} from 'aws-amplify/auth'
import { configureAmplify } from './amplify-config'

export interface AuthUser {
  userId: string
  email: string
  firstName: string
  lastName: string
  company: string
}

export type EmailVerificationFlow = 'signUp' | 'signIn'

function authErrorName(err: unknown): string | undefined {
  if (err instanceof AuthError) return err.name
  if (err && typeof err === 'object' && 'name' in err && typeof err.name === 'string') {
    return err.name
  }
  return undefined
}

function ensureConfigured() {
  configureAmplify()
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function cleanAttrName(value: string | undefined): string {
  const trimmed = value?.trim() ?? ''
  return trimmed === '-' ? '' : trimmed
}

export async function getAuthUser(): Promise<AuthUser | null> {
  ensureConfigured()
  try {
    const current = await getCurrentUser()
    const attributes = await fetchUserAttributes()
    return {
      userId: current.userId,
      email: attributes.email ?? '',
      firstName: cleanAttrName(attributes.given_name),
      lastName: cleanAttrName(attributes.family_name),
      company: attributes['custom:company'] ?? '',
    }
  } catch {
    return null
  }
}

export async function startEmailVerification(
  email: string,
  names?: { firstName: string; lastName: string },
): Promise<EmailVerificationFlow> {
  ensureConfigured()
  const username = normalizeEmail(email)
  const given = cleanAttrName(names?.firstName)
  const family = cleanAttrName(names?.lastName)

  try {
    await amplifySignUp({
      username,
      options: {
        userAttributes: {
          email: username,
          // Cognito requires given_name/family_name; prefer real names.
          given_name: given || '-',
          family_name: family || '-',
        },
        autoSignIn: {
          authFlowType: 'USER_AUTH',
        },
      },
    })
    return 'signUp'
  } catch (err) {
    if (authErrorName(err) !== 'UsernameExistsException') {
      throw err
    }

    try {
      await amplifySignIn({
        username,
        options: {
          authFlowType: 'USER_AUTH',
          preferredChallenge: 'EMAIL_OTP',
        },
      })
      return 'signIn'
    } catch (signInErr) {
      if (authErrorName(signInErr) === 'UserNotConfirmedException') {
        await resendSignUpCode({ username })
        return 'signUp'
      }
      throw signInErr
    }
  }
}

export async function startEmailLogin(email: string): Promise<EmailVerificationFlow> {
  ensureConfigured()
  const username = normalizeEmail(email)

  try {
    await amplifySignIn({
      username,
      options: {
        authFlowType: 'USER_AUTH',
        preferredChallenge: 'EMAIL_OTP',
      },
    })
    return 'signIn'
  } catch (err) {
    if (authErrorName(err) === 'UserNotConfirmedException') {
      await resendSignUpCode({ username })
      return 'signUp'
    }
    throw err
  }
}

export async function completeEmailVerification(
  email: string,
  code: string,
  flow: EmailVerificationFlow,
) {
  ensureConfigured()
  const username = normalizeEmail(email)
  const confirmationCode = code.trim()

  if (flow === 'signUp') {
    const { nextStep } = await confirmSignUp({ username, confirmationCode })
    if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
      await autoSignIn()
    }
  } else {
    await confirmSignIn({ challengeResponse: confirmationCode })
  }

  if (!(await getAuthUser())) {
    throw new Error('Verification succeeded but sign-in could not be completed.')
  }
}

export async function signInWithGoogle() {
  ensureConfigured()
  const { signInWithRedirect } = await import('aws-amplify/auth')
  await signInWithRedirect({ provider: 'Google' })
}

export async function signOut() {
  ensureConfigured()
  await amplifySignOut({ global: false })
}

export async function updateProfile(input: {
  firstName?: string
  lastName?: string
  company?: string
}) {
  ensureConfigured()
  const attributes: Record<string, string> = {}
  if (input.firstName !== undefined) attributes.given_name = input.firstName.trim()
  if (input.lastName !== undefined) attributes.family_name = input.lastName.trim()
  if (input.company !== undefined) attributes['custom:company'] = input.company
  if (Object.keys(attributes).length === 0) return
  await updateUserAttributes({ userAttributes: attributes })
  const { fetchAuthSession } = await import('aws-amplify/auth')
  await fetchAuthSession({ forceRefresh: true })
}

export function displayNameForUser(user: AuthUser): string {
  const full = [cleanAttrName(user.firstName), cleanAttrName(user.lastName)]
    .filter(Boolean)
    .join(' ')
  return full || user.email
}

export function initialsForUser(user: AuthUser): string {
  const first = cleanAttrName(user.firstName)
  const last = cleanAttrName(user.lastName)
  if (first || last) {
    const initials = [first[0], last[0]].filter(Boolean).map((char) => char.toUpperCase())
    if (initials.length > 0) return initials.join('')
  }
  return user.email.slice(0, 2).toUpperCase()
}

export async function getIdToken(): Promise<string | null> {
  ensureConfigured()
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth')
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() ?? null
  } catch {
    return null
  }
}
