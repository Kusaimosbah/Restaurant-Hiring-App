import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      restaurant?: any
      workerProfile?: any
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    restaurant?: any
    workerProfile?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    restaurant?: any
    workerProfile?: any
  }
}