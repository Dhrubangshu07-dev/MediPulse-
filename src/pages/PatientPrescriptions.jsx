import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { FileText, CheckCircle, Clock, Eye } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function PatientPrescriptions({ patientId }) {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prescriptions?patientId=${patientId}`);
      const json = await res.json();
      if (json.success) {
        setPrescriptions(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();

    // Supabase Realtime for prescriptions and images
    const channel = supabase.channel('patient_prescriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Prescription', filter: `patientId=eq.${patientId}` }, payload => {
        fetchPrescriptions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'PrescriptionImage', filter: `patientId=eq.${patientId}` }, payload => {
        fetchPrescriptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  if (loading) {
    return (
       <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
       </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-sm">
        <FileText size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="font-bold text-slate-600">{t("prescription.noPrescriptions", "No prescriptions yet")}</p>
        <p className="text-sm text-slate-400 mt-1">{t("prescription.noPrescriptionsDesc", "Your prescriptions and reports will appear here after consultations.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {prescriptions.map((p) => (
        <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h3 className="font-bold text-lg text-slate-900">{t("prescription.prescription", "Prescription")} {t("common.from", "from")} {p.doctor?.user?.name || "Doctor"}</h3>
              <p className="text-sm text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              {p.dispensingStatus === "DISPENSED" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-100">
                  <CheckCircle size={14} /> {t("prescription.medicinesGiven", "Medicines Given")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-bold border border-amber-100">
                  <Clock size={14} /> {t("prescription.awaitingDispensing", "Awaiting Dispensing")}
                </span>
              )}
            </div>
          </div>

          {p.medicines && p.medicines.length > 0 && (
            <div className="mb-6">
               <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">{t("prescription.medicines", "Medicines")}</h4>
               <div className="overflow-x-auto rounded-xl border border-slate-100">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-600">
                     <tr>
                       <th className="px-4 py-3 font-semibold">{t("prescription.medicine", "Medicine")}</th>
                       <th className="px-4 py-3 font-semibold">{t("prescription.dosage", "Dosage")}</th>
                       <th className="px-4 py-3 font-semibold">{t("prescription.frequency", "Frequency")}</th>
                       <th className="px-4 py-3 font-semibold">{t("prescription.duration", "Duration")}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {p.medicines.map((m, i) => (
                       <tr key={i} className="hover:bg-slate-50/50">
                         <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                         <td className="px-4 py-3 text-slate-600">{m.dosage}</td>
                         <td className="px-4 py-3 text-slate-600">{m.frequency}</td>
                         <td className="px-4 py-3 text-slate-600">{m.duration}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {p.notes && (
             <div className="mb-6">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-2">{t("prescription.notes", "Doctor's Notes")}</h4>
                <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{p.notes}</p>
             </div>
          )}

          {p.images && p.images.length > 0 && (
             <div>
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3">{t("prescription.prescriptionImage", "Prescription Images")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {p.images.map((img, i) => (
                      <a key={i} href={img.storageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-colors group">
                         <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <Eye size={18} className="text-green-600 group-hover:scale-110 transition-transform" />
                         </div>
                         <div>
                            <div className="text-sm font-bold text-slate-800">{t("prescription.version", "Version")} {img.version} {i === 0 && `(${t("prescription.latest", "Latest")})`}</div>
                            <div className="text-xs text-slate-500">{new Date(img.uploadedAt).toLocaleString()}</div>
                         </div>
                      </a>
                   ))}
                </div>
             </div>
          )}
        </div>
      ))}
    </div>
  );
}
