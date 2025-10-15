#!/bin/bash

# This script removes duplicate SessionProvider components from Next.js pages

# Fix workers page
sed -i '' 's/import { useSession, SessionProvider } from '\''next-auth\/react'\'';/import { useSession } from '\''next-auth\/react'\'';/' web/src/app/dashboard/workers/page.tsx
sed -i '' 's/<SessionProvider>[ ]*<WorkersPageContent \/>[ ]*<\/SessionProvider>/<WorkersPageContent \/>/' web/src/app/dashboard/workers/page.tsx

# Fix tasks page
sed -i '' 's/import { useSession, SessionProvider } from '\''next-auth\/react'\'';/import { useSession } from '\''next-auth\/react'\'';/' web/src/app/dashboard/tasks/page.tsx
sed -i '' 's/<SessionProvider>[ ]*<TasksPageContent \/>[ ]*<\/SessionProvider>/<TasksPageContent \/>/' web/src/app/dashboard/tasks/page.tsx

# Fix schedule page
sed -i '' 's/import { useSession, SessionProvider } from '\''next-auth\/react'\'';/import { useSession } from '\''next-auth\/react'\'';/' web/src/app/dashboard/schedule/page.tsx
sed -i '' 's/<SessionProvider>[ ]*<SchedulePageContent \/>[ ]*<\/SessionProvider>/<SchedulePageContent \/>/' web/src/app/dashboard/schedule/page.tsx

# Fix messages page
sed -i '' 's/import { useSession, SessionProvider } from '\''next-auth\/react'\'';/import { useSession } from '\''next-auth\/react'\'';/' web/src/app/dashboard/messages/page.tsx
sed -i '' 's/<SessionProvider>[ ]*<MessagesPageContent \/>[ ]*<\/SessionProvider>/<MessagesPageContent \/>/' web/src/app/dashboard/messages/page.tsx

# Fix applications page
sed -i '' 's/import { useSession, SessionProvider } from '\''next-auth\/react'\'';/import { useSession } from '\''next-auth\/react'\'';/' web/src/app/dashboard/applications/page.tsx
sed -i '' 's/<SessionProvider>[ ]*<ApplicationsPageContent \/>[ ]*<\/SessionProvider>/<ApplicationsPageContent \/>/' web/src/app/dashboard/applications/page.tsx

# Fix analytics page
sed -i '' 's/import { useSession, SessionProvider } from '\''next-auth\/react'\'';/import { useSession } from '\''next-auth\/react'\'';/' web/src/app/dashboard/analytics/page.tsx
sed -i '' 's/<SessionProvider>[ ]*<AnalyticsPageContent \/>[ ]*<\/SessionProvider>/<AnalyticsPageContent \/>/' web/src/app/dashboard/analytics/page.tsx

echo "Fixed SessionProvider issues in all pages"
