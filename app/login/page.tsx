import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createBrowserClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Sign in to DynCV
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create and optimize your CV for German job market
          </p>
        </div>
        
        <div className="mt-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            showLinks={true}
            providers={[]}
            redirectTo={`${process.env.NEXT_PUBLIC_API_URL}/auth/callback`}
            view="sign_in"
          />
        </div>
      </div>
    </div>
  );
} 