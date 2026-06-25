import {
  getCurrentUser,
  fetchUserAttributes,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  signUp as amplifySignUp,
  autoSignIn,
} from 'aws-amplify/auth'
import { configureAmplify } from './amplify-config'

export interface AuthUser {
  userId: string
  email: string
  name: string
  company: string
}

function ensureConfigured() {
  configureAmplify()
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

export async function signIn(email: string, password: string) {
  ensureConfigured()
  const result = await amplifySignIn({ username: email, password })
  if (!result.isSignedIn) {
    throw new Error('Sign-in could not be completed.')
  }
}

export async function signUp(input: {
  email: string
  password: string
  name: string
  company: string
}) {
  ensureConfigured()
  const { nextStep } = await amplifySignUp({
    username: input.email,
    password: input.password,
    options: {
      userAttributes: {
        email: input.email,
        name: input.name,
        'custom:company': input.company,
      },
      autoSignIn: true,
    },
  })

  if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
    await autoSignIn()
  }
}

export async function signOut() {
  ensureConfigured()
  await amplifySignOut()
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
