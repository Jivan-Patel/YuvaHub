import React, { useState } from 'react';
import { Sparkles, Globe, BrainCircuit } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

export default function SplashAuth() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
         
         {/* Left Side - Visual */}
         <div className="bg-gray-900 p-12 flex flex-col justify-between relative overflow-hidden hidden lg:flex">
            <div className="absolute top-0 right-0 p-8 w-full flex justify-end opacity-20 pointer-events-none">
               <Globe className="w-64 h-64 text-blue-500 animate-[spin_120s_linear_infinite]" />
            </div>
            
            <div className="relative z-10">
               <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                 Yuva<span className="text-blue-500">Hub</span>
               </h1>
               <div className="w-12 h-1 bg-blue-600 mb-8 mt-4 rounded-full"></div>
            </div>

            <div className="relative z-10 space-y-8">
               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-white">AI-Powered matching</h3>
                    <p className="text-gray-400 text-sm mt-1">Get automatically matched with opportunities based on your specific skills and experience.</p>
                 </div>
               </div>
               <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <BrainCircuit className="w-5 h-5 text-blue-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-white">Real-time Intelligence</h3>
                    <p className="text-gray-400 text-sm mt-1">Our crawler monitors thousands of sources constantly to bring you the best events as they happen.</p>
                 </div>
               </div>
            </div>

            <div className="relative z-10 pt-16">
               <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Connect . Learn . Grow</p>
            </div>
         </div>

         {/* Right Side - Auth */}
         <div className="p-12 lg:p-16 flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-12 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome User</h2>
                <p className="text-gray-500 text-sm font-medium">Join the intelligence network connecting students with top opportunities.</p>
              </div>

              <div className="space-y-4">
                 <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50"
                 >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    )}
                    {loading ? 'Authenticating...' : 'Sign in with Google'}
                 </button>
              </div>
              
              <div className="mt-12 text-center text-xs text-gray-400">
                 By continuing, you agree to our Terms of Service and Privacy Policy.
              </div>
            </div>
         </div>

      </div>
    </div>
  );
}
