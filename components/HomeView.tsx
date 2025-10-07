import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { signInWithGoogle } from '../services/authService';

const HomeView: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6">
      <div className="max-w-3xl w-full text-center">
        <div className="mx-auto h-16 w-16 mb-6 flex items-center justify-center rounded-2xl bg-blue-50">
          <LogoIcon className="h-10 w-10 text-blue-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">AX Copilot</h1>
        <p className="mt-3 text-gray-600">
          企業の業務棚卸しと改善提案を、会話で素早く。ログインしてはじめましょう。
        </p>
        <div className="mt-8">
          <button
            onClick={() => signInWithGoogle().catch(console.error)}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Googleでログイン
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;


