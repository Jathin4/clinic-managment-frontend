import { useState } from 'react';
import Icons from './Icons';
import { RightDrawer, Btn, Input, Select, Toast } from './UI';

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const CLINIC_ID = 1;

const TABS = [
  { id: 'encounter',     label: 'Encounter',     icon: Icons.Encounter },
  { id: 'diagnoses',     label: 'Diagnoses',     icon: Icons.Diagnosis },
  { id: 'prescriptions', label: 'Prescriptions', icon: Icons.Prescription },
];

const FREQUENCY_OPTIONS = ["OD", "BID", "TID", "QID", "SOS", "HS"];

// ── EncounterWorkflow ──────────────────────────────────────────────────────
const EncounterWorkflow = ({ open, onClose, appointment, patientName, doctorName, onComplete }) => {
  const [activeTab, setActiveTab] = useState('encounter');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  // Encounter form
  const [encounter, setEncounter] = useState({
    chief_complaint: appointment?.notes || '',
    notes: '',
    follow_up_date: '',
  });

  // Diagnoses list — multiple items
  const [diagnoses, setDiagnoses] = useState([]);
  const [dxForm, setDxForm] = useState({ icd_code: '', description: '' });

  // Prescriptions list — multiple items
  const [prescriptions, setPrescriptions] = useState([]);
  const [rxForm, setRxForm] = useState({ medicine_name: '', dosage: '', frequency: 'OD', duration: '', instructions: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Add diagnosis to list ──
  const addDiagnosis = () => {
    if (!dxForm.icd_code || !dxForm.description) {
      showToast('ICD Code and Description are required', 'error');
      return;
    }
    setDiagnoses(prev => [...prev, { ...dxForm, id: `DX-${Date.now()}` }]);
    setDxForm({ icd_code: '', description: '' });
    showToast('Diagnosis added');
  };

  const removeDiagnosis = (id) => {
    setDiagnoses(prev => prev.filter(d => d.id !== id));
  };

  // ── Add prescription to list ──
  const addPrescription = () => {
    if (!rxForm.medicine_name || !rxForm.dosage) {
      showToast('Medicine name and dosage are required', 'error');
      return;
    }
    setPrescriptions(prev => [...prev, { ...rxForm, id: `RX-${Date.now()}` }]);
    setRxForm({ medicine_name: '', dosage: '', frequency: 'OD', duration: '', instructions: '' });
    showToast('Prescription added');
  };

  const removePrescription = (id) => {
    setPrescriptions(prev => prev.filter(r => r.id !== id));
  };

  // ── Save all & complete ──
  const handleComplete = async () => {
    if (!encounter.chief_complaint) {
      setActiveTab('encounter');
      showToast('Chief complaint is required', 'error');
      return;
    }

    setSaving(true);
    try {
      // 1. Create encounter
      const encPayload = {
        clinic_id: CLINIC_ID,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_id: appointment.id,
        chief_complaint: encounter.chief_complaint,
        notes: encounter.notes,
        follow_up_date: encounter.follow_up_date || null,
        user: 'admin',
      };

      const encRes = await fetch(`${API_BASE}/encounter_create_update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encPayload),
      });
      const encData = await encRes.json();
      const encounterId = encData?.id || encData?.encounter_id;

      // 2. Create diagnoses
      for (const dx of diagnoses) {
        await fetch(`${API_BASE}/diagnosis_create_update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            encounter_id: encounterId,
            icd_code: dx.icd_code,
            description: dx.description,
            user: 'admin',
          }),
        });
      }

      // 3. Create prescriptions
      for (const rx of prescriptions) {
        await fetch(`${API_BASE}/prescription_create_update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            encounter_id: encounterId,
            medicine_name: rx.medicine_name,
            dosage: rx.dosage,
            frequency: rx.frequency,
            duration: rx.duration,
            instructions: rx.instructions,
            user: 'admin',
          }),
        });
      }

      // 4. Mark appointment as Completed
      await fetch(`${API_BASE}/appointment_create_update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: appointment.id,
          clinic_id: CLINIC_ID,
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          appointment_date: appointment.appointment_date,
          slot_time: appointment.slot_time,
          status: 'Completed',
          token_number: appointment.token_number,
          notes: appointment.notes,
          is_active: true,
          user: 'admin',
        }),
      });

      showToast('Encounter completed successfully!');
      setTimeout(() => {
        onComplete?.();
        handleClose();
      }, 800);
    } catch (err) {
      console.error('Error saving encounter:', err);
      showToast('Failed to save. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setActiveTab('encounter');
    setEncounter({ chief_complaint: appointment?.notes || '', notes: '', follow_up_date: '' });
    setDiagnoses([]);
    setPrescriptions([]);
    setDxForm({ icd_code: '', description: '' });
    setRxForm({ medicine_name: '', dosage: '', frequency: 'OD', duration: '', instructions: '' });
    onClose();
  };

  const tabIndex = TABS.findIndex(t => t.id === activeTab);
  const canGoNext = tabIndex < TABS.length - 1;
  const canGoBack = tabIndex > 0;

  return (
    <>
      <RightDrawer title="" open={open} onClose={handleClose}>
        <div className="h-full flex flex-col">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="px-8 py-5 bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Patient Encounter</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {patientName} &bull; {doctorName}
                </p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors text-gray-500 hover:text-gray-900">
                <Icons.X />
              </button>
            </div>
          </div>

          {/* ── Tab Bar ─────────────────────────────────────────────── */}
          <div className="px-8 pt-4 pb-0 bg-white border-b border-gray-100">
            <div className="flex gap-1">
              {TABS.map((tab, i) => {
                const isActive = activeTab === tab.id;
                const isCompleted = i < tabIndex;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${
                      isActive
                        ? 'border-teal-600 text-teal-700 bg-teal-50/60'
                        : isCompleted
                        ? 'border-transparent text-emerald-600 hover:bg-gray-50'
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon />
                    <span>{tab.label}</span>
                    {tab.id === 'diagnoses' && diagnoses.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 font-bold">{diagnoses.length}</span>
                    )}
                    {tab.id === 'prescriptions' && prescriptions.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-teal-100 text-teal-700 font-bold">{prescriptions.length}</span>
                    )}
                    {isCompleted && <Icons.Check />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Tab Content ─────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-8 py-6">

            {/* ── Encounter Tab ───────────────────────────────────── */}
            {activeTab === 'encounter' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-teal-100">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                    <Icons.Encounter />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Clinical Details</p>
                    <p className="text-sm text-gray-500 mt-0.5">Record the encounter information</p>
                  </div>
                </div>

                <Input
                  label="Chief Complaint"
                  value={encounter.chief_complaint}
                  onChange={v => setEncounter({ ...encounter, chief_complaint: v })}
                  placeholder="Primary reason for visit"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinical Notes</label>
                  <textarea
                    value={encounter.notes}
                    onChange={e => setEncounter({ ...encounter, notes: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-50 resize-none transition-all"
                    placeholder="Detailed clinical observations, examination findings, vitals…"
                  />
                </div>

                <Input
                  label="Follow-up Date"
                  type="date"
                  value={encounter.follow_up_date}
                  onChange={v => setEncounter({ ...encounter, follow_up_date: v })}
                />

                {/* Info */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3">
                  <div className="text-blue-600 flex-shrink-0"><Icons.AlertTriangle /></div>
                  <p className="text-sm text-blue-800">
                    After filling encounter details, switch to <strong>Diagnoses</strong> and <strong>Prescriptions</strong> tabs to add them.
                  </p>
                </div>
              </div>
            )}

            {/* ── Diagnoses Tab ────────────────────────────────────── */}
            {activeTab === 'diagnoses' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icons.Diagnosis />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Diagnoses</p>
                    <p className="text-sm text-gray-500 mt-0.5">Add ICD-10 diagnosis codes</p>
                  </div>
                </div>

                {/* Add form */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="ICD-10 Code"
                      value={dxForm.icd_code}
                      onChange={v => setDxForm({ ...dxForm, icd_code: v })}
                      placeholder="e.g. A09, I10"
                    />
                    <div className="col-span-2">
                      <Input
                        label="Description"
                        value={dxForm.description}
                        onChange={v => setDxForm({ ...dxForm, description: v })}
                        placeholder="Full diagnosis description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Btn size="sm" onClick={addDiagnosis} disabled={!dxForm.icd_code || !dxForm.description}>
                      <Icons.Plus /> Add Diagnosis
                    </Btn>
                  </div>
                </div>

                {/* Diagnoses list */}
                {diagnoses.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Icons.Diagnosis />
                    <p className="mt-2 text-sm">No diagnoses added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {diagnoses.map((dx, i) => (
                      <div key={dx.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-blue-200 transition-colors">
                        <span className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-700">{i + 1}</span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">{dx.icd_code}</span>
                        <span className="flex-1 text-sm text-slate-700">{dx.description}</span>
                        <button onClick={() => removeDiagnosis(dx.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors">
                          <Icons.Trash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Prescriptions Tab ────────────────────────────────── */}
            {activeTab === 'prescriptions' && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-violet-100">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                    <Icons.Prescription />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Prescriptions</p>
                    <p className="text-sm text-gray-500 mt-0.5">Add medicines for this encounter</p>
                  </div>
                </div>

                {/* Add form */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Medicine Name"
                      value={rxForm.medicine_name}
                      onChange={v => setRxForm({ ...rxForm, medicine_name: v })}
                      placeholder="e.g. Paracetamol 500mg"
                    />
                    <Input
                      label="Dosage"
                      value={rxForm.dosage}
                      onChange={v => setRxForm({ ...rxForm, dosage: v })}
                      placeholder="e.g. 1 tablet"
                    />
                    <Select
                      label="Frequency"
                      value={rxForm.frequency}
                      onChange={v => setRxForm({ ...rxForm, frequency: v })}
                      options={FREQUENCY_OPTIONS}
                    />
                    <Input
                      label="Duration"
                      value={rxForm.duration}
                      onChange={v => setRxForm({ ...rxForm, duration: v })}
                      placeholder="e.g. 5 days"
                    />
                  </div>
                  <Input
                    label="Instructions"
                    value={rxForm.instructions}
                    onChange={v => setRxForm({ ...rxForm, instructions: v })}
                    placeholder="e.g. After food, before bed"
                  />
                  <div className="flex justify-end">
                    <Btn size="sm" onClick={addPrescription} disabled={!rxForm.medicine_name || !rxForm.dosage}>
                      <Icons.Plus /> Add Medicine
                    </Btn>
                  </div>
                </div>

                {/* Prescriptions list */}
                {prescriptions.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <Icons.Prescription />
                    <p className="mt-2 text-sm">No prescriptions added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prescriptions.map((rx, i) => (
                      <div key={rx.id} className="px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-violet-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center text-xs font-bold text-violet-700">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-800">{rx.medicine_name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {rx.dosage} &bull; <span className="px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-700 font-semibold">{rx.frequency}</span> &bull; {rx.duration}
                              {rx.instructions && <span className="text-slate-400"> &bull; {rx.instructions}</span>}
                            </div>
                          </div>
                          <button onClick={() => removePrescription(rx.id)} className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg text-slate-400 transition-colors">
                            <Icons.Trash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500 font-medium">
              {diagnoses.length} diagnoses &bull; {prescriptions.length} prescriptions
            </div>
            <div className="flex gap-3">
              {canGoBack && (
                <Btn variant="secondary" onClick={() => setActiveTab(TABS[tabIndex - 1].id)}>
                  <Icons.ChevronLeft /> Back
                </Btn>
              )}
              {canGoNext ? (
                <Btn onClick={() => setActiveTab(TABS[tabIndex + 1].id)}>
                  Next <Icons.ChevronRight />
                </Btn>
              ) : (
                <Btn onClick={handleComplete} disabled={saving || !encounter.chief_complaint}>
                  {saving ? 'Saving…' : <><Icons.Check /> Complete Encounter</>}
                </Btn>
              )}
            </div>
          </div>

        </div>
      </RightDrawer>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default EncounterWorkflow;
