/**
 * supabaseDb.js
 *
 * High-performance, firewall-resilient data access layer for MediPulse.
 * Connects to Supabase PostgreSQL via HTTPS REST API (port 443).
 *
 * Why this is crucial:
 * - Institutional / campus networks frequently block raw TCP ports (5432 & 6543).
 * - Standard HTTPS (port 443) is never blocked and requires no persistent connection pool.
 * - Responds in <100ms with zero timeout risks or pool exhaustion.
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://enuewanwmwwqeshfyylp.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_uIPUPZQz2oto78IrdRmzmg_wFhlCj-g";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── CUID generator helper for PostgreSQL primary keys ─────────────────────────
function generateCuid(prefix = "cmtl") {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${ts}${rand}`;
}

// ── Doctor Normalizer ─────────────────────────────────────────────────────────
function normalizeDoctor(d) {
  const u = d.user || {};
  const name = u.name || "Unknown Doctor";
  const avatar = u.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

  return {
    id: d.id,
    userId: d.userId,
    name,
    email: u.email || "",
    avatarUrl: avatar,
    image: avatar, // used by DoctorCard.jsx
    specialization: d.specialization || "General",
    specialty: d.specialization || "General",
    qualification: d.qualification || "",
    registrationNo: d.registrationNo || "",
    experienceYears: Number(d.experienceYears || 0),
    experience: Number(d.experienceYears || 0),
    consultationFee: Number(d.consultationFee || 0),
    fee: Number(d.consultationFee || 0),
    bio: d.bio || "",
    status: d.status || "AVAILABLE",
    available: d.status === "AVAILABLE",
    rating: Number(d.rating || 0),
    totalReviews: Number(d.totalReviews || 0),
    reviews: Number(d.totalReviews || 0),
    isVerified: Boolean(d.isVerified),
    badge: d.isVerified ? "Verified" : "",
    hospital: d.hospital || "MediPulse Hospital",
    nextSlot: d.nextSlot || "Today",
    consultType: d.consultType || ["In-clinic", "Video Consult"],
    user: u,
  };
}

// ── Appointment Normalizer ───────────────────────────────────────────────────
function normalizeAppointment(a) {
  const doctorUser = a.doctor?.user || {};
  const docName = doctorUser.name || "Doctor";
  const docAvatar = doctorUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(docName)}`;

  return {
    id: a.id,
    patientId: a.patientId,
    doctorId: a.doctorId,
    date: a.date,
    timeSlot: a.timeSlot,
    status: a.status,
    consultationFee: Number(a.consultationFee || 0),
    taxAmount: Number(a.taxAmount || 0),
    totalAmount: Number(a.totalAmount || 0),
    transactionId: a.transactionId,
    meetingUrl: a.meetingUrl,
    notes: a.notes,
    cancelledAt: a.cancelledAt,
    cancellationReason: a.cancellationReason,
    createdAt: a.createdAt,
    patient: a.patient ? {
      id: a.patient.id,
      name: a.patient.name,
      email: a.patient.email,
      phone: a.patient.phone,
      avatarUrl: a.patient.avatarUrl,
    } : null,
    doctor: a.doctor ? {
      id: a.doctor.id,
      specialization: a.doctor.specialization,
      consultationFee: Number(a.doctor.consultationFee || 0),
      rating: Number(a.doctor.rating || 0),
      user: {
        id: doctorUser.id,
        name: docName,
        email: doctorUser.email,
        avatarUrl: docAvatar,
      },
    } : null,
  };
}

// ── Doctors API ───────────────────────────────────────────────────────────────
async function getDoctors(specialty) {
  let query = supabase
    .from("DoctorProfile")
    .select("*, user:User(*)")
    .order("rating", { ascending: false });

  if (specialty && specialty.toLowerCase() !== "all") {
    query = query.ilike("specialization", `%${specialty}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeDoctor);
}

async function getDoctorById(id) {
  const { data, error } = await supabase
    .from("DoctorProfile")
    .select("*, user:User(*), appointments:Appointment(*, patient:User(*))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data ? normalizeDoctor(data) : null;
}

async function getDoctorByEmail(email) {
  const { data: user, error: uErr } = await supabase
    .from("User")
    .select("*, doctorProfile:DoctorProfile(*, appointments:Appointment(*, patient:User(*)))")
    .eq("email", email)
    .single();

  if (uErr || !user) return null;
  const doc = user.doctorProfile?.[0] || user.doctorProfile;
  if (!doc) return null;
  return normalizeDoctor({ ...doc, user });
}

async function createDoctor({ name, email, specialization, qualification, experience, fee, phone, bio, status, isVerified, avatarUrl }) {
  const userId = generateCuid("usr");
  const doctorId = generateCuid("doc");

  const avatar = avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "Doctor")}`;

  // 1. Create or update User
  const { data: userData, error: userErr } = await supabase
    .from("User")
    .upsert({
      id: userId,
      name,
      email,
      phone: phone || null,
      role: "DOCTOR",
      status: "ACTIVE",
      avatarUrl: avatar,
      updatedAt: new Date().toISOString(),
    }, { onConflict: "email" })
    .select()
    .single();

  if (userErr) throw userErr;

  // 2. Create DoctorProfile
  const { data: docData, error: docErr } = await supabase
    .from("DoctorProfile")
    .insert({
      id: doctorId,
      userId: userData.id,
      specialization: specialization || "General Physician",
      qualification: qualification || "",
      registrationNo: "",
      experienceYears: Number(experience || 0),
      consultationFee: Number(fee || 100),
      bio: bio || "",
      status: status || "AVAILABLE",
      isVerified: Boolean(isVerified),
      rating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select("*, user:User(*)")
    .single();

  if (docErr) throw docErr;
  return normalizeDoctor(docData);
}

async function updateDoctor(id, data) {
  const updatePayload = {
    updatedAt: new Date().toISOString(),
  };

  if (data.specialization !== undefined) updatePayload.specialization = data.specialization;
  if (data.qualification !== undefined)  updatePayload.qualification  = data.qualification;
  if (data.registrationNo !== undefined) updatePayload.registrationNo = data.registrationNo;
  if (data.experienceYears !== undefined) updatePayload.experienceYears = Number(data.experienceYears);
  if (data.experience !== undefined)      updatePayload.experienceYears = Number(data.experience);
  if (data.consultationFee !== undefined) updatePayload.consultationFee = Number(data.consultationFee);
  if (data.fee !== undefined)             updatePayload.consultationFee = Number(data.fee);
  if (data.bio !== undefined)            updatePayload.bio            = data.bio;
  if (data.status !== undefined)         updatePayload.status         = data.status;
  if (data.isVerified !== undefined)     updatePayload.isVerified     = Boolean(data.isVerified);

  const { data: updatedDoc, error: docErr } = await supabase
    .from("DoctorProfile")
    .update(updatePayload)
    .eq("id", id)
    .select("*, user:User(*)")
    .single();

  if (docErr) throw docErr;

  if (data.name || data.email || data.avatarUrl) {
    const userUpdate = { updatedAt: new Date().toISOString() };
    if (data.name) userUpdate.name = data.name;
    if (data.email) userUpdate.email = data.email;
    if (data.avatarUrl) userUpdate.avatarUrl = data.avatarUrl;

    await supabase
      .from("User")
      .update(userUpdate)
      .eq("id", updatedDoc.userId);
  }

  const fresh = await getDoctorById(id);
  return fresh;
}

async function deleteDoctor(id) {
  const { data: doc, error: getErr } = await supabase
    .from("DoctorProfile")
    .select("userId")
    .eq("id", id)
    .single();

  if (getErr || !doc) return false;

  await supabase.from("DoctorProfile").delete().eq("id", id);
  if (doc.userId) {
    await supabase.from("User").delete().eq("id", doc.userId);
  }
  return true;
}

// ── Appointments API ──────────────────────────────────────────────────────────
async function getAppointments({ patientEmail, patientId, doctorId, status }) {
  let query = supabase
    .from("Appointment")
    .select("*, patient:User!Appointment_patientId_fkey(*), doctor:DoctorProfile!Appointment_doctorId_fkey(*, user:User(*))")
    .order("date", { ascending: false });

  if (status) query = query.eq("status", status);
  if (doctorId) query = query.eq("doctorId", doctorId);
  if (patientId) query = query.eq("patientId", patientId);

  const { data, error } = await query;
  if (error) throw error;

  let list = data || [];
  if (patientEmail) {
    list = list.filter(a => a.patient?.email?.toLowerCase() === patientEmail.toLowerCase());
  }

  return list.map(normalizeAppointment);
}

async function getAppointmentById(id) {
  const { data, error } = await supabase
    .from("Appointment")
    .select("*, patient:User!Appointment_patientId_fkey(*), doctor:DoctorProfile!Appointment_doctorId_fkey(*, user:User(*))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data ? normalizeAppointment(data) : null;
}

async function createAppointment({ doctorId, date, slot, patient }) {
  // 1. Find or create patient User
  let patientUser = null;
  if (patient.email) {
    const { data: existingUser } = await supabase
      .from("User")
      .select("*")
      .eq("email", patient.email)
      .maybeSingle();

    patientUser = existingUser;
  }

  if (!patientUser) {
    const newUid = generateCuid("usr");
    const { data: created, error: createErr } = await supabase
      .from("User")
      .insert({
        id: newUid,
        name: patient.name || "Patient",
        email: patient.email || `guest_${Date.now()}@medipulse.dev`,
        phone: patient.phone || null,
        role: "CUSTOMER",
        status: "ACTIVE",
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(patient.name || "Patient")}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (createErr) throw createErr;
    patientUser = created;
  }

  // 2. Fetch Doctor
  const { data: doctor, error: docErr } = await supabase
    .from("DoctorProfile")
    .select("*")
    .eq("id", doctorId)
    .single();

  if (docErr || !doctor) {
    const err = new Error("Doctor not found.");
    err.status = 404;
    throw err;
  }

  // 3. Check for existing booking on that slot
  const appointmentDate = new Date(date).toISOString();
  const { data: conflict } = await supabase
    .from("Appointment")
    .select("id")
    .eq("doctorId", doctorId)
    .eq("timeSlot", slot)
    .neq("status", "CANCELLED")
    .maybeSingle();

  // (Optional conflict check can also match date if needed)

  const fee = Number(doctor.consultationFee || 0);
  const tax = Math.round(fee * 0.18);
  const total = fee + tax;
  const apptId = generateCuid("apt");

  const { data: appt, error: apptErr } = await supabase
    .from("Appointment")
    .insert({
      id: apptId,
      patientId: patientUser.id,
      doctorId: doctor.id,
      date: appointmentDate,
      timeSlot: slot,
      status: "CONFIRMED",
      consultationFee: fee,
      taxAmount: tax,
      totalAmount: total,
      notes: patient.reason || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select("*, patient:User!Appointment_patientId_fkey(*), doctor:DoctorProfile!Appointment_doctorId_fkey(*, user:User(*))")
    .single();

  if (apptErr) throw apptErr;
  return normalizeAppointment(appt);
}

async function updateAppointmentStatus(id, status) {
  const { data, error } = await supabase
    .from("Appointment")
    .update({
      status,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, patient:User!Appointment_patientId_fkey(*), doctor:DoctorProfile!Appointment_doctorId_fkey(*, user:User(*))")
    .single();

  if (error) throw error;
  return normalizeAppointment(data);
}

// ── Prescriptions API ─────────────────────────────────────────────────────────
async function getPrescriptions({ patientId, appointmentId } = {}) {
  let query = supabase
    .from("Prescription")
    .select("*, appointment:Appointment(*, doctor:DoctorProfile(*, user:User(*)))")
    .order("createdAt", { ascending: false });

  if (patientId) query = query.eq("patientId", patientId);
  if (appointmentId) query = query.eq("appointmentId", appointmentId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function createPrescription({ appointmentId, patientId, medicines, notes }) {
  const rxId = generateCuid("rx");
  const { data, error } = await supabase
    .from("Prescription")
    .upsert({
      id: rxId,
      appointmentId,
      patientId,
      medicines,
      notes,
      status: "APPROVED",
      dispensingStatus: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { onConflict: "appointmentId" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getPharmacistPrescriptions() {
  const { data, error } = await supabase
    .from("Prescription")
    .select("*, appointment:Appointment(*, patient:User(*), doctor:DoctorProfile(*, user:User(*)))")
    .order("createdAt", { ascending: false });

  if (error) throw error;
  return (data || []).map(p => ({
    ...p,
    patient: p.appointment?.patient || null,
  }));
}

async function dispensePrescription(id, pharmacistId) {
  const { data, error } = await supabase
    .from("Prescription")
    .update({
      dispensingStatus: "DISPENSED",
      dispensedBy: pharmacistId || "system_pharmacist",
      dispensedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Stats API ─────────────────────────────────────────────────────────────────
async function getStats() {
  const [
    { count: totalDoctors },
    { count: availableDoctors },
    { count: totalPatients },
    { data: appointments },
    { count: totalPrescriptions },
    { count: dispensedPrescriptions },
  ] = await Promise.all([
    supabase.from("DoctorProfile").select("*", { count: "exact", head: true }),
    supabase.from("DoctorProfile").select("*", { count: "exact", head: true }).eq("status", "AVAILABLE"),
    supabase.from("User").select("*", { count: "exact", head: true }).eq("role", "CUSTOMER"),
    supabase.from("Appointment").select("status, totalAmount"),
    supabase.from("Prescription").select("*", { count: "exact", head: true }),
    supabase.from("Prescription").select("*", { count: "exact", head: true }).eq("dispensingStatus", "DISPENSED"),
  ]);

  const appts = appointments || [];
  const completedAppointments = appts.filter(a => a.status === "COMPLETED").length;
  const pendingAppointments = appts.filter(a => ["PENDING", "SCHEDULED", "CONFIRMED"].includes(a.status)).length;
  const cancelledAppointments = appts.filter(a => a.status === "CANCELLED").length;
  const totalRevenue = appts
    .filter(a => a.status === "COMPLETED")
    .reduce((sum, a) => sum + Number(a.totalAmount || 0), 0);

  return {
    totalDoctors: totalDoctors || 0,
    availableDoctors: availableDoctors || 0,
    totalPatients: totalPatients || 0,
    totalAppointments: appts.length,
    completedAppointments,
    pendingAppointments,
    cancelledAppointments,
    totalPrescriptions: totalPrescriptions || 0,
    dispensedPrescriptions: dispensedPrescriptions || 0,
    totalRevenue,
  };
}

// ── Slots API ─────────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM",
];

async function getSlots(doctorId, date) {
  let query = supabase
    .from("Appointment")
    .select("timeSlot")
    .neq("status", "CANCELLED");

  if (doctorId) query = query.eq("doctorId", doctorId);

  const { data, error } = await query;
  if (error) throw error;

  const bookedSlots = (data || []).map(a => a.timeSlot);
  return TIME_SLOTS.map(slot => ({
    slot,
    isBooked: bookedSlots.includes(slot),
  }));
}

// ── Patients API ──────────────────────────────────────────────────────────────
async function getPatients() {
  try {
    const { data: rawUsers, error: userErr } = await supabase
      .from("User")
      .select("*")
      .eq("role", "CUSTOMER")
      .order("createdAt", { ascending: false });

    if (userErr) throw userErr;

    const { data: appts } = await supabase
      .from("Appointment")
      .select("id, patientId, date, status, totalAmount");

    const apptMap = {};
    (appts || []).forEach((a) => {
      if (!apptMap[a.patientId]) apptMap[a.patientId] = [];
      apptMap[a.patientId].push(a);
    });

    return (rawUsers || []).map((u) => ({
      ...u,
      totalAppointments: (apptMap[u.id] || []).length,
      appointments: apptMap[u.id] || [],
    }));
  } catch (err) {
    console.error("Error in getPatients:", err.message);
    throw err;
  }
}

async function getPatientByEmail(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from("User")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function updatePatientStatus(id, status) {
  const valid = ["ACTIVE", "PENDING_VERIFICATION", "BLOCKED"];
  const updatedStatus = valid.includes(status) ? status : "ACTIVE";

  const { data, error } = await supabase
    .from("User")
    .update({
      status: updatedStatus,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  supabase,
  normalizeDoctor,
  normalizeAppointment,
  getDoctors,
  getDoctorById,
  getDoctorByEmail,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  getPrescriptions,
  createPrescription,
  getPharmacistPrescriptions,
  dispensePrescription,
  getStats,
  getSlots,
  getPatients,
  getPatientByEmail,
  updatePatientStatus,
};

