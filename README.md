# PA-Infotel-s

# Project Setup

- Backend: NestJS, MySQL, and Passport for authentication.
- Authentication Libraries: passport, passwort jwt, passport google oauth20
- Environment Variables: .env

# 1. Authentication Flow

# a. Basic Auth (email + password):

# - Register:

- Endpoint: `POST /api/users/`
- Process:
  - Validate email and password.
  - Hash password using bcrypt.
  - Store user in the database with the hashed password.
  - Send a response confirming successful registration

# - Login

- Endpoint: `POST /api/auth/login`
- Process:
  - Validate email and password.
  - Compare provided password with stored hash using bcrypt.
  - If valid, generate an access token and refresh token.
  - Set these tokens in HTTP-only cookies.
  - Send a response with user data

# b. JWT Authentication

- Endpoints:
  - `POST /api/auth/refresh`: handle refresh token rotation
  - `POST /api/auth/logout`: handle logout user login
- Process:
  - Store refresh token in db when create user.
  - When Authentication user, update refresh token follow user's ID
  - If valid, generate a new token, replace the old refresh token in the database, and send the new tokens in the response.

# c. Google Login

- OAuth2.0 with Passport.js
  - Endpoint: `GET /api/auth/google/login` : initiate login.
  - Callback: `GET /api/auth/google/redirect` : handle Google's response.
- Process
  - Redirect the user to Google for authentication.
  - On successful authentication, check if the user exists in your database.
  - If they do, generate tokens and log them in.
  - If not, create a new user record, then generate tokens.
  - Set tokens in HTTP-only cookies and redirect to the frontend

# 2. XML processing

- algorithm Process

  - The function starts by removing any XML declaration tags (e.g., <?xml ...?>) using a regular expression.
  - Find XML tags and their corresponding content.
  - For each XML tag, it checks whether the content contains other tags (i.e., child elements).
  - If child elements are found, the function recursively parses these children and constructs a nested JSON object.

- algorithm complexity
  - The algorithm is designed to be linear in complexity, O(n)
