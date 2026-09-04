import { redirect } from 'next/navigation';

// Trang root / redirect về /admin
export default function RootPage() {
  redirect('/admin');
}
