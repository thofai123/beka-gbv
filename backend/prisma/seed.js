import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEPARTMENT_HELPLINES = [
  // 1. Child Protection Tab
  {
    name: "Childline Zambia (116)",
    type: "child_protection",
    description:
      "Toll-free, 24/7 confidential counseling, guidance, and referral services for children and youth dealing with abuse, bullying, child marriage, mental health, and online safety. Available online via Childline Zambia.",
    phone: "116",
    website: "https://www.lifelinezambia.org.zm",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi", "Kaonde", "Lunda", "Luvale"],
    is_active: true,
    is_free: true,
  },

  // 2. One-Stop Centers Tab
  {
    name: "Lifeline Zambia (933)",
    type: "osc",
    description:
      "Toll-free, 24/7 counseling and support for adults regarding gender-based violence (GBV), mental health, substance abuse, and HIV/AIDS.",
    phone: "933",
    website: "https://www.lifelinezambia.org.zm",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },

  // 3. Counseling Tab
  {
    name: "Lifeline Zambia (933)",
    type: "counseling",
    description:
      "Provides free telephone, WhatsApp, and online chat counselling for adults. Trained counsellors offer support for mental health challenges, stress, depression, suicide prevention, substance abuse, grief, gender-based violence (GBV), and HIV/AIDS.",
    phone: "933",
    website: "https://www.lifelinezambia.org.zm",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },
  {
    name: "Childline Zambia (116)",
    type: "counseling",
    description:
      "Offers free, 24/7 psychosocial counselling and referrals for children, teenagers, and young people. Counsellors assist with bullying, emotional distress, abuse, online safety, and family issues.",
    phone: "116",
    website: "https://www.lifelinezambia.org.zm",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },
  {
    name: "Mental Health Users Network of Zambia",
    type: "counseling",
    description:
      "Non-profit mental health support NGO offering peer support, advocacy, and community mental wellness guidance in Zambia.",
    phone: "+260 21 123 7191",
    district: "Lusaka / National",
    province: "Lusaka",
    operating_hours: "Mon–Fri 08:00–17:00",
    languages: ["English", "Nyanja", "Bemba"],
    is_active: true,
    is_free: true,
  },

  // 4. Legal Aid Tab
  {
    name: "Legal Aid Board of Zambia — Main Office & Hotline",
    type: "legal_aid",
    description:
      "For free or subsidized legal assistance in Zambia, contact the Legal Aid Board of Zambia at +260 211 256454, via their hotline at +260 977 123456, or on WhatsApp at +260 766 881526. Operates primarily during standard business hours (Monday to Friday, 8:00 AM – 5:00 PM).",
    phone: "+260 211 256454",
    whatsapp: "+260 766 881526",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "Mon–Fri, 8:00 AM – 5:00 PM",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },
  {
    name: "Legal Aid Board of Zambia — Direct Mobile Hotline",
    type: "legal_aid",
    description:
      "Direct mobile hotline (+260 977 123456) and WhatsApp desk (+260 766 881526) for free or subsidized legal representation and case guidance.",
    phone: "+260 977 123456",
    whatsapp: "+260 766 881526",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "Mon–Fri, 8:00 AM – 5:00 PM",
    languages: ["English", "Bemba", "Nyanja"],
    is_active: true,
    is_free: true,
  },

  // 5. Shelter Tab
  {
    name: "Confidential Safe Shelter & Refuge Coordination (YWCA / Lifeline / Social Welfare)",
    type: "shelter",
    description:
      "In Zambia, access to temporary shelters and safe houses depends on the specific situation, with most confidential refuge spaces coordinated through YWCA Zambia, Lifeline/Childline (933 / 116), and the Department of Social Welfare. For security reasons, exact street addresses of domestic violence safe houses are kept confidential and shared only after intake screening.",
    phone: "933",
    district: "Confidential Locations (National)",
    province: "Lusaka",
    operating_hours: "24/7 Intake Screening (933 / 116)",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },

  // 6. Emergency Response Tab
  {
    name: "Police Emergency",
    type: "emergency_response",
    description:
      "Immediate police emergency dispatch: 991 (toll-free) or landline 0211-220006.",
    phone: "991",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free (Alt: 0211-220006)",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },
  {
    name: "General Emergency Assistance",
    type: "emergency_response",
    description:
      "National general emergency assistance: 999 (toll-free) or 0211-236644 / 0211-702664.",
    phone: "999",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free (Alt: 0211-236644 / 0211-702664)",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },
  {
    name: "Ambulance Services",
    type: "emergency_response",
    description:
      "Emergency medical ambulance dispatch: 991 (toll-free) or 0211-220180.",
    phone: "991",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free (Alt: 0211-220180)",
    languages: ["English", "Bemba", "Nyanja"],
    is_active: true,
    is_free: true,
  },
  {
    name: "Zambia Fire Brigade",
    type: "emergency_response",
    description:
      "Emergency fire and rescue services: 993 (toll-free) or 02-11220180.",
    phone: "993",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free (Alt: 02-11220180)",
    languages: ["English", "Bemba", "Nyanja"],
    is_active: true,
    is_free: true,
  },
  {
    name: "Road Transport & Safety Agency (RTSA)",
    type: "emergency_response",
    description:
      "Road traffic emergency and safety hotline: 983 (toll-free) or +260 955 983 983.",
    phone: "983",
    district: "National (All Provinces)",
    province: "Lusaka",
    operating_hours: "24/7 Toll-Free (Alt: +260 955 983 983)",
    languages: ["English", "Bemba", "Nyanja", "Tonga", "Lozi"],
    is_active: true,
    is_free: true,
  },
];

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@beka.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password_hash: await bcrypt.hash(adminPassword, 10),
      role: "admin",
      full_name: "BEKA Admin",
      created_by: adminEmail,
    },
  });

  for (const [code, role, label] of [
    ["RESPONDER-2024", "responder", "Responder onboarding code"],
    ["ADMIN-2024", "admin", "Admin onboarding code"],
  ]) {
    await prisma.accessCode.upsert({
      where: { code },
      update: {},
      create: { code, role, label, is_active: true, created_by: adminEmail },
    });
  }

  // Replace non-VSU department resources while keeping VSU Units untouched
  await prisma.resource.deleteMany({
    where: {
      type: {
        in: [
          "child_protection",
          "osc",
          "counseling",
          "legal_aid",
          "shelter",
          "emergency_response",
        ],
      },
    },
  });

  await prisma.resource.createMany({
    data: DEPARTMENT_HELPLINES.map((item) => ({
      ...item,
      created_by: adminEmail,
    })),
  });

  console.log(`Updated ${DEPARTMENT_HELPLINES.length} Zambia National Helplines (VSU tab preserved).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
