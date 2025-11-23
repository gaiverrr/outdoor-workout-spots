# Turso Database Setup

## Step 1: Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Or via Homebrew
brew install tursodatabase/tap/turso
```

## Step 2: Sign Up & Authenticate

```bash
# Sign up for Turso (opens browser)
turso auth signup

# Or login if you have an account
turso auth login
```

## Step 3: Create Database

```bash
# Create database for outdoor workout spots
turso db create outdoor-workout-spots --location closest

# Show database URL
turso db show outdoor-workout-spots --url

# Create auth token
turso db tokens create outdoor-workout-spots
```

## Step 4: Add to Environment Variables

Add to `.env.local`:

```bash
TURSO_DATABASE_URL="libsql://outdoor-workout-spots-[your-org].turso.io"
TURSO_AUTH_TOKEN="your-auth-token-here"
```

## Step 5: Initialize Database Schema

```bash
npm run db:setup
```

## Step 6: Migrate Data

```bash
npm run db:migrate
```

## Turso CLI Cheat Sheet

```bash
# List databases
turso db list

# Connect to database shell
turso db shell outdoor-workout-spots

# Show database info
turso db show outdoor-workout-spots

# Destroy database (careful!)
turso db destroy outdoor-workout-spots
```

## Free Tier Limits

- 500 databases
- 1 billion row reads per month
- 25 million row writes per month
- 10 GB total storage

Perfect for this project!
