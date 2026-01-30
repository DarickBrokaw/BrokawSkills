# User Authentication

## Job to Be Done (JTBD)
Allow users to create accounts, log in, and log out securely.

## Acceptance Criteria
- [ ] Users can register with email/password
- [ ] Users can log in with registered credentials
- [ ] Sessions persist across page reloads
- [ ] Users can log out
- [ ] Invalid credentials show error message
- [ ] Passwords are hashed before storage

## Constraints
- Use bcrypt for password hashing
- Store sessions in HTTP-only cookies
- JWT tokens for API authentication

## Implementation Notes
- User model in src/models/user.ts
- Auth controller in src/controllers/auth.ts
- Use existing database connection from src/lib/db.ts
