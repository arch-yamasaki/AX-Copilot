import React, { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';

interface Props {
  user: User;
  defaultFullname?: string;
  onCancel?: () => void;
  onSave: (fullname: string, department: string) => Promise<void> | void;
}

const ProfileSetupDialog: React.FC<Props> = ({ user, defaultFullname, onCancel, onSave }) => {
  const [fullname, setFullname] = useState<string>(defaultFullname || '');
  const [department, setDepartment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const canSubmit = useMemo(() => fullname.trim() !== '' && department.trim() !== '' && !submitting, [fullname, department, submitting]);

  const handleSave = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSave(fullname.trim(), department.trim());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900">プロフィールの設定</h2>
        <p className="mt-1 text-sm text-gray-600">最初に、氏名と部署名を教えてください。</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">氏名</label>
            <input
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="山田 太郎"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部署名</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="営業部"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          {onCancel && (
            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200" disabled={submitting}>
              後で
            </button>
          )}
          <button onClick={handleSave} disabled={!canSubmit} className={`px-4 py-2 rounded-lg text-sm font-semibold ${canSubmit ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500'}`}>
            保存する
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupDialog;


