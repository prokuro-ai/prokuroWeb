import { Amplify } from 'aws-amplify'

let configured = false

export function configureAmplify() {
  if (configured) return

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

  if (!userPoolId || !userPoolClientId) return

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  })

  configured = true
}
