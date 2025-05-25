'use client'

import React, { useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get('redirectedFrom') || '/dashboard';

  useEffect(() => {
    let isRedirecting = false;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Login] Auth state changed:', event, session ? 'with session' : 'no session');
      
      // Only handle redirects for SIGNED_IN and INITIAL_SESSION if we have a valid session
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !isRedirecting) {
        isRedirecting = true;
        console.log('[Login] Valid session found, redirecting to:', redirectedFrom);
        router.push(redirectedFrom);
      }
    });

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !isRedirecting) {
          isRedirecting = true;
          console.log('[Login] Initial session found, redirecting to:', redirectedFrom);
          router.push(redirectedFrom);
        }
      } catch (error) {
        console.error('[Login] Error checking session:', error);
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [redirectedFrom, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#404040',
                  brandAccent: '#2d2d2d'
                }
              }
            }
          }}
          providers={['google']}
          redirectTo={`${window.location.origin}${redirectedFrom}`}
        />
      </div>
    </div>
  )
} 