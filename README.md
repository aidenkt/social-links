## 🔗 Linktree Sucks.
And costs money. 

[aiden.social](https://aiden.social) is a better way to follow me across the internet.

<img width="1708" height="1005" alt="image" src="https://github.com/user-attachments/assets/3f4157bc-dca4-4b8b-90cf-2ee46b6f489e" />

## Owner sign-in (Sign in with KT Account)

Aiden signs in at `/login` (not linked anywhere) with his KT Account over OpenID Connect
(code flow + PKCE, confidential client, checked on the server). Only the KT Accounts owner
(`is_owner`) gets a session; visitors see the page unchanged.

Environment variables (Vercel, production and preview; never `NEXT_PUBLIC_`):

- `KT_CLIENT_ID`
- `KT_CLIENT_SECRET`
- `SESSION_SECRET` (at least 32 characters)
- `KT_ACCOUNTS_ORIGIN` (optional, local mocks only)
- `KT_REDIRECT_URI` (optional; defaults to `<origin>/auth/callback`)

`npm test` runs the sign-in tests. `node scripts/make-owner-picture.mjs` rebuilds the
512x512 picture reported to KT Accounts from `public/favicon.png`.
