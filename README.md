# Online Casino - Slots Platform

A full-stack online casino platform focused on slot games, built with React, Express, and PostgreSQL.

## Features

- Multiple slot games with different themes and mechanics
- Real-time functionality using WebSockets
- Virtual balance system with betting
- Game categories and filtering
- Responsive design for mobile and desktop
- Database integration for persistent data

## Technology Stack

- **Frontend**: React, TailwindCSS, Shadcn UI
- **Backend**: Express.js, WebSockets
- **Database**: PostgreSQL with Drizzle ORM
- **API**: RESTful endpoints for game data and transactions

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── contexts/       # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Page components
│
├── server/                 # Backend Express application
│   ├── controllers/        # Route handlers
│   ├── index.ts            # Server entry point
│   └── routes.ts           # API route definitions
│
├── db/                     # Database related files
│   ├── index.ts            # Database connection
│   └── seed.ts             # Database seeding logic
│
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema definitions
│
└── config.ts               # Application configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (or Supabase account)

### Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd online-casino
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database connection string:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/casino_db
   ```

5. Push the database schema:
   ```bash
   npm run db:push
   ```

6. Seed the database with initial data:
   ```bash
   npm run db:seed
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

8. Open your browser and navigate to `http://localhost:5000`

## Environment Configuration

The application uses a central configuration module (`config.ts`) that loads environment variables. Here are the important environment variables:

- `DATABASE_URL`: PostgreSQL connection string (required)
- `PORT`: Server port (defaults to 5000)
- `NODE_ENV`: Environment mode (development/production)
- `ENABLE_LOGGING`: Enable/disable detailed logging
- `CORS_ORIGIN`: CORS origin setting for API requests

## Database Schema

The application uses Drizzle ORM with a PostgreSQL database. The schema includes:

- `categories`: Game categories
- `games`: Slot game definitions
- `userBalance`: User balance tracking
- `transactions`: Transaction history for bets and wins

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## License

[MIT License](LICENSE)

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) - UI component library
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [TailwindCSS](https://tailwindcss.com/) - CSS framework