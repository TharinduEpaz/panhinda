# Plug and Play CMS (React)

## Summary of the User Experience

- **The Public**: They visit your-site.com. They see your beautiful static content. They have no idea it's a CMS.
- **You (The Admin)**:
  1. You go to your site.
  2. You click a hidden "Login" link (or a small floating button).
  3. You log in via Supabase (Google, Email/Pass, etc.).
  4. The site refreshes, and suddenly blue dashed lines appear around your titles and paragraphs.
  5. You click, type, and click away. Saved.

## Recommended Tech Stack

Since you are already comfortable with React, FastAPI, and now Supabase, here is the most efficient path:

- **Frontend Library**: Create a React Context Provider (CMSProvider) that holds your Supabase client and "Edit Mode" state.
- **Database Schema**: A simple table called `site_content` with columns: `id` (text, primary key), `content` (jsonb), and `last_updated`.
- **Security (The most important part)**: Use Supabase Row Level Security (RLS).
  - **SELECT**: Allow anon (everyone) to read.
  - **UPDATE**: Allow only authenticated users (you) to write

### Conceptual Usage

```jsx
<Editable id="home-title">
  <h1>My Static Title</h1>
</Editable>
```

## Why this is better than "In-Repo" SQLite approach

- **Instant Updates**: When you save an edit, it's live immediately. You don't have to wait 3–5 minutes for a GitHub Action to rebuild your site.
- **Authentication**: You can easily wrap your "Save" function in a login check (like the Keycloak setup you've been working on) so only you can edit the site, but everyone can view it.
- **Scale**: If your site gets 1,000 visitors, a remote database handles it easily. A SQLite file in a repo can sometimes get "locked" if too many people try to access or build it at once.

## How your library would look (Code-wise) - sample 

If you host the DB separately, your library initialization would just need a URL and an API key:

```jsx
// App.js
import { CMSProvider } from 'your-library';

const config = {
  apiUrl: "https://your-separate-api.com",
  apiKey: "your-secret-token"
};

function App() {
  return (
    <CMSProvider config={config}>
      <Editable id="hero-title">
        <h1>Welcome to my site</h1>
      </Editable>
    </CMSProvider>
  );
}
```

## The "Backend-as-a-Service" (BaaS) Path

Services like Supabase or Firebase allow you to talk to the database directly from the frontend because they replace a traditional backend with Security Rules.

- **How it works**: You use their JS library in your React app.
- **Security**: Instead of a password, you use Row Level Security (RLS). You write a rule in their dashboard that says: "Only allow a user to update this title if they are logged in as the Admin."
- **Verdict**: This is the easiest "no-backend" way to achieve your goal.

---

## Security and Log in

### The Strategy: Two-Layer Security

To ensure only you (the authorized user) can see the "Edit" UI and save changes, you need:

1. **Frontend Gate**: A check in your React library to see if a user is logged in. If yes, show the editing tools.
2. **Database Gate (RLS)**: A rule in Supabase that says: "Everyone can see the text, but only logged-in users can update it."

```sql
-- 1. Enable RLS on your content table
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- 2. Allow EVERYONE (even non-logged in users) to see the content
CREATE POLICY "Public Read Access" 
ON site_content FOR SELECT 
TO anon, authenticated 
USING (true);

-- 3. Allow ONLY logged-in users to update the content
CREATE POLICY "Admin Update Access" 
ON site_content FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

### The React Library Logic

Your CMSProvider should handle the authentication state. Here is how you can structure the "Edit Mode" toggle.

```jsx
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(URL, KEY);

export const CMSProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // Check if a user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CMSContext.Provider value={{ user, isEditMode, setIsEditMode }}>
      {children}
      {/* Show a "Login" button at the bottom if not logged in */}
      {!user && <AdminLoginButton />}
      {/* Show an "Edit Mode" toggle if logged in */}
      {user && <EditToggle onToggle={() => setIsEditMode(!isEditMode)} />}
    </CMSContext.Provider>
  );
};
```

