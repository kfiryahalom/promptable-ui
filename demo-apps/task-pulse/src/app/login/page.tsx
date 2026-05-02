import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect('/dashboard');

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #A855F7 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center mb-4"
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Dynamic UI</h1>
          <p className="text-white/70 mt-1.5 text-sm">AI-powered customizable dashboards</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <LoginForm />
        </div>

        {/* Demo credentials hint */}
        <div
          className="mt-5 rounded-xl px-4 py-3 text-center"
          style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' }}
        >
          <p className="text-white/80 text-xs font-medium mb-0.5">Demo accounts</p>
          <p className="text-white/60 text-xs">user1@demo.com · user2@demo.com</p>
          <p className="text-white/60 text-xs mt-0.5">Password: password123</p>
        </div>
      </div>
    </div>
  );
}
