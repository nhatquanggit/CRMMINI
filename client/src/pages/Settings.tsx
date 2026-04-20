import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, LockKeyhole, MoonStar, ShieldCheck, Sun, Trash2, UserRoundCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import AvatarUploader from '../components/AvatarUploader';
import {
  changePasswordApi,
  deleteAccountApi,
  getAvatarApi,
  logoutOtherSessionsApi,
  updateProfileApi
} from '../api/settingsApi';

type PasswordForm = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state: any) => state.setUser);
  const setAuth = useAuthStore((state: any) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const readJsonSetting = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);
  const darkMode = useUiStore((state) => state.darkMode);
  const setDarkMode = useUiStore((state) => state.setDarkMode);
  const [notifyEmail, setNotifyEmail] = useState(() => readJsonSetting('crm-notify-email', true));
  const [notifyApp, setNotifyApp] = useState(() => readJsonSetting('crm-notify-app', true));
  const [notifyReminder, setNotifyReminder] = useState(() => readJsonSetting('crm-notify-reminder', true));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pwdForm, setPwdForm] = useState<PasswordForm>({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(() => readJsonSetting('crm-2fa-enabled', false));

  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    getAvatarApi()
      .then((data) => { if (data?.imageUrl) setAvatarUrl(data.imageUrl); })
      .catch(() => {});
  }, []);

  const handleAvatarUploaded = useCallback((url: string) => {
    setAvatarUrl(url);
    setUser?.({ avatarUrl: url });
    toast.success('Avatar da duoc cap nhat vao he thong');
  }, [setUser]);

  useEffect(() => {
    localStorage.setItem('crm-notify-email', JSON.stringify(notifyEmail));
  }, [notifyEmail]);

  useEffect(() => {
    localStorage.setItem('crm-notify-app', JSON.stringify(notifyApp));
  }, [notifyApp]);

  useEffect(() => {
    localStorage.setItem('crm-notify-reminder', JSON.stringify(notifyReminder));
  }, [notifyReminder]);

  useEffect(() => {
    localStorage.setItem('crm-2fa-enabled', JSON.stringify(twoFaEnabled));
  }, [twoFaEnabled]);

  const changeLanguage = (nextLang: 'vi' | 'en') => {
    setLanguage(nextLang);
    toast.success(nextLang === 'vi' ? 'Da chuyen sang Tieng Viet' : 'Switched to English');
  };

  const handleLogoutOtherSessions = async () => {
    setLoggingOutOthers(true);
    try {
      const result = await logoutOtherSessionsApi();
      setAuth?.({ token: result.token, user: { ...(user || {}), ...result.user } });
      toast.success('Da dang xuat cac thiet bi khac');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Khong the dang xuat cac thiet bi khac');
    } finally {
      setLoggingOutOthers(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccountApi();
      clearAuth();
      toast.success('Tai khoan da duoc xoa');
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Khong the xoa tai khoan');
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await updateProfileApi(profile);
      setUser?.({ name: updated.name, email: updated.email, phone: updated.phone });
      toast.success('Cap nhat thong tin thanh cong');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Cap nhat that bai');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (pwdForm.newPassword.length < 6) {
      toast.error('Mat khau moi toi thieu 6 ky tu');
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Xac nhan mat khau khong khop');
      return;
    }

    setSavingPassword(true);
    try {
      await changePasswordApi({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword });
      toast.success('Doi mat khau thanh cong');
      setShowPasswordModal(false);
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Doi mat khau that bai');
    } finally {
      setSavingPassword(false);
    }
  };

  const sectionTopBar = useMemo(
    () => <div className="mb-4 h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />,
    []
  );

  const sectionClass = 'rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] lg:p-7';
  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white';

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-34px_rgba(15,23,42,0.32)] lg:p-8">
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-blue-100/80 via-cyan-50 to-transparent" />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_320px] xl:items-end">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
              Workspace Settings
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Cai dat tai khoan va he thong</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 lg:text-[15px]">
              To chuc lai ho so ca nhan, quyen rieng tu va tuy chon lam viec theo mot bo cuc de doc, tach khoi ro rang tung nhom cai dat.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ho so</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{user?.name || 'User'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ngon ngu</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{language === 'vi' ? 'Tieng Viet' : 'English'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Giao dien</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{darkMode ? 'Dark mode' : 'Light mode'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className="space-y-6">
          <AvatarUploader
            initialAvatar={avatarUrl}
            onUploaded={handleAvatarUploaded}
            darkMode={darkMode}
            onThemeChange={setDarkMode}
          />

          <section className={sectionClass}>
            {sectionTopBar}
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Thong tin co ban</h2>
                <p className="mt-1 text-sm text-slate-500">Cap nhat ten hien thi, email lien he va so dien thoai de dong bo toan bo he thong.</p>
              </div>
              <button
                type="button"
                onClick={saveProfile}
                disabled={savingProfile}
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.55)] transition hover:bg-slate-800 disabled:opacity-70"
              >
                {savingProfile ? 'Dang luu...' : 'Luu thay doi'}
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Ho ten</span>
                <input
                  value={profile.name}
                  onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                  className={inputClass}
                  placeholder="Nhap ho ten"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  value={profile.email}
                  onChange={(event) => setProfile((prev) => ({ ...prev, email: event.target.value }))}
                  className={inputClass}
                  placeholder="Nhap email"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">So dien thoai</span>
                <input
                  value={profile.phone}
                  onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
                  className={inputClass}
                  placeholder="Them so dien thoai de lien he nhanh"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className={sectionClass}>
            {sectionTopBar}
            <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Globe2 className="h-5 w-5 text-blue-600" />
              Ngon ngu
            </h2>
            <p className="mt-1 text-sm text-slate-500">Dieu chinh ngon ngu hien thi cho workspace va cach trinh bay noi dung.</p>

            <div className="mt-6">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Ngon ngu</p>
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => changeLanguage('vi')}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      language === 'vi' ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="text-sm font-semibold">Tieng Viet</div>
                    <div className="mt-1 text-xs text-slate-500">Giao dien toi uu cho ngu canh CRM hien tai</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => changeLanguage('en')}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      language === 'en' ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="text-sm font-semibold">English</div>
                    <div className="mt-1 text-xs text-slate-500">Phu hop neu ban lam viec voi doi nhom quoc te</div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            {sectionTopBar}
            <h2 className="text-xl font-semibold text-slate-900">Tong quan tai khoan</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Email dang dung</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{profile.email || user?.email || 'Chua cap nhat'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">So dien thoai</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{profile.phone || user?.phone || 'Chua cap nhat'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Trang thai phien</p>
                <p className="mt-2 text-sm font-medium text-slate-800">{token ? 'Dang dang nhap an toan' : 'Chua dang nhap'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className={sectionClass}>
        {sectionTopBar}
        <h2 className="text-xl font-semibold text-slate-900">Thong bao</h2>
        <p className="mt-1 text-sm text-slate-500">Tach rieng tung kenh nhan tin de ban khong bi qua tai khi theo doi deal va khach hang.</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <label className="flex min-h-28 cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/75 p-4 transition hover:bg-white">
            <div>
              <p className="text-sm font-semibold text-slate-900">Nhan email thong bao</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Nhan cap nhat quan trong qua email khi co thay doi ve khach hang va deal.</p>
            </div>
            <input type="checkbox" checked={notifyEmail} onChange={() => setNotifyEmail((prev) => !prev)} className="mt-4 h-4 w-4" />
          </label>
          <label className="flex min-h-28 cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/75 p-4 transition hover:bg-white">
            <div>
              <p className="text-sm font-semibold text-slate-900">Thong bao trong app</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Hien thi thong bao ngay trong workspace de phan hoi nhanh hon.</p>
            </div>
            <input type="checkbox" checked={notifyApp} onChange={() => setNotifyApp((prev) => !prev)} className="mt-4 h-4 w-4" />
          </label>
          <label className="flex min-h-28 cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/75 p-4 transition hover:bg-white">
            <div>
              <p className="text-sm font-semibold text-slate-900">Nhac lich deal</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Theo doi moc cham soc va cac buoc tiep theo trong pipeline ban hang.</p>
            </div>
            <input type="checkbox" checked={notifyReminder} onChange={() => setNotifyReminder((prev) => !prev)} className="mt-4 h-4 w-4" />
          </label>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={sectionClass}>
          {sectionTopBar}
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Bao mat
          </h2>
          <p className="mt-1 text-sm text-slate-500">Quan ly quyen truy cap va tang do an toan cho tai khoan dang su dung.</p>
          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/75 px-4 py-4 text-left transition hover:bg-white"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Doi mat khau</p>
                <p className="mt-1 text-sm text-slate-500">Cap nhat mat khau moi khi can tang cuong bao mat.</p>
              </div>
              <LockKeyhole className="h-5 w-5 text-slate-400" />
            </button>

            <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/75 px-4 py-4 transition hover:bg-white">
              <div>
                <p className="text-sm font-semibold text-slate-900">Bat 2FA</p>
                <p className="mt-1 text-sm text-slate-500">Them mot lop xac thuc de bao ve dang nhap tren thiet bi moi.</p>
              </div>
              <input
                type="checkbox"
                checked={twoFaEnabled}
                onChange={() => {
                  setTwoFaEnabled((prev) => !prev);
                  toast.success(!twoFaEnabled ? 'Da bat xac thuc bo sung' : 'Da tat xac thuc bo sung');
                }}
                className="h-4 w-4"
              />
            </label>
          </div>
        </section>

        <section className={sectionClass}>
          {sectionTopBar}
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
            <UserRoundCog className="h-5 w-5 text-blue-600" />
            Tai khoan
          </h2>
          <p className="mt-1 text-sm text-slate-500">Cac tac vu lien quan den phien dang nhap va trang thai tai khoan cua ban.</p>
          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={handleLogoutOtherSessions}
              disabled={loggingOutOthers}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/75 px-4 py-4 text-left transition hover:bg-white"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">Dang xuat tat ca thiet bi khac</p>
                <p className="mt-1 text-sm text-slate-500">Giu lai phien hien tai va dong bo lai quyen truy cap tren cac thiet bi con lai.</p>
              </div>
              <span className="text-sm font-medium text-slate-400">{loggingOutOthers ? 'Dang xu ly...' : 'Action'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left transition hover:bg-red-100"
            >
              <div>
                <p className="text-sm font-semibold text-red-700">Xoa tai khoan</p>
                <p className="mt-1 text-sm text-red-500">Hanh dong nay se tao yeu cau xoa va khong the hoan tac.</p>
              </div>
              <Trash2 className="h-5 w-5 text-red-400" />
            </button>
          </div>
        </section>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Doi mat khau</h3>
            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="Mat khau cu"
                value={pwdForm.oldPassword}
                onChange={(event) => setPwdForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                type="password"
                placeholder="Mat khau moi"
                value={pwdForm.newPassword}
                onChange={(event) => setPwdForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                type="password"
                placeholder="Xac nhan mat khau"
                value={pwdForm.confirmPassword}
                onChange={(event) => setPwdForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowPasswordModal(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                Huy
              </button>
              <button
                type="button"
                onClick={savePassword}
                disabled={savingPassword}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {savingPassword ? 'Dang luu...' : 'Luu mat khau'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-red-600">Xoa tai khoan</h3>
            <p className="mt-2 text-sm text-slate-600">Hanh dong nay khong the hoan tac. Ban co chac chan?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                Huy
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
              >
                {deletingAccount ? 'Dang xoa...' : 'Xac nhan xoa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
