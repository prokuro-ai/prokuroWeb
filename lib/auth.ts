import {
  getCurrentUser,
  fetchUserAttributes,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  confirmSignUp,
  updateUserAttributes,
  autoSignIn,
} from 'aws-amplify/auth'
import { configureAmplify } from './amplify-config'
import { EmailConfirmationRequired } from './auth-errors'

export interface AuthUser {
  userId: string
  email: string
  name: string
  company: string
}

export type AuthFlowStatus = 'signedIn' | 'confirmSignUp'

function ensureConfigured() {
  configureAmplify()
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function completeSignIn(username: string, password: string) {
  const result = await amplifySignIn({
    username,
    password,
    options: { authFlowType: 'USER_PASSWORD_AUTH' },
  })

  if (result.isSignedIn) return

  if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
    throw new EmailConfirmationRequired(username)
  }

  throw new Error('Sign-in could not be completed.')
}

export async function getAuthUser(): Promise<AuthUser | null> {
  ensureConfigured()
  try {
    const current = await getCurrentUser()
    const attributes = await fetchUserAttributes()
    return {
      userId: current.userId,
      email: attributes.email ?? '',
      name: attributes.name ?? '',
      company: attributes['custom:company'] ?? '',
    }
  } catch {
    return null
  }
}

export async function signIn(email: string, password: string): Promise<AuthFlowStatus> {
  ensureConfigured()
  const username = normalizeEmail(email)
  await completeSignIn(username, password)
  return 'signedIn'
}

export async function signUp(input: {
  email: string
  password: string
  name: string
  company: string
}): Promise<AuthFlowStatus> {
  ensureConfigured()
  const username = normalizeEmail(input.email)
  const { nextStep } = await amplifySignUp({
    username,
    password: input.password,
    options: {
      userAttributes: {
        email: username,
        name: input.name,
        'custom:company': input.company,
      },
      autoSignIn: true,
    },
  })

  if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
    await autoSignIn()
  } else if (nextStep.signUpStep === 'DONE') {
    await completeSignIn(username, input.password)
  } else if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
    return 'confirmSignUp'
  }

  if (await getAuthUser()) return 'signedIn'
  return 'confirmSignUp'
}

export async function confirmAccount(email: string, code: string, password?: string) {
  ensureConfigured()
  const username = normalizeEmail(email)
  const { nextStep } = await confirmSignUp({
    username,
    confirmationCode: code.trim(),
  })

  if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
    await autoSignIn()
  } else if (password) {
    await completeSignIn(username, password)
  }

  if (!(await getAuthUser())) {
    throw new Error('Account verified. Please sign in with your email and password.')
  }
}

export async function signOut() {
  ensureConfigured()
  await amplifySignOut()
}

export async function updateProfile(input: { name?: string; company?: string }) {
  ensureConfigured()
  const attributes: Record<string, string> = {}
  if (input.name !== undefined) attributes.name = input.name
  if (input.company !== undefined) attributes['custom:company'] = input.company
  if (Object.keys(attributes).length === 0) return
  await updateUserAttributes({ userAttributes: attributes })
}

export function initialsForUser(user: AuthUser): string {
  if (user.name.trim()) {
    const parts = user.name.trim().split(/\s+/)
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('')
  }
  return user.email.slice(0, 2).toUpperCase()
}
