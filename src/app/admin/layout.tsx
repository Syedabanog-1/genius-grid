import AdminLayout from '@/components/admin/AdminLayout'

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The layout wraps both login and other admin pages
  // Middleware already protects non-login routes
  return <AdminLayout>{children}</AdminLayout>
}
