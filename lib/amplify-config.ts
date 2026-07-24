import { Amplify } from 'aws-amplify'

let configured = false

export function configureAmplify() {
  if (configured) return

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN

  if (!userPoolId || !userPoolClientId) return

  const origin = typeof window === 'undefined' ? undefined : window.location.origin

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        ...(cognitoDomain && origin
          ? {
              loginWith: {
                oauth: {
                  domain: cognitoDomain,
                  scopes: [
                    'openid',
                    'email',
                    'profile',
                    'aws.cognito.signin.user.admin',
                  ],
                  redirectSignIn: [`${origin}/auth/callback`],
                  redirectSignOut: [`${origin}/`],
                  responseType: 'code' as const,
                },
              },
            }
          : {}),
      },
    },
  })

  configured = true
}
