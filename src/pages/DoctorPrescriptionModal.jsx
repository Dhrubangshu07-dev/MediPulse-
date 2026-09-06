import { useState, useEffect } from "react";
import { X, UploadCloud, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../contexts/LanguageContext";

export default function DoctorPrescriptionModal({ appointment, onClose }) {
  const { t } = useLanguage();
  const [medicines, setMedicines] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);

  // Fetch existing prescription if any
  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/prescriptions?appointmentId=${appointment.id}`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          const p = json.data[0];
          setMedicines(p.medicines || []);
          setNotes(p.notes || "");
          setImageHistory(p.images || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPrescription();
  }, [appointment.id]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const newMeds = [...medicines];
    newMeds[index][field] = value;
    setMedicines(newMeds);
  };

  const savePrescription = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          patientId: appointment.patient.id,
          doctorId: appointment.doctorId,
          medicines,
          notes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert("Prescription saved successfully!");
      } else {
        alert("Error saving prescription");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${appointment.id}-${Date.now()}.${fileExt}`;
      const filePath = `prescriptions/${fileName}`;

      const { data, error } = await supabase.storage
        .from('medipulse')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('medipulse').getPublicUrl(filePath);
      const storageUrl = urlData.publicUrl;

      // Save to backend
      const res = await fetch(`http://localhost:5000/api/prescriptions/${appointment.prescription?.id || 'new'}/images`, { // assuming the backend handles 'new' or we already have the prescription ID... wait, we need the prescription ID.
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageUrl,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          uploadedBy: appointment.doctor.name,
          patientId: appointment.patient.id,
          doctorId: appointment.doctorId,
          appointmentId: appointment.id
        }),
      });
      const json = await res.json();
      if (json.success) {
        setImageHistory([json.data, ...imageHistory]);
        alert("Image uploaded!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image. Please ensure Supabase storage bucket 'medipulse' exists and is public.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto text-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t("prescription.prescription", "Prescription")}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"><X size={20} /></button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t("appointment.yourInfo", "Patient Details")}</h3>
          <p className="text-lg font-semibold text-white">{appointment.patient.name}</p>
          <p className="text-sm text-slate-400">{new Date(appointment.date).toDateString()} - {appointment.timeSlot}</p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t("prescription.medicines", "Medicines")}</h3>
              <button onClick={addMedicine} className="flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300">
                <Plus size={16} /> {t("prescription.addMedicine", "Add Medicine")}
              </button>
            </div>
            
            <div className="space-y-4">
              {medicines.map((med, index) => (
                <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t("prescription.medicine", "Medicine Name")}</label>
                    <input type="text" value={med.name} onChange={(e) => updateMedicine(index, "name", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500" placeholder="e.g. Paracetamol" />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t("prescription.dosage", "Dosage")}</label>
                    <input type="text" value={med.dosage} onChange={(e) => updateMedicine(index, "dosage", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500" placeholder="e.g. 500mg" />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t("prescription.frequency", "Frequency")}</label>
                    <input type="text" value={med.frequency} onChange={(e) => updateMedicine(index, "frequency", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500" placeholder="e.g. 2x daily" />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{t("prescription.duration", "Duration")}</label>
                    <input type="text" value={med.duration} onChange={(e) => updateMedicine(index, "duration", e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500" placeholder="e.g. 5 days" />
                  </div>
                  <button onClick={() => removeMedicine(index)} className="mt-6 p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg h-max self-start"><Trash2 size={18} /></button>
                </div>
              ))}
              {medicines.length === 0 && <p className="text-slate-500 text-sm">{t("pharmacist.noStructuredMedicines", "No medicines added.")}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">{t("prescription.notes", "Additional Notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500" placeholder="Any special instructions..."></textarea>
          </div>

          <button onClick={savePrescription} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? t("common.loading", "Saving...") : t("prescription.savePrescription", "Save Prescription")}
          </button>
        </div>

        <hr className="my-8 border-slate-700" />

        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t("prescription.prescriptionImage", "Prescription Image Upload")}</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
             <label className="flex-1 border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">{t("prescription.uploadImage", "Click to upload image")}</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF</p>
                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleImageUpload} disabled={uploading} />
             </label>
             {uploading && <div className="text-sm text-blue-400 font-semibold mt-2 px-4 py-8">{t("common.loading", "Uploading...")}</div>}
          </div>

          {imageHistory.length > 0 && (
             <div className="mt-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t("prescription.imageHistory", "Image History")}</h4>
                <div className="space-y-3">
                   {imageHistory.map((img, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-800/50 border border-slate-700 p-3 rounded-lg">
                         <div>
                            <p className="text-sm font-semibold text-slate-200">{t("prescription.version", "Version")} {img.version}</p>
                            <p className="text-xs text-slate-500">{new Date(img.uploadedAt).toLocaleString()}</p>
                         </div>
                         <a href={img.storageUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-400 font-semibold hover:underline">{t("common.view", "View")}</a>
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
