import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Search, CheckCircle, RefreshCw, Eye } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function PharmacistDashboard() {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pharmacist/prescriptions`);
      const json = await res.json();
      if (json.success) {
        setPrescriptions(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch pharmacist prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();

    // Supabase Realtime for prescriptions table
    const channel = supabase.channel('pharmacist_prescriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Prescription' }, payload => {
        fetchPrescriptions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDispense = async (id) => {
    if (!window.confirm(t("prescription.confirmDispense", "Are you sure you have provided the prescribed medicines to this patient?"))) {
      return;
    }

    try {
      const res = await fetch(`/api/pharmacist/prescriptions/${id}/dispense`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pharmacistId: "current_pharmacist" }),
      });
      const json = await res.json();
      if (json.success) {
        fetchPrescriptions();
      } else {
        alert("Error: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to dispense");
    }
  };

  const filtered = prescriptions.filter(p => {
    const matchSearch = p.patient?.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    
    if (filter === "PENDING_DISPENSING") return p.dispensingStatus === "PENDING";
    if (filter === "DISPENSED") return p.dispensingStatus === "DISPENSED";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("pharmacist.dashboard", "Pharmacist Dashboard")}</h1>
            <p className="text-slate-500 mt-1">{t("pharmacist.dashboardDesc", "Manage completed appointments and dispense prescriptions.")}</p>
          </div>
          
          <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={t("pharmacist.searchPatient", "Search patient...")}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
             </div>
             <button onClick={fetchPrescriptions} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <RefreshCw className="w-5 h-5 text-slate-500" />
             </button>
          </div>
        </header>

        <div className="flex gap-2 mb-6">
           <button onClick={() => setFilter("ALL")} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === "ALL" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"}`}>{t("common.all", "All")}</button>
           <button onClick={() => setFilter("PENDING_DISPENSING")} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === "PENDING_DISPENSING" ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-white text-slate-600 border border-slate-200"}`}>{t("pharmacist.pendingDispensing", "Pending Dispensing")}</button>
           <button onClick={() => setFilter("DISPENSED")} className={`px-4 py-2 rounded-full text-sm font-medium ${filter === "DISPENSED" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-white text-slate-600 border border-slate-200"}`}>{t("pharmacist.dispensed", "Dispensed")}</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <h3 className="text-lg font-medium text-slate-900">{t("pharmacist.noPrescriptions", "No prescriptions found")}</h3>
            <p className="text-slate-500 mt-2">{t("pharmacist.noPrescriptionsDesc", "Try adjusting your filters or search query.")}</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                 
                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold text-lg">{p.patient?.name}</h3>
                       <span className="text-sm text-slate-500">{new Date(p.appointment?.date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="mb-4">
                       <h4 className="text-sm font-medium text-slate-500 mb-2">{t("pharmacist.prescribedMedicines", "Prescribed Medicines")}</h4>
                       {p.medicines && p.medicines.length > 0 ? (
                         <div className="overflow-x-auto">
                           <table className="w-full text-sm text-left">
                             <thead className="bg-slate-50 text-slate-500">
                               <tr>
                                 <th className="px-3 py-2 rounded-l-lg font-medium">{t("prescription.medicine", "Medicine")}</th>
                                 <th className="px-3 py-2 font-medium">{t("prescription.dosage", "Dosage")}</th>
                                 <th className="px-3 py-2 font-medium">{t("prescription.frequency", "Frequency")}</th>
                                 <th className="px-3 py-2 rounded-r-lg font-medium">{t("prescription.duration", "Duration")}</th>
                               </tr>
                             </thead>
                             <tbody>
                               {p.medicines.map((m, i) => (
                                 <tr key={i} className="border-b border-slate-50 last:border-0">
                                   <td className="px-3 py-2 font-medium text-slate-700">{m.name}</td>
                                   <td className="px-3 py-2 text-slate-600">{m.dosage}</td>
                                   <td className="px-3 py-2 text-slate-600">{m.frequency}</td>
                                   <td className="px-3 py-2 text-slate-600">{m.duration}</td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>
                         </div>
                       ) : (
                         <p className="text-sm text-slate-400">{t("pharmacist.noStructuredMedicines", "No structured medicines added.")}</p>
                       )}
                    </div>
                 </div>

                 <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                    <div>
                       <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{t("prescription.prescriptionImage", "Prescription Image")}</h4>
                       {p.images && p.images.length > 0 ? (
                          <a href={p.images[0].storageUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200">
                             <Eye className="w-4 h-4" /> {t("prescription.viewPrescription", "View Prescription")}
                          </a>
                       ) : (
                          <div className="py-2 px-3 bg-slate-50 rounded-lg text-xs text-slate-400 border border-slate-100 text-center">
                             {t("pharmacist.noImageAvailable", "No image available")}
                          </div>
                       )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100">
                       <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{t("prescription.dispensingStatus", "Dispensing Status")}</h4>
                       {p.dispensingStatus === "DISPENSED" ? (
                          <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                             <CheckCircle className="w-5 h-5" />
                             {t("prescription.medicinesGiven", "Medicines Given")}
                          </div>
                       ) : (
                          <button onClick={() => handleDispense(p.id)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                             {t("prescription.markGiven", "Mark Medicines Given")}
                          </button>
                       )}
                    </div>
                 </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
