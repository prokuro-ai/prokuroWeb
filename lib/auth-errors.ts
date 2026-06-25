import { AuthError } from 'aws-amplify/auth'

type AuthErrorContext = 'signIn' | 'signUp'

const SIGN_IN_GENERIC = 'Incorrect email or password.'
const SIGN_UP_GENERIC = 'Could not create account. Please try again.'

export class EmailConfirmationRequired extends Error {
  readonly email: string

  constructor(email: string) {
    super('Email confirmation required')
    this.name = 'EmailConfirmationRequired'
    this.email = email
  }
}

function errorName(err: unknown): string | undefined {
  if (err instanceof EmailConfirmationRequired) return err.name
  if (err instanceof AuthError) return err.name
  if (err && typeof err === 'object' && 'name' in err && typeof err.name === 'string') {
    return err.name
  }
  return undefined
}

export function mapAuthError(err: unknown, context: AuthErrorContext): string {
  if (err instanceof EmailConfirmationRequired) {
    return 'Please verify your email before signing in.'
  }

  switch (errorName(err)) {
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return SIGN_IN_GENERIC
    case 'UserNotConfirmedException':
    case 'EmailConfirmationRequired':
      return 'Please verify your email before signing in.'
    case 'CodeMismatchException':
      return 'Invalid verification code. Please try again.'
    case 'ExpiredCodeException':
      return 'Verification code expired. Request a new code and try again.'
    case 'UsernameExistsException':
      return 'An account with this email already exists.'
    case 'InvalidPasswordException':
      return 'Password does not meet requirements.'
    case 'InvalidParameterException':
      return context === 'signUp'
        ? 'Please check your details and try again.'
        : SIGN_IN_GENERIC
    case 'TooManyRequestsException':
    case 'LimitExceededException':
      return 'Too many attempts. Please try again later.'
    default:
      if (err instanceof Error && err.message.includes('verify')) {
        return err.message
      }
      return context === 'signIn' ? SIGN_IN_GENERIC : SIGN_UP_GENERIC
  }
}

export function isEmailConfirmationRequired(err: unknown): err is EmailConfirmationRequired {
  return err instanceof EmailConfirmationRequired
}
