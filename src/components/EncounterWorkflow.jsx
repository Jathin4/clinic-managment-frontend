import { useState, useEffect } from "react";
import Icons from "./Icons";
import { RightDrawer, Btn, Input, Select, Toast } from "./UI";

const API_BASE = process.env.REACT_APP_API_BASE_URL;
const CLINIC_ID = 1;

const TABS = [
  { id: "encounter", label: "Encounter", icon: Icons.Encounter },
  { id: "diagnoses", label: "Diagnoses", icon: Icons.Diagnosis },
  { id: "prescriptions", label: "Prescriptions", icon: Icons.Prescription },
];

const FREQUENCY_OPTIONS = ["OD", "BID", "TID", "QID", "SOS", "HS"];

const EncounterWorkflow = ({
  open,
  onClose,
  appointment,
  patientName,
  doctorName,
  onComplete,
}) => {
  const [activeTab, setActiveTab] = useState("encounter");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(
    appointment?.patient_id || ""
  );
  const [selectedDoctor, setSelectedDoctor] = useState(
    appointment?.doctor_id || ""
  );

  const [encounter, setEncounter] = useState({
    chief_complaint: appointment?.notes || "",
    notes: "",
    follow_up_date: "",
  });

  const [diagnoses, setDiagnoses] = useState([]);
  const [dxForm, setDxForm] = useState({ icd_code: "", description: "" });

  const [prescriptions, setPrescriptions] = useState([]);
  const [rxForm, setRxForm] = useState({
    medicine_name: "",
    dosage: "",
    frequency: "OD",
    duration: "",
    instructions: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_BASE}/patient_read?clinic_id=${CLINIC_ID}`);
      const data = await res.json();
      setPatients(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/doctorsread`);
      const data = await res.json();
      setDoctors(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Diagnosis
  const addDiagnosis = () => {
    if (!dxForm.icd_code || !dxForm.description) {
      showToast("ICD Code and Description required", "error");
      return;
    }

    setDiagnoses((prev) => [...prev, { ...dxForm, id: Date.now() }]);
    setDxForm({ icd_code: "", description: "" });
  };

  const removeDiagnosis = (id) => {
    setDiagnoses((prev) => prev.filter((d) => d.id !== id));
  };

  // Add Prescription
  const addPrescription = () => {
    if (!rxForm.medicine_name || !rxForm.dosage) {
      showToast("Medicine name and dosage required", "error");
      return;
    }

    setPrescriptions((prev) => [...prev, { ...rxForm, id: Date.now() }]);

    setRxForm({
      medicine_name: "",
      dosage: "",
      frequency: "OD",
      duration: "",
      instructions: "",
    });
  };

  const removePrescription = (id) => {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  };

  // Complete Encounter
  const handleComplete = async () => {
    if (!encounter.chief_complaint) {
      setActiveTab("encounter");
      showToast("Chief complaint required", "error");
      return;
    }

    setSaving(true);

    try {
    const payload = {
  id: null,
  clinic_id: CLINIC_ID,

  patient_id: Number(selectedPatient),
  doctor_id: Number(selectedDoctor),

  appointment_id: appointment?.id || null,

  visit_date: new Date().toISOString(),

  chief_complaint: encounter.chief_complaint,
  notes: encounter.notes,
  follow_up_date: encounter.follow_up_date || null,

  created_by: "admin",

  diagnoses: diagnoses.map(d => ({
    icd_code: d.icd_code,
    description: d.description
  })),

  prescriptions: prescriptions.map(p => ({
    medicine_name: p.medicine_name,
    dosage: p.dosage,
    frequency: p.frequency,
    duration: p.duration,
    instructions: p.instructions
  }))
};

      const res = await fetch(`${API_BASE}/save_encounter_with_details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      showToast("Encounter completed successfully");

      setTimeout(() => {
        onComplete?.(payload);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      showToast("Failed to save encounter", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <>
      <RightDrawer title="" open={open} onClose={onClose}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-8 py-5 border-b">
            <h2 className="text-xl font-bold">Patient Encounter</h2>
            <p className="text-sm text-gray-500">
              {patientName} • {doctorName}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b px-6 pt-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm ${
                  activeTab === tab.id
                    ? "text-teal-600 border-b-2 border-teal-600"
                    : "text-gray-500"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

            {/* Encounter Tab */}
            {activeTab === "encounter" && (
              <>
                <Select
                  label="Patient"
                  value={selectedPatient}
                  onChange={(v) => setSelectedPatient(v)}
                  options={patients.map((p) => ({
                    value: p.id,
                    label: `${p.first_name} ${p.last_name}`,
                  }))}
                />

                <Select
                  label="Doctor"
                  value={selectedDoctor}
                  onChange={(v) => setSelectedDoctor(v)}
                  options={doctors.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                />

                <Input
                  label="Chief Complaint"
                  value={encounter.chief_complaint}
                  onChange={(v) =>
                    setEncounter({ ...encounter, chief_complaint: v })
                  }
                />

                <div>
                  <label className="text-sm font-medium">Clinical Notes</label>
                  <textarea
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={encounter.notes}
                    onChange={(e) =>
                      setEncounter({ ...encounter, notes: e.target.value })
                    }
                  />
                </div>

                <Input
                  label="Follow-up Date"
                  type="date"
                  value={encounter.follow_up_date}
                  onChange={(v) =>
                    setEncounter({ ...encounter, follow_up_date: v })
                  }
                />
              </>
            )}

            {/* Diagnoses Tab */}
            {activeTab === "diagnoses" && (
              <>
                <Input
                  label="ICD Code"
                  value={dxForm.icd_code}
                  onChange={(v) => setDxForm({ ...dxForm, icd_code: v })}
                />

                <Input
                  label="Description"
                  value={dxForm.description}
                  onChange={(v) => setDxForm({ ...dxForm, description: v })}
                />

                <Btn onClick={addDiagnosis}>
                  <Icons.Plus /> Add Diagnosis
                </Btn>

                {diagnoses.map((d) => (
                  <div
                    key={d.id}
                    className="flex justify-between border p-2 rounded"
                  >
                    {d.icd_code} - {d.description}
                    <button onClick={() => removeDiagnosis(d.id)}>
                      <Icons.Trash />
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* Prescriptions Tab */}
            {activeTab === "prescriptions" && (
              <>
                <Input
                  label="Medicine Name"
                  value={rxForm.medicine_name}
                  onChange={(v) =>
                    setRxForm({ ...rxForm, medicine_name: v })
                  }
                />

                <Input
                  label="Dosage"
                  value={rxForm.dosage}
                  onChange={(v) => setRxForm({ ...rxForm, dosage: v })}
                />

                <Select
                  label="Frequency"
                  value={rxForm.frequency}
                  onChange={(v) => setRxForm({ ...rxForm, frequency: v })}
                  options={FREQUENCY_OPTIONS}
                />

                <Input
                  label="Duration"
                  value={rxForm.duration}
                  onChange={(v) => setRxForm({ ...rxForm, duration: v })}
                />

                <Input
                  label="Instructions"
                  value={rxForm.instructions}
                  onChange={(v) =>
                    setRxForm({ ...rxForm, instructions: v })
                  }
                />

                <Btn onClick={addPrescription}>
                  <Icons.Plus /> Add Medicine
                </Btn>

                {prescriptions.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between border p-2 rounded"
                  >
                    {p.medicine_name} • {p.frequency}
                    <button onClick={() => removePrescription(p.id)}>
                      <Icons.Trash />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t flex justify-end gap-3">
            {tabIndex > 0 && (
              <Btn
                variant="secondary"
                onClick={() => setActiveTab(TABS[tabIndex - 1].id)}
              >
                Back
              </Btn>
            )}

            {tabIndex < TABS.length - 1 ? (
              <Btn onClick={() => setActiveTab(TABS[tabIndex + 1].id)}>
                Next
              </Btn>
            ) : (
              <Btn onClick={handleComplete} disabled={saving}>
                {saving ? "Saving..." : "Complete Encounter"}
              </Btn>
            )}
          </div>
        </div>
      </RightDrawer>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default EncounterWorkflow;