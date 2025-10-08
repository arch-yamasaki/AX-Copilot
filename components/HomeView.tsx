import React, { useEffect, useState } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { signInWithGoogle, sendEmailLink, isEmailLink, completeEmailLinkSignIn } from '../services/authService';

interface Props { onFlash?: (msg: string, type?: 'info'|'success'|'error') => void }

const HomeView: React.FC<Props> = ({ onFlash }) => {
  const [email, setEmail] = useState('');

  // 自動リンク完了: メールの魔法リンクで遷移してきた場合に自動サインイン
  useEffect(() => {
    if (isEmailLink()) {
      // localStorage に保存したメールがない場合はエラーになる（プロンプトは出さない）
      completeEmailLinkSignIn().catch(console.error);
    }
  }, []);
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
            onClick={() =>
              signInWithGoogle().catch((e) => {
                const msg = (e && e.message) ? String(e.message) : 'ログインに失敗しました';
                onFlash?.(msg, 'error');
              })
            }
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Googleでログイン
          </button>
        </div>

        <div className="mt-8 text-left max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-3">メールリンクでログイン</h2>
            <div className="text-xs text-gray-500">※ メールにリンクが届くまで、2~3分程かかる場合があります</div>
            <div className="text-xs text-gray-500 mb-2">※ 迷惑メールに届く場合が多いので、迷惑フォルダを確認してください</div>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!email) return;
                    sendEmailLink(email)
                      .then(() => onFlash?.('ログインリンクを送信しました', 'success'))
                      .catch((e) => onFlash?.('リンク送信に失敗しました', 'error'));
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-semibold hover:bg-gray-900"
                >
                  リンクを送信
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;


