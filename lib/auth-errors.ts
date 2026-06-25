import { AuthError } from 'aws-amplify/auth'

type AuthErrorContext = 'signIn' | 'signUp'

const SIGN_IN_GENERIC = 'Incorrect email or password.'
const SIGN_UP_GENERIC = 'Could not create account. Please try again.'

function errorName(err: unknown): string | undefined {
  if (err instanceof AuthError) return err.name
  if (err && typeof err === 'object' && 'name' in err && typeof err.name === 'string') {
    return err.name
  }
  return undefined
}

export function mapAuthError(err: unknown, context: AuthErrorContext): string {
  switch (errorName(err)) {
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return SIGN_IN_GENERIC
    case 'UserNotConfirmedException':
      return 'Please verify your email before signing in.'
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
      return context === 'signIn' ? SIGN_IN_GENERIC : SIGN_UP_GENERIC
  }
}
