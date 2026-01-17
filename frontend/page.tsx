import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to login or dashboard
  redirect('/login');
}