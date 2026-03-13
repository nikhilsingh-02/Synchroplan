# Components Overview

## Authentication Component

### ProtectedRoute.tsx

A higher-order component that wraps routes requiring authentication.

**Purpose:**
- Checks if user is authenticated before rendering children
- Shows loading spinner while checking auth state
- Redirects to `/login` if user is not authenticated

**Usage:**
```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>
```

**Props:**
- `children`: React.ReactNode - The component(s) to render if authenticated

**Behavior:**
1. Accesses `useAuth()` hook to get user and loading state
2. If `loading === true`: Shows loading spinner
3. If `loading === false && !user`: Redirects to `/login`
4. If `loading === false && user`: Renders children

**Example in Router:**
```typescript
{
  path: "/",
  element: (
    <ProtectedRoute>
      <RootLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, Component: Dashboard },
    { path: "schedule", Component: Schedule },
  ],
}
```

This ensures all child routes inherit the authentication requirement.
