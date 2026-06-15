// Auth pages (login, unauthorized) use this layout — no sidebar
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
