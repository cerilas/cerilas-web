import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { exportToExcel } from '../../lib/exportExcel';
import { ConfirmModal, Dropdown } from '../../components/ui';

const LOGIN_TYPES = [
  'Şifre',
  'Google Auth',
  'GitHub',
  'Telefon',
  'E-posta Bağlantısı',
  'Microsoft',
  'Apple',
  'Diğer',
].map((value) => ({ value, label: value }));

const EMPTY_FORM = {
  account_name: '',
  login_url: '',
  password: '',
  email: '',
  phone: '',
  note: '',
  login_type: 'Şifre',
};

const normalizeUrl = (value) => {
  const input = String(value || '').trim();
  if (!input) return '';
  return /^https?:\/\//i.test(input) ? input : `https://${input}`;
};

const getPreviewFavicon = (value) => {
  try {
    const domain = new URL(normalizeUrl(value)).hostname.replace(/^www\./, '');
    return domain
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
      : '';
  } catch {
    return '';
  }
};

const buildLoginInfo = (account, password) => [
  `${account.account_name} giriş bilgileri`,
  account.login_url && `Giriş: ${account.login_url}`,
  account.login_type && `Giriş tipi: ${account.login_type}`,
  account.email && `E-posta: ${account.email}`,
  account.phone && `Telefon: ${account.phone}`,
  password && `Şifre: ${password}`,
  account.note && `Not: ${account.note}`,
].filter(Boolean).join('\n');

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-gray-400">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10';

const DetailIcon = ({ type }) => {
  const paths = {
    email: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    phone: 'M3 5a2 2 0 012-2h2.28a1 1 0 01.95.68l1.1 3.3a1 1 0 01-.5 1.21l-1.52.76a11 11 0 005.74 5.74l.76-1.52a1 1 0 011.21-.5l3.3 1.1a1 1 0 01.68.95V17a2 2 0 01-2 2h-1C8.82 19 3 13.18 3 6V5z',
    note: 'M8 7h8M8 11h8m-8 4h5m6 6H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z',
    url: 'M10 13a5 5 0 007.07.07l2-2a5 5 0 00-7.07-7.07l-1.15 1.15m3.3 5.7a5 5 0 00-7.07-.07l-2 2a5 5 0 007.07 7.07l1.15-1.15',
    password: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  };
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={paths[type]} />
    </svg>
  );
};

function CopyIconButton({ onClick, label, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={`${label} kopyala`}
      aria-label={`${label} kopyala`}
      className="saved-account-copy-button flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-cyan-500/10 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-25"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V5a2 2 0 012-2h7a2 2 0 012 2v7a2 2 0 01-2 2h-2m-7-7H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5M8 7h7v7H8V7z" />
      </svg>
    </button>
  );
}

function DetailLine({ type, label, value, onCopy, valueClassName = 'text-gray-300' }) {
  return (
    <div className="group flex min-w-0 items-center gap-1.5 text-[11px]">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gray-800 text-gray-500">
        <DetailIcon type={type} />
      </span>
      <span className="w-11 shrink-0 text-gray-600">{label}</span>
      <span className={`min-w-0 flex-1 truncate ${valueClassName}`}>{value || '—'}</span>
      <CopyIconButton onClick={onCopy} label={label} disabled={!value} />
    </div>
  );
}

export default function SavedAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [vaultUnlocked, setVaultUnlocked] = useState(() => api.hasSavedAccountsVaultSession());
  const [vaultPassword, setVaultPassword] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [loading, setLoading] = useState(() => api.hasSavedAccountsVaultSession());
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [smsTarget, setSmsTarget] = useState(null);
  const [smsNumber, setSmsNumber] = useState('');
  const [smsPassword, setSmsPassword] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const resetVaultState = (message = '') => {
    api.lockSavedAccounts();
    setVaultUnlocked(false);
    setVaultPassword('');
    setVaultError(message);
    setAccounts([]);
    setRevealedPasswords({});
    setEditing(null);
    setSmsTarget(null);
    setLoading(false);
  };

  const loadAccounts = () => {
    setLoading(true);
    setError('');
    api.getSavedAccounts()
      .then(setAccounts)
      .catch((err) => {
        if (err.code === 'VAULT_LOCKED') {
          resetVaultState('Kasa oturumu sona erdi. Şifreyi yeniden girin.');
          return;
        }
        setError(err.message || 'Hesaplar yüklenemedi');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handleVaultLocked = () => {
      setVaultUnlocked(false);
      setVaultPassword('');
      setVaultError('Kasa oturumu sona erdi. Şifreyi yeniden girin.');
      setAccounts([]);
      setRevealedPasswords({});
      setEditing(null);
      setSmsTarget(null);
      setLoading(false);
    };
    window.addEventListener('accounts-vault-locked', handleVaultLocked);
    return () => window.removeEventListener('accounts-vault-locked', handleVaultLocked);
  }, []);

  useEffect(() => {
    if (!vaultUnlocked) return undefined;
    let isCurrent = true;
    api.getSavedAccounts()
      .then((data) => {
        if (isCurrent) setAccounts(data);
      })
      .catch((err) => {
        if (!isCurrent || err.code === 'VAULT_LOCKED') return;
        setError(err.message || 'Hesaplar yüklenemedi');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });
    return () => { isCurrent = false; };
  }, [vaultUnlocked]);

  const unlockVault = async (event) => {
    event.preventDefault();
    if (!vaultPassword) {
      setVaultError('Kasa şifresini girin.');
      return;
    }

    setUnlocking(true);
    setVaultError('');
    try {
      await api.unlockSavedAccounts(vaultPassword);
      setVaultPassword('');
      setLoading(true);
      setVaultUnlocked(true);
      toast.success('Şifre kasası açıldı');
    } catch (err) {
      setVaultError(err.message || 'Kasa açılamadı');
    } finally {
      setUnlocking(false);
    }
  };

  const lockVault = () => {
    resetVaultState('');
    toast.success('Şifre kasası kilitlendi');
  };

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');
    return accounts.filter((account) => {
      if (typeFilter !== 'all' && account.login_type !== typeFilter) return false;
      if (!term) return true;
      return [
        account.account_name,
        account.login_url,
        account.domain,
        account.email,
        account.phone,
        account.note,
        account.login_type,
      ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR').includes(term);
    });
  }, [accounts, search, typeFilter]);

  const typeOptions = useMemo(() => [
    { value: 'all', label: 'Tüm giriş tipleri' },
    ...LOGIN_TYPES.filter((option) => accounts.some((account) => account.login_type === option.value)),
  ], [accounts]);
  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + pageSize);

  const getPassword = async (account) => {
    if (Object.prototype.hasOwnProperty.call(revealedPasswords, account.id)) {
      return revealedPasswords[account.id];
    }
    const result = await api.getSavedAccountPassword(account.id);
    setRevealedPasswords((current) => ({ ...current, [account.id]: result.password }));
    return result.password;
  };

  const togglePassword = async (account) => {
    if (Object.prototype.hasOwnProperty.call(revealedPasswords, account.id)) {
      setRevealedPasswords((current) => {
        const next = { ...current };
        delete next[account.id];
        return next;
      });
      return;
    }
    try {
      await getPassword(account);
    } catch (err) {
      toast.error(err.message || 'Şifre gösterilemedi');
    }
  };

  const copyLoginInfo = async (account) => {
    try {
      const password = await getPassword(account);
      await navigator.clipboard.writeText(buildLoginInfo(account, password));
      toast.success('Giriş bilgileri komple kopyalandı');
    } catch (err) {
      toast.error(err.message || 'Giriş bilgileri kopyalanamadı');
    }
  };

  const copyValue = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} kopyalandı`);
    } catch {
      toast.error(`${label} kopyalanamadı`);
    }
  };

  const copyPassword = async (account) => {
    try {
      const password = await getPassword(account);
      if (!password) {
        toast.error('Bu hesapta kayıtlı şifre yok');
        return;
      }
      await navigator.clipboard.writeText(password);
      toast.success('Şifre kopyalandı');
    } catch (err) {
      toast.error(err.message || 'Şifre kopyalanamadı');
    }
  };

  const openCreate = () => {
    setError('');
    setShowFormPassword(false);
    setEditing({ ...EMPTY_FORM });
  };

  const openEdit = (account) => {
    setError('');
    setShowFormPassword(false);
    setEditing({
      id: account.id,
      account_name: account.account_name || '',
      login_url: account.login_url || '',
      password: '',
      email: account.email || '',
      phone: account.phone || '',
      note: account.note || '',
      login_type: account.login_type || 'Şifre',
      has_password: account.has_password,
    });
  };

  const saveAccount = async () => {
    if (!editing.account_name.trim()) {
      setError('Hesap adı zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing.id) {
        await api.updateSavedAccount(editing.id, editing);
        setRevealedPasswords((current) => {
          const next = { ...current };
          delete next[editing.id];
          return next;
        });
        toast.success('Hesap güncellendi');
      } else {
        await api.createSavedAccount(editing);
        toast.success('Hesap kasaya eklendi');
      }
      setEditing(null);
      loadAccounts();
    } catch (err) {
      setError(err.message || 'Hesap kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.deleteSavedAccount(deleteTarget.id);
      setAccounts((current) => current.filter((account) => account.id !== deleteTarget.id));
      toast.success('Hesap silindi');
    } catch (err) {
      toast.error(err.message || 'Hesap silinemedi');
    } finally {
      setDeleteTarget(null);
    }
  };

  const openSms = async (account) => {
    setSmsTarget(account);
    setSmsNumber('');
    setSmsPassword('');
    setSmsLoading(true);
    try {
      setSmsPassword(await getPassword(account));
    } catch (err) {
      toast.error(err.message || 'Giriş bilgileri hazırlanamadı');
      setSmsTarget(null);
    } finally {
      setSmsLoading(false);
    }
  };

  const sendSms = async () => {
    if (!smsNumber.trim()) {
      toast.error('SMS gönderilecek numarayı yazın');
      return;
    }
    setSmsSending(true);
    try {
      await api.sendSms({
        no: smsNumber,
        msg: buildLoginInfo(smsTarget, smsPassword),
      });
      toast.success('Giriş bilgileri SMS olarak gönderildi');
      setSmsTarget(null);
    } catch (err) {
      toast.error(err.message || 'SMS gönderilemedi');
    } finally {
      setSmsSending(false);
    }
  };

  const exportAccounts = async () => {
    setExportConfirmOpen(false);
    setExporting(true);
    try {
      const rows = await Promise.all(accounts.map(async (account) => {
        const result = await api.getSavedAccountPassword(account.id);
        return {
          ...account,
          password: result.password || '',
          created_at_label: account.created_at
            ? new Date(account.created_at).toLocaleString('tr-TR')
            : '',
          updated_at_label: account.updated_at
            ? new Date(account.updated_at).toLocaleString('tr-TR')
            : '',
        };
      }));

      exportToExcel(rows, [
        { key: 'account_name', label: 'Hesap Adı', width: 180 },
        { key: 'login_url', label: 'Giriş URL', width: 280 },
        { key: 'password', label: 'Şifre', width: 180 },
        { key: 'email', label: 'E-posta', width: 220 },
        { key: 'phone', label: 'Telefon', width: 130 },
        { key: 'note', label: 'Not', width: 320 },
        { key: 'login_type', label: 'Giriş Tipi', width: 140 },
        { key: 'domain', label: 'Alan Adı', width: 180 },
        { key: 'created_at_label', label: 'Oluşturulma Tarihi', width: 150 },
        { key: 'updated_at_label', label: 'Güncellenme Tarihi', width: 150 },
      ], `cerilas-hesaplar-${new Date().toISOString().slice(0, 10)}`);
      toast.success(`${rows.length} hesap Excel dosyasına aktarıldı`);
    } catch (err) {
      toast.error(err.message || 'Excel dosyası oluşturulamadı');
    } finally {
      setExporting(false);
    }
  };

  const faviconPreview = getPreviewFavicon(editing?.login_url);
  const smsContent = smsTarget ? buildLoginInfo(smsTarget, smsPassword) : '';

  if (!vaultUnlocked) {
    return (
      <div className="saved-accounts-page mx-auto max-w-7xl pb-20">
        <div className="mb-5">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 7a4 4 0 11-7.75 1.38L3 12.63V16h3v3h3v2h4l2.62-2.62A4 4 0 0015 7z" />
              </svg>
            </span>
            <h1 className="text-xl font-bold text-white">Şifre ve Hesaplar</h1>
          </div>
          <p className="text-sm text-gray-400">
            Bu bölüm ek bir kasa şifresiyle korunur.
          </p>
        </div>

        <div className="saved-account-vault-gate mx-auto mt-12 max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl shadow-black/10 sm:p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 10V8a5 5 0 0110 0v2m-11 0h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2zm5 4v3" />
            </svg>
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-lg font-bold text-white">Şifre Kasası Kilitli</h2>
            <p className="mt-1.5 text-sm leading-6 text-gray-400">
              Hesap bilgilerini görüntülemek için kasa şifresini girin.
            </p>
          </div>

          <form onSubmit={unlockVault} className="mt-6">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-gray-400">Kasa Şifresi</span>
              <input
                type="password"
                value={vaultPassword}
                onChange={(event) => setVaultPassword(event.target.value)}
                className={`${inputClass} h-11`}
                placeholder="••••••••••••"
                autoComplete="current-password"
                autoFocus
              />
            </label>

            {vaultError && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs leading-5 text-red-300">
                {vaultError}
              </div>
            )}

            <button
              type="submit"
              disabled={unlocking || !vaultPassword}
              className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {unlocking ? 'Kasa Açılıyor...' : 'Kasayı Aç'}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] leading-5 text-gray-500">
            Şifre tarayıcıda saklanmaz ve yalnızca güvenli doğrulama için sunucuya gönderilir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-accounts-page mx-auto max-w-7xl pb-20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 7a4 4 0 11-7.75 1.38L3 12.63V16h3v3h3v2h4l2.62-2.62A4 4 0 0015 7z" />
              </svg>
            </span>
            <h1 className="text-xl font-bold text-white">Şifre ve Hesaplar</h1>
          </div>
          <p className="text-sm text-gray-400">
            Giriş bilgilerinizi şifreli kasada saklayın, kopyalayın veya SMS ile paylaşın.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={lockVault}
            className="rounded-lg border border-gray-700 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            Kasayı Kilitle
          </button>
          <button
            type="button"
            onClick={() => setExportConfirmOpen(true)}
            disabled={exporting || accounts.length === 0}
            className="saved-account-export-button flex items-center gap-1.5 rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 transition-colors hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14a2 2 0 002-2v-2M5 21a2 2 0 01-2-2v-2" />
            </svg>
            {exporting ? 'Hazırlanıyor...' : 'Excel’e Aktar'}
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-gray-950 transition-colors hover:bg-cyan-400"
          >
            + Yeni Hesap
          </button>
        </div>
      </div>

      <div className="saved-account-toolbar mb-4 grid gap-2 rounded-xl border border-gray-800 bg-gray-900 p-2 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z" />
          </svg>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-full rounded-lg border border-gray-800 bg-gray-950/80 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-500/50"
            placeholder="Hesap, e-posta, URL veya not ara..."
          />
        </div>
        <Dropdown
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value);
            setCurrentPage(1);
          }}
          options={typeOptions}
          buttonClassName="h-9 w-full flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950/80 px-3 text-xs text-gray-300 outline-none hover:border-gray-700"
        />
      </div>

      {error && !editing && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-800 text-gray-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-semibold text-white">Kasa henüz boş</h2>
          <p className="mt-1 text-sm text-gray-500">İlk giriş hesabınızı güvenli şekilde kaydedin.</p>
          <button onClick={openCreate} className="mt-5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300">
            İlk Hesabı Ekle
          </button>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-800 bg-gray-900/40 py-14 text-center text-sm text-gray-500">
          Aramanızla eşleşen hesap bulunamadı.
        </div>
      ) : (
        <>
          <div className="saved-account-card overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            {paginatedAccounts.map((account) => {
              const passwordIsVisible = Object.prototype.hasOwnProperty.call(revealedPasswords, account.id);
              return (
                <div key={account.id} className="saved-account-row border-b border-gray-800 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-white/[0.025]">
                <div className="grid gap-2.5 xl:grid-cols-[minmax(200px,1.05fr)_minmax(220px,1fr)_minmax(175px,.75fr)_auto] xl:items-center">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-700 bg-gray-800 text-xs font-bold text-gray-500">
                      <span>{account.account_name?.charAt(0)?.toUpperCase() || '?'}</span>
                      {account.favicon_url && (
                        <img
                          src={account.favicon_url}
                          alt=""
                          className="absolute h-6 w-6 object-contain"
                          onError={(event) => { event.currentTarget.style.display = 'none'; }}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-xs font-semibold text-white">{account.account_name}</h2>
                        <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-medium text-cyan-300">
                          {account.login_type}
                        </span>
                      </div>
                      {account.login_url ? (
                        <div className="mt-0.5 flex min-w-0 items-center gap-1">
                          <span className="shrink-0 text-gray-600"><DetailIcon type="url" /></span>
                          <a href={account.login_url} target="_blank" rel="noreferrer" className="min-w-0 truncate text-[11px] text-gray-500 hover:text-cyan-400">
                            {account.domain || account.login_url}
                          </a>
                          <CopyIconButton onClick={() => copyValue(account.login_url, 'Giriş URL’si')} label="Giriş URL’si" />
                        </div>
                      ) : (
                        <span className="mt-1 block text-xs text-gray-600">Giriş URL’si yok</span>
                      )}
                    </div>
                  </div>

                  <div className="grid min-w-0 gap-1">
                    <DetailLine type="email" label="E-posta" value={account.email} onCopy={() => copyValue(account.email, 'E-posta')} />
                    <DetailLine type="phone" label="Telefon" value={account.phone} onCopy={() => copyValue(account.phone, 'Telefon')} />
                    {account.note && (
                      <DetailLine type="note" label="Not" value={account.note} onCopy={() => copyValue(account.note, 'Not')} valueClassName="text-amber-200/80" />
                    )}
                  </div>

                  <div className="saved-account-secret flex min-w-0 items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-950/80 px-2.5 py-1.5">
                    <span className="shrink-0 text-gray-600"><DetailIcon type="password" /></span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-gray-300">
                      {!account.has_password ? 'Şifre yok' : passwordIsVisible ? revealedPasswords[account.id] : '••••••••••••'}
                    </span>
                    <CopyIconButton onClick={() => copyPassword(account)} label="Şifre" disabled={!account.has_password} />
                    {account.has_password && (
                      <button onClick={() => togglePassword(account)} className="shrink-0 text-[11px] font-medium text-cyan-400 hover:text-cyan-300">
                        {passwordIsVisible ? 'Gizle' : 'Göster'}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 xl:justify-end">
                    {account.login_url && (
                      <a
                        href={account.login_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Giriş URL’sini yeni sekmede aç"
                        className="flex items-center gap-1 rounded-md bg-cyan-400 px-2.5 py-1.5 text-[10px] font-bold text-gray-950 hover:bg-cyan-300"
                      >
                        Aç
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6-8 8M5 7v12h12v-6" />
                        </svg>
                      </a>
                    )}
                    <button onClick={() => copyLoginInfo(account)} className="rounded-md border border-gray-700 px-2.5 py-1.5 text-[10px] font-medium text-gray-300 hover:bg-white/5 hover:text-white">
                      Tümünü Kopyala
                    </button>
                    <button onClick={() => openSms(account)} className="rounded-md border border-green-500/25 bg-green-500/10 px-2.5 py-1.5 text-[10px] font-medium text-green-300 hover:bg-green-500/10">
                      SMS
                    </button>
                    <button onClick={() => openEdit(account)} className="rounded-md border border-gray-700 px-2 py-1.5 text-[10px] text-gray-400 hover:text-white">
                      Düzenle
                    </button>
                    <button onClick={() => setDeleteTarget(account)} className="rounded-md border border-red-500/20 px-2 py-1.5 text-[10px] text-red-300 hover:bg-red-500/10">
                      Sil
                    </button>
                  </div>
                </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span>
                {startIndex + 1}-{Math.min(startIndex + pageSize, filteredAccounts.length)} / {filteredAccounts.length} hesap
              </span>
              <Dropdown
                value={pageSize}
                onChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
                options={[
                  { value: 10, label: '10 kayıt' },
                  { value: 20, label: '20 kayıt' },
                  { value: 50, label: '50 kayıt' },
                ]}
                buttonClassName="h-8 min-w-24 flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-2.5 text-[11px] text-gray-400 outline-none hover:border-gray-700"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safePage === 1}
                className="rounded-md border border-gray-800 px-2.5 py-1.5 text-[10px] text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                İlk
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, Math.min(page, totalPages) - 1))}
                disabled={safePage === 1}
                className="rounded-md border border-gray-800 px-2.5 py-1.5 text-[10px] text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                Önceki
              </button>
              <span className="rounded-md border border-gray-800 bg-gray-900 px-2.5 py-1.5 text-[10px] text-gray-300">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safePage === totalPages}
                className="rounded-md border border-gray-800 px-2.5 py-1.5 text-[10px] text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                Sonraki
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage === totalPages}
                className="rounded-md border border-gray-800 px-2.5 py-1.5 text-[10px] text-gray-400 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                Son
              </button>
            </div>
          </div>
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => !saving && setEditing(null)}>
          <div className="saved-account-modal max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{editing.id ? 'Hesabı Düzenle' : 'Yeni Hesap'}</h2>
                <p className="mt-1 text-sm text-gray-500">Şifre, kaydedilmeden önce sunucuda şifrelenir.</p>
              </div>
              <button onClick={() => !saving && setEditing(null)} className="text-2xl leading-none text-gray-500 hover:text-white">&times;</button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Hesap Adı *">
                <input value={editing.account_name} onChange={(event) => setEditing({ ...editing, account_name: event.target.value })} className={inputClass} placeholder="ör: Google Workspace" />
              </Field>
              <Field label="Giriş Tipi">
                <Dropdown value={editing.login_type} onChange={(value) => setEditing({ ...editing, login_type: value })} options={LOGIN_TYPES} />
              </Field>
              <Field label="Giriş URL" className="sm:col-span-2">
                <div className="flex gap-3">
                  <input value={editing.login_url} onChange={(event) => setEditing({ ...editing, login_url: event.target.value })} className={inputClass} placeholder="https://accounts.example.com" />
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-700 bg-gray-800 text-xs text-gray-500">
                    <span>Logo</span>
                    {faviconPreview && <img src={faviconPreview} alt="" className="absolute h-7 w-7 object-contain" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
                  </div>
                </div>
              </Field>
              <Field label="E-posta">
                <input type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} className={inputClass} placeholder="hesap@example.com" />
              </Field>
              <Field label="Telefon">
                <input value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} className={inputClass} placeholder="+90 5xx xxx xx xx" />
              </Field>
              <Field label={editing.id && editing.has_password ? 'Şifre (değiştirmek için yazın)' : 'Şifre'} className="sm:col-span-2">
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    value={editing.password}
                    onChange={(event) => setEditing({ ...editing, password: event.target.value })}
                    className={`${inputClass} pr-20 font-mono`}
                    placeholder={editing.id && editing.has_password ? 'Mevcut şifre korunacak' : 'Şifre'}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowFormPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-cyan-400">
                    {showFormPassword ? 'Gizle' : 'Göster'}
                  </button>
                </div>
              </Field>
              <Field label="Not" className="sm:col-span-2">
                <textarea value={editing.note} onChange={(event) => setEditing({ ...editing, note: event.target.value })} rows={3} className={`${inputClass} resize-none`} placeholder="Yedek kod, hesap sahibi veya giriş notu..." />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-gray-800 pt-4">
              <button onClick={() => setEditing(null)} disabled={saving} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Vazgeç</button>
              <button onClick={saveAccount} disabled={saving || !editing.account_name.trim()} className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-gray-950 hover:bg-cyan-400 disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kasaya Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {smsTarget && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => !smsSending && setSmsTarget(null)}>
          <div className="saved-account-modal w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Giriş Bilgisini SMS Gönder</h2>
                <p className="mt-1 text-sm text-gray-500">{smsTarget.account_name}</p>
              </div>
              <button onClick={() => setSmsTarget(null)} className="text-2xl leading-none text-gray-500 hover:text-white">&times;</button>
            </div>
            <Field label="Alıcı Telefon Numarası">
              <input value={smsNumber} onChange={(event) => setSmsNumber(event.target.value)} className={inputClass} placeholder="5xx xxx xx xx" autoFocus />
            </Field>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">Otomatik Oluşturulan İçerik</span>
                <span className="text-[10px] text-amber-400">Hassas bilgi içerir</span>
              </div>
              <pre className="saved-account-sms-preview max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-800 bg-gray-950/80 p-4 text-xs leading-5 text-gray-300">
                {smsLoading ? 'İçerik hazırlanıyor...' : smsContent}
              </pre>
            </div>
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-200/80">
              SMS şifrelenmemiş bir iletişim kanalıdır. Yalnızca güvendiğiniz numaralara gönderin.
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setSmsTarget(null)} disabled={smsSending} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Vazgeç</button>
              <button onClick={sendSms} disabled={smsSending || smsLoading || !smsNumber.trim()} className="rounded-lg bg-green-500 px-5 py-2 text-sm font-semibold text-gray-950 hover:bg-green-400 disabled:opacity-50">
                {smsSending ? 'Gönderiliyor...' : 'SMS Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hesabı kasadan sil"
        message={deleteTarget ? `${deleteTarget.account_name} hesabı ve şifresi kalıcı olarak silinecek.` : ''}
        confirmText="Hesabı Sil"
        onConfirm={deleteAccount}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        open={exportConfirmOpen}
        title="Tüm hesapları Excel’e aktar"
        message={`${accounts.length} hesabın tüm bilgileri ve şifreleri açık metin olarak Excel dosyasına yazılacak. Dosyayı güvenli bir yerde saklayın.`}
        confirmText="Excel Dosyasını Oluştur"
        variant="info"
        onConfirm={exportAccounts}
        onCancel={() => setExportConfirmOpen(false)}
      />
    </div>
  );
}
