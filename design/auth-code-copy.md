# Auth verification code copy

Cognito `USER_AUTH` / email OTP codes are not always six digits (often eight). The confirm UI said "6-digit code", which confuses sign-up.

Change placeholder to `Enter code`. No Cognito or CDK change.