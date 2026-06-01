import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// Helper to hash passwords using built-in crypto
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.review.deleteMany();
  await prisma.psychiatristProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned existing database tables.");

  const defaultPasswordHash = hashPassword("Password123!");

  // 1. Create Admins
  await prisma.user.create({
    data: {
      email: "admin@pims.com",
      name: "Dr. Sarah Jenkins (Admin)",
      passwordHash: hashPassword("AdminPass123!"),
      role: "ADMIN",
    },
  });
  console.log("👤 Created Admin User: admin@pims.com");

  // 2. Create Patient for demo reviews/bookings
  await prisma.user.create({
    data: {
      email: "patient@demo.com",
      name: "John Doe",
      passwordHash: defaultPasswordHash,
      role: "PATIENT",
    },
  });
  console.log("👤 Created Patient User: patient@demo.com");

  // 3. Create 12 Realistic Psychiatrists
  const psychiatristsData = [
    {
      email: "dr.keller@pims.com",
      name: "Dr. Marcus Keller, MD",
      licenseType: "MD",
      licenseState: "NY",
      licenseNumber: "NY-MD-884920",
      npiNumber: "1928374650",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Manhattan Integrative Psychiatry",
      address: "120 Broadway, Suite 1400",
      city: "New York",
      state: "NY",
      zipCode: "10005",
      latitude: 40.7078,
      longitude: -74.0115,
      specialties: ["ADHD", "Anxiety", "Depression", "Bipolar Disorder"],
      treatmentModalities: ["Medication Management", "CBT", "Psychodynamic Therapy"],
      targetDemographics: ["Adults", "Seniors"],
      languages: ["English", "German"],
      bioPreview: "Dr. Keller is a board-certified psychiatrist with over 15 years of experience specializing in adult ADHD and complex mood disorders through a personalized, integrative approach.",
      bioFull: "Dr. Marcus Keller is a graduate of Columbia University College of Physicians and Surgeons. He completed his residency training at New York-Presbyterian Hospital. Dr. Keller believes in a collaborative treatment model, blending evidence-based medication management with cognitive behavioral strategies. His clinical focus includes treatment-resistant depression, adult ADHD, anxiety disorders, and peak performance consulting. He aims to help clients find functional balance and well-being.",
      headshotUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      sessionFormat: "HYBRID",
      sessionFee: 320.0,
      slidingScale: true,
      acceptedInsurances: ["Aetna", "Blue Cross Blue Shield", "UnitedHealthcare"],
      searchScore: 95,
      isSponsored: true,
    },
    {
      email: "dr.chen@pims.com",
      name: "Dr. Evelyn Chen, DO",
      licenseType: "DO",
      licenseState: "CA",
      licenseNumber: "CA-DO-394820",
      npiNumber: "1029384756",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Pacific Mind & Wellness",
      address: "8383 Wilshire Blvd, Suite 210",
      city: "Beverly Hills",
      state: "CA",
      zipCode: "90211",
      latitude: 34.0664,
      longitude: -118.3725,
      specialties: ["PTSD", "Anxiety", "Obsessive-Compulsive Disorder (OCD)", "Trauma"],
      treatmentModalities: ["EMDR", "Medication Management", "Mindfulness-Based CBT"],
      targetDemographics: ["Adolescents", "Adults"],
      languages: ["English", "Mandarin"],
      bioPreview: "Dr. Chen is a dual-board certified osteopathic psychiatrist specializing in trauma recovery, PTSD, and anxiety utilizing cutting-edge somatic and EMDR modalities.",
      bioFull: "Dr. Evelyn Chen received her Doctor of Osteopathic Medicine from Touro University California and finished her psychiatric training at UCLA. She combines standard psychiatric evaluations with osteopathic principles, recognizing the profound link between body and mind. She is a certified EMDR practitioner and specializes in assisting patients recovering from severe relational, developmental, or acute trauma. Her clinic offers both virtual and premium in-office experiences.",
      headshotUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "TELEHEALTH",
      sessionFee: 260.0,
      slidingScale: false,
      acceptedInsurances: ["Cigna", "Blue Cross Blue Shield", "Aetna"],
      searchScore: 88,
      isSponsored: false,
    },
    {
      email: "dr.rodriguez@pims.com",
      name: "Dr. Adrian Rodriguez, MD",
      licenseType: "MD",
      licenseState: "TX",
      licenseNumber: "TX-MD-449204",
      npiNumber: "1564738291",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Houston Family Neuropsychiatry",
      address: "1200 Binz St, Suite 900",
      city: "Houston",
      state: "TX",
      zipCode: "77004",
      latitude: 29.7248,
      longitude: -95.3892,
      specialties: ["Depression", "Bipolar Disorder", "Schizophrenia", "Addiction"],
      treatmentModalities: ["Medication Management", "Motivational Interviewing", "Family Systems Therapy"],
      targetDemographics: ["Adults", "Seniors"],
      languages: ["English", "Spanish"],
      bioPreview: "Dr. Rodriguez is an experienced bilingual neuropsychiatrist specializing in major depressive disorders, bipolar management, and addiction recovery in the Houston area.",
      bioFull: "Dr. Adrian Rodriguez studied medicine at Baylor College of Medicine and completed his psychiatry residency at UTHealth Houston. He is dedicated to providing evidence-based, compassionate care to individuals facing complex mental health hurdles, including treatment-resistant depression, bipolar disorder, and concurrent chemical dependency. He uses state-of-the-art diagnostic screens and works closely with therapists and primary care doctors.",
      headshotUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "IN_PERSON",
      sessionFee: 220.0,
      slidingScale: true,
      acceptedInsurances: ["Blue Cross Blue Shield", "UnitedHealthcare", "Humana", "Medicare"],
      searchScore: 92,
      isSponsored: false,
    },
    {
      email: "clara.bell@pims.com",
      name: "Clara Bell, PMHNP-BC",
      licenseType: "PMHNP",
      licenseState: "MA",
      licenseNumber: "MA-NP-739281",
      npiNumber: "1098273645",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Boston Pediatric & Adolescent Minds",
      address: "100 Boylston St, Suite 430",
      city: "Boston",
      state: "MA",
      zipCode: "02116",
      latitude: 42.3524,
      longitude: -71.0715,
      specialties: ["Child/Adolescent Psychiatry", "ADHD", "Autism Spectrum Disorder", "Anxiety"],
      treatmentModalities: ["Medication Management", "Parent-Child Interaction Therapy (PCIT)", "CBT"],
      targetDemographics: ["Children", "Adolescents"],
      languages: ["English"],
      bioPreview: "Clara Bell is a certified child & adolescent psychiatric nurse practitioner specializing in pediatric ADHD, anxiety, autism, and support for families.",
      bioFull: "Clara Bell, PMHNP-BC, received her Master of Science in Nursing from Boston College. She has over a decade of specialized pediatric experience, working with children as young as 5 years old. Clara provides careful, developmental-friendly psychiatric evaluations and medication management combined with parent coaching and CBT. She believes in treating the child within their family, educational, and social contexts to maximize positive growth.",
      headshotUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "HYBRID",
      sessionFee: 180.0,
      slidingScale: true,
      acceptedInsurances: ["Blue Cross Blue Shield", "Harvard Pilgrim", "Tufts Health Plan"],
      searchScore: 90,
      isSponsored: false,
    },
    {
      email: "dr.stone@pims.com",
      name: "Dr. Raymond Stone, MD",
      licenseType: "MD",
      licenseState: "IL",
      licenseNumber: "IL-MD-293810",
      npiNumber: "1482930491",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Michigan Avenue Psychiatry Associates",
      address: "150 N Michigan Ave, Suite 2800",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      latitude: 41.8845,
      longitude: -87.6248,
      specialties: ["Anxiety", "Insomnia/Sleep Disorders", "Depression", "Grief & Loss"],
      treatmentModalities: ["Medication Management", "CBT-I (Insomnia)", "Acceptance & Commitment Therapy (ACT)"],
      targetDemographics: ["Adults", "Seniors"],
      languages: ["English"],
      bioPreview: "Dr. Stone is a Chicago-based psychiatrist and sleep specialist focusing on depression, acute anxiety disorders, and drug-free solutions for insomnia.",
      bioFull: "Dr. Raymond Stone graduated from Northwestern University Feinberg School of Medicine and completed his sleep medicine fellowship at the University of Chicago. He brings a unique perspective, combining clinical psychopharmacology with sleep architecture optimization. He specializes in cognitive-behavioral therapy for insomnia (CBT-I), reducing dependence on sleep medications while optimizing general mental resilience.",
      headshotUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "IN_PERSON",
      sessionFee: 290.0,
      slidingScale: false,
      acceptedInsurances: ["Aetna", "Blue Cross Blue Shield", "Cigna", "Medicare"],
      searchScore: 85,
      isSponsored: false,
    },
    {
      email: "dr.vargas@pims.com",
      name: "Dr. Isabella Vargas, MD",
      licenseType: "MD",
      licenseState: "FL",
      licenseNumber: "FL-MD-662910",
      npiNumber: "1192837402",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Miami Neuro-Wellness Center",
      address: "1000 Brickell Ave, Suite 300",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      latitude: 25.7645,
      longitude: -80.1920,
      specialties: ["Depression", "Anxiety", "Bipolar Disorder", "Women's Mental Health"],
      treatmentModalities: ["Medication Management", "Psychodynamic Therapy", "Interpersonal Therapy (IPT)"],
      targetDemographics: ["Adults"],
      languages: ["English", "Spanish", "Portuguese"],
      bioPreview: "Dr. Vargas is a tri-lingual psychiatrist in Brickell, specializing in women's reproductive mental health, post-partum mood disorders, and general anxiety.",
      bioFull: "Dr. Isabella Vargas graduated from the University of Miami Miller School of Medicine and completed her psychiatric residency at Jackson Memorial Hospital. She has specific sub-specialty training in Women's Mental Health, including pre-menstrual dysphoric disorder (PMDD), pregnancy and postpartum medication consultation, and menopause-related emotional changes. She provides highly compassionate, individual-centric care in a luxury wellness space.",
      headshotUrl: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "HYBRID",
      sessionFee: 350.0,
      slidingScale: false,
      acceptedInsurances: ["Cigna", "Aetna", "UnitedHealthcare"],
      searchScore: 87,
      isSponsored: true,
    },
    {
      email: "dr.young@pims.com",
      name: "Dr. Douglas Young, MD",
      licenseType: "MD",
      licenseState: "WA",
      licenseNumber: "WA-MD-993821",
      npiNumber: "1827364509",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Seattle Neuropsychiatry & TMS",
      address: "1100 Olive Way, Suite 1050",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      latitude: 47.6138,
      longitude: -122.3302,
      specialties: ["Treatment-Resistant Depression", "PTSD", "Anxiety", "Bipolar Disorder"],
      treatmentModalities: ["Transcranial Magnetic Stimulation (TMS)", "Medication Management", "Ketamine-Assisted Psychotherapy"],
      targetDemographics: ["Adults"],
      languages: ["English"],
      bioPreview: "Dr. Young is a clinical neuropsychiatrist in Seattle, offering cutting-edge interventional options including TMS and Ketamine consultations.",
      bioFull: "Dr. Douglas Young received his medical degree from the University of Washington School of Medicine. He has pioneered local psychiatric research into non-invasive brain stimulation. In addition to traditional psychopharmacology, his clinic provides TMS therapy for treatment-resistant major depression and OCD. He offers meticulous, data-driven diagnostic evaluations to discover biological root causes of psychiatric struggles.",
      headshotUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "HYBRID",
      sessionFee: 380.0,
      slidingScale: false,
      acceptedInsurances: ["Premera Blue Cross", "Regence BlueShield", "Aetna"],
      searchScore: 94,
      isSponsored: true,
    },
    {
      email: "dr.singh@pims.com",
      name: "Dr. Raj Singh, MD",
      licenseType: "MD",
      licenseState: "NY",
      licenseNumber: "NY-MD-109283",
      npiNumber: "1394827105",
      isVerified: true,
      verificationStatus: "APPROVED",
      clinicName: "Flatiron Psychiatric Care",
      address: "20 W 22nd St, Suite 500",
      city: "New York",
      state: "NY",
      zipCode: "10010",
      latitude: 40.7415,
      longitude: -73.9902,
      specialties: ["Anxiety", "OCD", "Panic Disorders", "Depression"],
      treatmentModalities: ["CBT", "Exposure & Response Prevention (ERP)", "Medication Management"],
      targetDemographics: ["Adolescents", "Adults"],
      languages: ["English", "Hindi", "Punjabi"],
      bioPreview: "Dr. Singh is a board-certified psychiatrist in Flatiron, specializing in cognitive-behavioral therapies and exposure treatment for OCD and panic disorders.",
      bioFull: "Dr. Raj Singh completed his psychiatric residency training at the Mount Sinai Hospital in New York. He is dual-trained in clinical psychopharmacology and evidence-based psychotherapy, specializing in Exposure and Response Prevention (ERP) for Obsessive-Compulsive Disorder. Dr. Singh believes that medications are most powerful when combined with customized, actionable therapeutic frameworks.",
      headshotUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "HYBRID",
      sessionFee: 280.0,
      slidingScale: true,
      acceptedInsurances: ["Aetna", "UnitedHealthcare", "Cigna"],
      searchScore: 89,
      isSponsored: false,
    },
    // The following doctors are PENDING or REJECTED for moderation dashboard demo
    {
      email: "dr.hargrove@pims.com",
      name: "Dr. Lisa Hargrove, MD",
      licenseType: "MD",
      licenseState: "TX",
      licenseNumber: "TX-MD-883719",
      npiNumber: "1028374910",
      isVerified: false,
      verificationStatus: "PENDING",
      clinicName: "Austin Psychiatric Wellness",
      address: "701 Brazos St, Suite 500",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: 30.2691,
      longitude: -97.7402,
      specialties: ["Depression", "ADHD", "Anxiety", "Bipolar Disorder"],
      treatmentModalities: ["Medication Management", "CBT"],
      targetDemographics: ["Adults"],
      languages: ["English"],
      bioPreview: "Dr. Hargrove is a newly registering psychiatrist in Austin focusing on young adults, college mental health, and integrative ADHD management.",
      bioFull: "Dr. Lisa Hargrove is seeking credentials approval for her new practice in Austin. She has a clinical interest in supporting transition-age youth, graduate students, and professionals coping with occupational stress, ADHD, academic anxiety, and depression. She is awaiting active directory status.",
      headshotUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "TELEHEALTH",
      sessionFee: 240.0,
      slidingScale: true,
      acceptedInsurances: ["Aetna", "Blue Cross Blue Shield"],
      searchScore: 60,
      isSponsored: false,
    },
    {
      email: "dr.fletcher@pims.com",
      name: "Dr. Samuel Fletcher, DO",
      licenseType: "DO",
      licenseState: "CA",
      licenseNumber: "CA-DO-883720",
      npiNumber: "1098273644",
      isVerified: false,
      verificationStatus: "PENDING",
      clinicName: "Bay Area Neuro-Minds",
      address: "100 Pine St, Suite 1200",
      city: "San Francisco",
      state: "CA",
      zipCode: "94111",
      latitude: 37.7925,
      longitude: -122.4002,
      specialties: ["Anxiety", "Sleep Disorders", "Bipolar Disorder", "PTSD"],
      treatmentModalities: ["Medication Management", "CBT-I", "Mindfulness"],
      targetDemographics: ["Adults"],
      languages: ["English"],
      bioPreview: "Dr. Fletcher is a Bay Area psychiatric clinician focusing on corporate burnout, stress management, insomnia, and mood optimization.",
      bioFull: "Dr. Samuel Fletcher has over 8 years of clinical experience in both inpatient and outpatient settings. He is seeking directory listing approval. He utilizes osteopathic holistic values to treat chronic insomnia, severe anxiety, occupational exhaustion, and trauma.",
      headshotUrl: "https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "HYBRID",
      sessionFee: 295.0,
      slidingScale: false,
      acceptedInsurances: ["Cigna", "UnitedHealthcare"],
      searchScore: 55,
      isSponsored: false,
    },
    {
      email: "dr.kline@pims.com",
      name: "Dr. Victor Kline, MD",
      licenseType: "MD",
      licenseState: "FL",
      licenseNumber: "FL-MD-119283",
      npiNumber: "1928374011",
      isVerified: false,
      verificationStatus: "REJECTED",
      rejectionReason: "Uploaded medical license document is expired. Please upload your active 2026-2027 state board renewal certificate.",
      clinicName: "Orlando Psychiatric Consultants",
      address: "200 S Orange Ave, Suite 100",
      city: "Orlando",
      state: "FL",
      zipCode: "32801",
      latitude: 28.5383,
      longitude: -81.3792,
      specialties: ["Depression", "Anxiety"],
      treatmentModalities: ["Medication Management"],
      targetDemographics: ["Adults"],
      languages: ["English"],
      bioPreview: "Dr. Victor Kline is a clinical psychiatrist in Orlando. This profile is currently rejected due to expired license records.",
      bioFull: "Dr. Victor Kline's application has been rejected by administration due to outdated license uploads. He must upload his renewed state registration to regain active search standing.",
      headshotUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=250&auto=format&fit=crop",
      introVideoUrl: null,
      sessionFormat: "IN_PERSON",
      sessionFee: 200.0,
      slidingScale: true,
      acceptedInsurances: ["Blue Cross Blue Shield"],
      searchScore: 40,
      isSponsored: false,
    }
  ];

  for (const doc of psychiatristsData) {
    // A. Create User
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        name: doc.name.split(",")[0], // Store simple name
        passwordHash: defaultPasswordHash,
        role: "PSYCHIATRIST",
      },
    });

    // B. Create PsychiatristProfile
    const profile = await prisma.psychiatristProfile.create({
      data: {
        userId: user.id,
        licenseType: doc.licenseType,
        licenseState: doc.licenseState,
        licenseNumber: doc.licenseNumber,
        npiNumber: doc.npiNumber,
        isVerified: doc.isVerified,
        verificationStatus: doc.verificationStatus,
        rejectionReason: doc.rejectionReason,
        clinicName: doc.clinicName,
        address: doc.address,
        city: doc.city,
        state: doc.state,
        zipCode: doc.zipCode,
        latitude: doc.latitude,
        longitude: doc.longitude,
        specialties: JSON.stringify(doc.specialties),
        treatmentModalities: JSON.stringify(doc.treatmentModalities),
        targetDemographics: JSON.stringify(doc.targetDemographics),
        languages: JSON.stringify(doc.languages),
        bioPreview: doc.bioPreview,
        bioFull: doc.bioFull,
        headshotUrl: doc.headshotUrl,
        introVideoUrl: doc.introVideoUrl,
        sessionFormat: doc.sessionFormat,
        sessionFee: doc.sessionFee,
        slidingScale: doc.slidingScale,
        acceptedInsurances: JSON.stringify(doc.acceptedInsurances),
        searchScore: doc.searchScore,
        isSponsored: doc.isSponsored,
      },
    });

    console.log(`👨‍⚕️ Created Doctor: ${doc.name} (Verified: ${doc.isVerified}, Status: ${doc.verificationStatus})`);

    // C. Add Reviews to Approved Doctors
    if (doc.verificationStatus === "APPROVED") {
      const reviewTexts = [
        { patient: "Alice M.", rating: 5, comment: "Incredibly understanding and professional. The office was very welcoming and my session felt extremely collaborative." },
        { patient: "David K.", rating: 4, comment: "Very thorough diagnostic work. Helped me adjust my medication protocol with minimal side effects. Highly recommend." },
        { patient: "Samantha P.", rating: 5, comment: "I've seen multiple practitioners, but Dr. is by far the most empathetic and structured. They really helped me turn my life around." }
      ];

      for (const rev of reviewTexts) {
        await prisma.review.create({
          data: {
            psychiatristId: profile.id,
            patientName: rev.patient,
            rating: rev.rating,
            comment: rev.comment.replace("Dr.", doc.name.split(",")[0]),
            isApproved: true,
          },
        });
      }

      // D. Add Availability Slots (Next 3 Days)
      const baseDate = new Date();
      // Hour slots at 9:00, 11:00, 14:00, 16:00
      const hours = [9, 11, 14, 16];
      for (let day = 1; day <= 4; day++) {
        for (const hr of hours) {
          const startTime = new Date(baseDate);
          startTime.setDate(baseDate.getDate() + day);
          startTime.setHours(hr, 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(hr + 1);

          await prisma.availabilitySlot.create({
            data: {
              psychiatristId: profile.id,
              startTime,
              endTime,
              isBooked: false,
            },
          });
        }
      }
    }
  }

  console.log("✅ Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("🚨 Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
