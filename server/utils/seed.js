/**
 * utils/seed.js
 * Populates the database with pre-verified demo accounts so you can log in
 * immediately without going through email verification.
 *
 * Run with:  npm run seed
 *
 * ⚠  This WIPES all existing users/profiles first, then recreates them.
 *    Only run it on a database you're happy to reset.
 *
 * Demo logins (password for everyone: Password123)
 *   Admin:   admin@demo.com
 *   Patient: patient@demo.com
 *   Doctors: see the list below (sara@demo.com, etc.)
 *
 * To add your own doctors: copy one object in the `doctors` array, change the
 * details, and make sure `specialization` is one of the allowed values in
 * models/DoctorProfile.js. Then re-run `npm run seed`.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');

const PASSWORD = 'Password123';

const doctors = [
  {
    name: 'Dr. Sara Khan', email: 'sara@demo.com', city: 'Islamabad', phone: '+92 300 1112222',
    profile: { specialization: 'Cardiologist', qualifications: 'MBBS, FCPS (Cardiology)',
      hospital: 'Shifa International', experienceYears: 12, fee: 3000,
      about: 'Consultant cardiologist focused on preventive heart care.' },
  },
  {
    name: 'Dr. Ahmed Raza', email: 'ahmed@demo.com', city: 'Lahore', phone: '+92 301 3334444',
    profile: { specialization: 'Dermatologist', qualifications: 'MBBS, MD (Dermatology)',
      hospital: 'Hameed Latif Hospital', experienceYears: 8, fee: 2000,
      about: 'Skin, hair, and laser treatments for all ages.' },
  },
  {
    name: 'Dr. Hina Malik', email: 'hina@demo.com', city: 'Karachi', phone: '+92 302 5556666',
    profile: { specialization: 'Pediatrician', qualifications: 'MBBS, FCPS (Pediatrics)',
      hospital: 'Aga Khan University Hospital', experienceYears: 15, fee: 2500,
      about: 'Caring for newborns, children, and adolescents.' },
  },
  {
    name: 'Dr. Bilal Ahmed', email: 'bilal@demo.com', city: 'Multan', phone: '+92 303 7778888',
    profile: { specialization: 'Neurologist', qualifications: 'MBBS, FCPS (Neurology)',
      hospital: 'Nishtar Hospital', experienceYears: 10, fee: 2800,
      about: 'Treats headaches, epilepsy, and nerve disorders.' },
  },
  {
    name: 'Dr. Ayesha Siddiqui', email: 'ayesha@demo.com', city: 'Lahore', phone: '+92 304 9990000',
    profile: { specialization: 'Gynecologist', qualifications: 'MBBS, FCPS (Gynae)',
      hospital: 'Services Hospital', experienceYears: 14, fee: 2200,
      about: "Women's health, pregnancy care, and routine check-ups." },
  },
  {
    name: 'Dr. Usman Tariq', email: 'usman@demo.com', city: 'Rawalpindi', phone: '+92 305 1212121',
    profile: { specialization: 'Orthopedic Surgeon', qualifications: 'MBBS, FCPS (Ortho)',
      hospital: 'Benazir Bhutto Hospital', experienceYears: 9, fee: 2600,
      about: 'Bone, joint, and sports injury treatment.' },
  },
  {
    name: 'Dr. Fatima Noor', email: 'fatima@demo.com', city: 'Islamabad', phone: '+92 306 3434343',
    profile: { specialization: 'Psychiatrist', qualifications: 'MBBS, MCPS (Psychiatry)',
      hospital: 'PIMS', experienceYears: 7, fee: 3500,
      about: 'Anxiety, depression, and stress management.' },
  },
  {
    name: 'Dr. Imran Shah', email: 'imran@demo.com', city: 'Karachi', phone: '+92 307 5656565',
    profile: { specialization: 'General Physician', qualifications: 'MBBS',
      hospital: 'Liaquat National Hospital', experienceYears: 6, fee: 1500,
      about: 'Everyday illnesses, fever, and general consultations.' },
  },
  {
    name: 'Dr. Zainab Ali', email: 'zainab@demo.com', city: 'Faisalabad', phone: '+92 308 7878787',
    profile: { specialization: 'Dentist', qualifications: 'BDS',
      hospital: 'Allied Hospital', experienceYears: 5, fee: 1800,
      about: 'Dental check-ups, fillings, and cleaning.' },
  },
  {
    name: 'Dr. Kamran Yousaf', email: 'kamran@demo.com', city: 'Peshawar', phone: '+92 309 9898989',
    profile: { specialization: 'Gastroenterologist', qualifications: 'MBBS, FCPS (Gastro)',
      hospital: 'Lady Reading Hospital', experienceYears: 11, fee: 3000,
      about: 'Stomach, liver, and digestive system care.' },
  },
];

async function run() {
  await connectDB();

  await Promise.all([User.deleteMany({}), DoctorProfile.deleteMany({})]);
  console.log('• Cleared users and doctor profiles');

  const patient = new User({
    name: 'Ali Patient', email: 'patient@demo.com', password: PASSWORD,
    role: 'patient', city: 'Rawalpindi', phone: '+92 305 7778888', isVerified: true,
  });
  await patient.save();
  console.log('• Created patient: patient@demo.com');

  const admin = new User({
    name: 'Site Admin', email: 'admin@demo.com', password: PASSWORD,
    role: 'admin', city: 'Islamabad', isVerified: true,
  });
  await admin.save();
  console.log('• Created admin:   admin@demo.com');

  for (const d of doctors) {
    const user = new User({
      name: d.name, email: d.email, password: PASSWORD, role: 'doctor',
      city: d.city, phone: d.phone, isVerified: true,
    });
    await user.save();
    await DoctorProfile.create({ user: user._id, acceptingPatients: true, ...d.profile });
    console.log(`• Created doctor: ${d.email}`);
  }

  console.log(`\n✔  Done. ${doctors.length} doctors + 1 patient + 1 admin created.`);
  console.log(`   All accounts use the password: ${PASSWORD}\n`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});