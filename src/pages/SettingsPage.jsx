import { useState, useEffect } from 'react';
import Icons from '../components/Icons';
import { Badge, Modal, Btn, Input, Select, Toast, PageHeader } from '../components/UI';

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const getSession = () => { try { const u = sessionStorage.getItem('user'); return u ? JSON.parse(u) : null; } catch { return null; } };

// ─── Shared primitives ────────────────────────────────────────
const Skeleton    = ({ h = 'h-8' }) => <div className={`${h} w-full bg-gray-100 rounded-xl animate-pulse mb-3`} />;
const ErrorBanner = ({ msg }) => <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{msg}</div>;

const SectionCard = ({ title, desc, icon: Icon, active, onClick }) => (
  <div onClick={onClick}
    className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer group ${active ? 'border-teal-400 ring-2 ring-teal-100 shadow-md' : 'border-gray-100 hover:shadow-md hover:border-teal-200'}`}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: active ? '#b2f0ee' : '#DFF7F6' }}><Icon /></div>
    <div className={`font-semibold mb-1 transition-colors ${active ? 'text-teal-700' : 'text-slate-700 group-hover:text-teal-700'}`}>{title}</div>
    <div className="text-sm text-slate-400">{desc}</div>
  </div>
);

const PanelWrap = ({ title, subtitle, onBack, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
      <button onClick={onBack} className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-slate-500 hover:text-teal-700">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div>
        <h2 className="font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const FieldRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 w-40 shrink-0 mb-1 sm:mb-0">{label}</span>
    <span className="text-sm text-slate-700">{value || '—'}</span>
  </div>
);

const Toggle = ({ value, onChange, label, sub }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
    <div>
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
    <button onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-teal-600' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

// Labelled group of toggles in a shaded box
const ToggleGroup = ({ title, items, cfg, set }) => (
  <div className="mb-5">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{title}</h3>
    <div className="bg-slate-50 rounded-xl px-4 divide-y divide-slate-100">
      {items.map(i => <Toggle key={i.key} value={cfg[i.key]} onChange={set(i.key)} label={i.label} sub={i.sub} />)}
    </div>
  </div>
);

// Section sub-header
const SectionTitle = ({ children }) => <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{children}</h3>;

const StatusBadge = ({ active }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
    {active ? 'Active' : 'Inactive'}
  </span>
);

// ═══════════════════════════════════════════════════════════════
// 1. CLINIC PROFILE
// ═══════════════════════════════════════════════════════════════
const CLINIC_FIELDS = [
  ['name','Clinic Name'],['phone','Phone'],['email','Email','email'],
  ['gst_number','GST Number'],['address','Address'],['city','City'],
  ['state','State'],['pincode','Pincode'],['subscription_plan','Subscription Plan'],
];

const ClinicProfile = ({ onBack, showToast }) => {
  const session  = getSession();
  const clinicId = session?.clinic_id;
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({ id:null, name:'', phone:'', email:'', address:'', city:'', state:'', pincode:'', gst_number:'', subscription_plan:'' });
  const set = k => v => setForm(f => ({...f, [k]:v}));

  useEffect(() => {
    fetch(`${API_BASE}/clinicsread`).then(r=>r.json()).then(data => {
      const clinic = Array.isArray(data) ? data.find(c=>c.id===clinicId)||data[0] : data;
      if (clinic) setForm(f=>({...f,...clinic}));
      setLoading(false);
    }).catch(() => { setError('Failed to load clinic data'); setLoading(false); });
  }, []);

  const payload = () => ({ ...form, created_by: String(session?.id||'1') });

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/clinic_create_update/`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload()) });
      setEditing(false);
      showToast('Clinic profile updated successfully');
    } catch { showToast('Save failed','error'); } finally { setSaving(false); }
  };

  if (loading) return <PanelWrap title="Clinic Profile" onBack={onBack}><Skeleton h="h-64" /></PanelWrap>;
  return (
    <PanelWrap title="Clinic Profile" subtitle="Update clinic name, address, contact details, and logo" onBack={onBack}>
      {error && <ErrorBanner msg={error} />}
      <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-teal-700 flex items-center justify-center text-white text-2xl font-bold shrink-0">
          {(form.name||'?').charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{form.name}</p>
          <p className="text-xs text-slate-400 mb-2">Clinic logo — click to upload (JPG/PNG, max 2 MB)</p>
          <Btn size="sm" variant="secondary">Upload Logo</Btn>
        </div>
      </div>

      {editing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {CLINIC_FIELDS.map(([key, label, type]) => <Input key={key} label={label} value={form[key]||''} onChange={set(key)} type={type||'text'} />)}
          </div>
          <div className="flex gap-3">
            <Btn onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save Changes'}</Btn>
            <Btn variant="secondary" onClick={() => setEditing(false)}>Cancel</Btn>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">{CLINIC_FIELDS.map(([key,label]) => <FieldRow key={key} label={label} value={form[key]} />)}</div>
          <Btn onClick={() => setEditing(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.586-6.586a2 2 0 112.828 2.828L11.828 13.828a4 4 0 01-1.414.828l-3 1 1-3a4 4 0 01.828-1.414z" /></svg>
            Edit Profile
          </Btn>
        </>
      )}
    </PanelWrap>
  );
};

// ═══════════════════════════════════════════════════════════════
// 2. USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════
const EMPTY_USER = { full_name:'', email:'', phone:'', role:'Doctor', is_active:true, date_of_birth:'', blood_group:'', specialization:'', password_hash:'' };

const USER_FIELDS = [
  ['full_name','Full Name *'],['email','Email *','email'],['phone','Phone'],
  ['specialization','Specialization'],['blood_group','Blood Group'],['date_of_birth','Date of Birth','date'],
];

const UserManagement = ({ onBack, showToast }) => {
  const session  = getSession();
  const clinicId = session?.clinic_id;
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(EMPTY_USER);
  const set = k => v => setForm(f=>({...f,[k]:v}));

  const load = () => {
    setLoading(true);
    fetch(`${API_BASE}/users_read_by_clinic/?clinic_id=${clinicId}`).then(r=>r.json())
      .then(d=>{ setUsers(Array.isArray(d.users)?d.users:[]); setLoading(false); })
      .catch(()=>{ setError('Failed to load users'); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => [u.full_name,u.role].some(v=>(v||'').toLowerCase().includes(search.toLowerCase())));

  const userPayload = (overrides={}) => ({
    ...form, clinic_id:clinicId, user:session?.id||1, qualifications:[], ...overrides,
    password_hash: overrides.password_hash ?? form.password_hash,
  });

  const handleSave = async () => {
    if (!form.full_name||!form.email) { showToast('Name and email are required','error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users_create_update/`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(userPayload()) });
      if (!res.ok) throw new Error((await res.json()).error||'Save failed');
      showToast(modal==='add'?'User added successfully':'User updated successfully');
      setModal(null); load();
    } catch(e) { showToast(e.message,'error'); } finally { setSaving(false); }
  };

  const toggleActive = async user => {
    try {
      const res = await fetch(`${API_BASE}/users_create_update/`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ ...user, is_active:!user.is_active, clinic_id:clinicId, user:session?.id||1, qualifications:[] }) });
      if (!res.ok) throw new Error('Failed');
      showToast('User status updated'); load();
    } catch { showToast('Failed to update user status','error'); }
  };

  return (
    <PanelWrap title="User Management" subtitle="Manage staff accounts and role permissions" onBack={onBack}>
      {error && <ErrorBanner msg={error} />}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users…"
          className="pl-4 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-56 focus:outline-none focus:border-teal-400" />
        <Btn size="sm" onClick={()=>{ setForm(EMPTY_USER); setModal('add'); }}>+ Add User</Btn>
      </div>
      {loading ? <Skeleton h="h-48" /> : (
        <div style={{ overflowX:'auto' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name','Role','Email','Phone','Specialization','Status','Actions'].map(c => (
                  <th key={c} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!filtered.length
                ? <tr><td colSpan={7} className="text-center py-10 text-slate-400">No users found</td></tr>
                : filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{u.full_name}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">{u.role}</span></td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500">{u.phone||'—'}</td>
                    <td className="px-4 py-3 text-slate-500">{u.specialization||'—'}</td>
                    <td className="px-4 py-3"><StatusBadge active={u.is_active} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Btn size="sm" variant="secondary" onClick={()=>{ setForm({...u,password_hash:''}); setModal(u); }}>Edit</Btn>
                        <Btn size="sm" variant={u.is_active?'danger':'secondary'} onClick={()=>toggleActive(u)}>
                          {u.is_active?'Disable':'Enable'}
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={modal==='add'?'Add New User':'Edit User'} onClose={()=>setModal(null)}>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {USER_FIELDS.map(([key,label,type]) => <Input key={key} label={label} value={form[key]||''} onChange={set(key)} type={type||'text'} />)}
            <Select label="Role" value={form.role} onChange={set('role')} options={['Doctor','Receptionist','Admin','Nurse','Pharmacist']} />
            {modal==='add' && <Input label="Password *" value={form.password_hash} onChange={set('password_hash')} type="password" />}
            <div className="flex items-center gap-3 py-1">
              <span className="text-sm font-medium text-slate-700">Active</span>
              <button onClick={()=>set('is_active')(!form.is_active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active?'bg-teal-600':'bg-gray-200'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active?'translate-x-5':''}`} />
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <Btn onClick={handleSave} className="flex-1" disabled={saving}>{saving?'Saving…':modal==='add'?'Add User':'Save Changes'}</Btn>
              <Btn variant="secondary" onClick={()=>setModal(null)} className="flex-1">Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </PanelWrap>
  );
};

// ═══════════════════════════════════════════════════════════════
// 3. BILLING CONFIG
// ═══════════════════════════════════════════════════════════════
const BillingConfig = ({ onBack, showToast }) => {
  const session  = getSession();
  const clinicId = session?.clinic_id;
  const [cfg, setCfg] = useState({
    gst_rate:'18', invoice_prefix:'INV', invoice_start:'1001',
    payment_methods:{ Cash:true, Card:true, UPI:true, NetBanking:false, Cheque:false },
    show_gst_on_invoice:true, auto_invoice_number:true, discount_allowed:true,
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const set   = k => v => setCfg(f => ({...f, [k]:v}));
  const setpm = k => v => setCfg(f => ({...f, payment_methods:{...f.payment_methods, [k]:v}}));

  useEffect(() => {
    fetch(`${API_BASE}/clinic_settings_read?clinic_id=${clinicId}`)
      .then(r => r.json())
      .then(d => {
        if (d && Object.keys(d).length) {
          setCfg(prev => ({
            ...prev,
            gst_rate:            d.gst_rate            ?? prev.gst_rate,
            invoice_prefix:      d.invoice_prefix      ?? prev.invoice_prefix,
            invoice_start:       d.invoice_start       ?? prev.invoice_start,
            show_gst_on_invoice: d.show_gst_on_invoice ?? prev.show_gst_on_invoice,
            auto_invoice_number: d.auto_invoice_number ?? prev.auto_invoice_number,
            discount_allowed:    d.discount_allowed    ?? prev.discount_allowed,
            payment_methods:     d.payment_methods     ?? prev.payment_methods,
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/clinic_settings_save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cfg, clinic_id: clinicId }),
      });
      if (!res.ok) throw new Error('Save failed');
      showToast('Billing config saved successfully');
    } catch { showToast('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  if (loading) return <PanelWrap title="Billing Config" onBack={onBack}><Skeleton h="h-64" /></PanelWrap>;

  return (
    <PanelWrap title="Billing Config" subtitle="Tax rates, invoice numbering, and payment methods" onBack={onBack}>
      <div className="space-y-6">
        <div>
          <SectionTitle>Tax Settings</SectionTitle>
          <Select label="GST Rate (%)" value={cfg.gst_rate} onChange={set('gst_rate')} options={['0','5','12','18','28']} />
          <div className="mt-3">
            <Toggle value={cfg.show_gst_on_invoice} onChange={set('show_gst_on_invoice')} label="Display GST breakdown on printed invoice" />
          </div>
        </div>
        <div>
          <SectionTitle>Invoice Numbering</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Prefix"       value={cfg.invoice_prefix} onChange={set('invoice_prefix')} />
            <Input label="Starting No." value={cfg.invoice_start}  onChange={set('invoice_start')} type="number" min="1" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Preview</label>
              <div className="px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-sm font-mono text-teal-700">
                {cfg.invoice_prefix}-{cfg.invoice_start}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Toggle value={cfg.auto_invoice_number} onChange={set('auto_invoice_number')} label="Auto-increment invoice numbers" sub="Automatically assign the next invoice number on creation" />
          </div>
        </div>
        <div>
          <SectionTitle>Accepted Payment Methods</SectionTitle>
          {Object.keys(cfg.payment_methods).map(pm => (
            <Toggle key={pm} value={cfg.payment_methods[pm]} onChange={setpm(pm)} label={pm} />
          ))}
        </div>
        <div>
          <SectionTitle>Other</SectionTitle>
          <Toggle value={cfg.discount_allowed} onChange={set('discount_allowed')} label="Allow discounts on bills" sub="Permit staff to apply discounts when creating invoices" />
        </div>
        <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
      </div>
    </PanelWrap>
  );
};
// ═══════════════════════════════════════════════════════════════
// 5. SECURITY
// ═══════════════════════════════════════════════════════════════
const Security = ({ onBack, showToast }) => {
  const session  = getSession();
  const clinicId = session?.clinic_id;
  const [cfg, setCfg] = useState({ twofa:false, session_timeout:'30', min_password_len:'8', require_uppercase:true, require_number:true, require_symbol:false, login_attempts:'5' });
  const set = k => v => setCfg(f=>({...f,[k]:v}));
  const [pwModal, setPwModal] = useState(false);
  const [pw,      setPw]      = useState({ current:'', newPw:'', confirm:'' });
  const [saving,  setSaving]  = useState(false);

  const handlePwChange = async () => {
    if (pw.newPw !== pw.confirm)                        { showToast('Passwords do not match','error'); return; }
    if (pw.newPw.length < Number(cfg.min_password_len)) { showToast(`Min length: ${cfg.min_password_len} chars`,'error'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/users_create_update/`, { method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ id:session?.id, clinic_id:clinicId, full_name:session?.full_name, email:session?.email, role:session?.role, is_active:true, password_hash:pw.newPw, user:session?.id||1, qualifications:[] }) });
      if (!res.ok) throw new Error('Failed to change password');
      setPwModal(false); setPw({ current:'', newPw:'', confirm:'' });
      showToast('Password changed successfully');
    } catch(e) { showToast(e.message,'error'); } finally { setSaving(false); }
  };

  return (
    <PanelWrap title="Security" subtitle="Password policy, 2FA, and session management" onBack={onBack}>
      <div className="space-y-6">
        <div>
          <SectionTitle>Two-Factor Authentication</SectionTitle>
          <div className="bg-slate-50 rounded-xl px-4"><Toggle value={cfg.twofa} onChange={set('twofa')} label="Enable 2FA for all users" sub="Users will be prompted for OTP on each login" /></div>
        </div>
        <div>
          <SectionTitle>Session Management</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Session timeout (minutes)" value={cfg.session_timeout} onChange={set('session_timeout')}
              options={[{value:'15',label:'15 minutes'},{value:'30',label:'30 minutes'},{value:'60',label:'1 hour'},{value:'120',label:'2 hours'},{value:'480',label:'8 hours'}]} />
            <Select label="Max failed login attempts" value={cfg.login_attempts} onChange={set('login_attempts')}
              options={['3','5','10'].map(v=>({value:v,label:`${v} attempts`}))} />
          </div>
        </div>
        <div>
          <SectionTitle>Password Policy</SectionTitle>
          <div className="mb-3 max-w-xs">
            <Select label="Minimum password length" value={cfg.min_password_len} onChange={set('min_password_len')}
              options={['6','8','10','12'].map(v=>({value:v,label:`${v} characters`}))} />
          </div>
          <div className="bg-slate-50 rounded-xl px-4">
            {[['require_uppercase','Require uppercase letter'],['require_number','Require number'],['require_symbol','Require special character']].map(([k,l]) => (
              <Toggle key={k} value={cfg[k]} onChange={set(k)} label={l} />
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Admin Password</SectionTitle>
          <Btn variant="secondary" onClick={()=>setPwModal(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            Change Password
          </Btn>
        </div>
        <Btn onClick={() => showToast('Security settings saved')}>Save Settings</Btn>
      </div>

      {pwModal && (
        <Modal title="Change Password" onClose={()=>setPwModal(false)}>
          <div className="space-y-4">
            {[['current','Current Password'],['newPw','New Password'],['confirm','Confirm Password']].map(([k,l]) => (
              <Input key={k} label={l} type="password" value={pw[k]} onChange={v=>setPw(p=>({...p,[k]:v}))} />
            ))}
            <div className="flex gap-3 pt-1">
              <Btn onClick={handlePwChange} className="flex-1" disabled={saving}>{saving?'Changing…':'Change Password'}</Btn>
              <Btn variant="secondary" onClick={()=>setPwModal(false)} className="flex-1">Cancel</Btn>
            </div>
          </div>
        </Modal>
      )}
    </PanelWrap>
  );
};
// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
const SECTIONS = [
  { key:'clinic',        title:'Clinic Profile',  desc:'Update clinic name, address, contact, and logo',    icon:Icons.Building },
  { key:'users',         title:'User Management', desc:'Manage staff accounts and role permissions',         icon:Icons.Users    },
  { key:'billing',       title:'Billing Config',  desc:'Tax rates, invoice numbering, and payment methods', icon:Icons.Bill     },
  { key:'security',      title:'Security',        desc:'Password policy, 2FA, and session management',      icon:Icons.Settings },
 
];

const PANEL_MAP = { clinic:ClinicProfile, users:UserManagement, billing:BillingConfig, security:Security };

const SettingsPage = () => {
  const [active, setActive] = useState(null);
  const [toast,  setToast]  = useState(null);

  const showToast = (message, type='success') => { setToast({ message, type }); setTimeout(()=>setToast(null), 3000); };
  const panelProps = { onBack:()=>setActive(null), showToast };

  const ActivePanel = active ? PANEL_MAP[active] : null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Clinic configuration and preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {SECTIONS.map(s => <SectionCard key={s.key} {...s} active={active===s.key} onClick={()=>setActive(active===s.key?null:s.key)} />)}
      </div>
      {ActivePanel && <ActivePanel {...panelProps} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
};

export default SettingsPage;