import { AuthProvider } from '@/hooks/useAuth'

export default function TechnicienLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
