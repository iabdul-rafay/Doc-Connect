import { useState, useRef } from 'react';
import { Camera, Save, KeyRound } from 'lucide-react';
import { PageHeader, Avatar, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api/client';

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '', city: user.city || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploading, setUploading] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/users/me', profile);
      updateUser(data.user);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profileImage', file);
    setUploading(true);
    try {
      const { data } = await api.put('/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      toast.success('Photo updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/users/me/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast.success('Password changed.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      <PageHeader title="Account settings" subtitle="Update your personal details and password." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile + avatar */}
        <form onSubmit={saveProfile} className="card space-y-4 p-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar name={user.name} src={user.avatar} size={72} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-white shadow hover:bg-brand-700"
                aria-label="Change photo">
                {uploading ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <Camera size={15} />}
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onAvatar} className="hidden" />
            </div>
            <div>
              <p className="font-semibold text-ink">{user.name}</p>
              <p className="text-sm capitalize text-ink-soft">{user.role} · {user.email}</p>
            </div>
          </div>

          <div>
            <label className="label">Full name</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="field" required />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+92 3xx xxxxxxx" className="field" />
          </div>
          <div>
            <label className="label">City</label>
            <input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="e.g. Islamabad" className="field" />
          </div>

          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : <><Save size={16} /> Save changes</>}
          </button>
        </form>

        {/* Password */}
        <form onSubmit={savePassword} className="card h-fit space-y-4 p-6">
          <div className="flex items-center gap-2 text-ink">
            <KeyRound size={18} className="text-brand-600" />
            <h2 className="text-base font-semibold">Change password</h2>
          </div>
          <div>
            <label className="label">Current password</label>
            <input type="password" value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className="field" required />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" minLength={8} value={pw.newPassword}
              onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
              placeholder="At least 8 characters" className="field" required />
          </div>
          <button type="submit" disabled={savingPw} className="btn-primary">
            {savingPw ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
