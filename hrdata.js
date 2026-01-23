/* /assets/js/hr.data.js
   LuciData Tech — Core HR (Etapa 1)
   Seed / Demo Data + inițializare localStorage
   Fără backend, local-first
*/

(function () {
  const DB_KEY = "HR_DB";
  const NOTIF_KEY = "HR_NOTIFS";
  const AUDIT_KEY = "HR_AUDIT";
  const SETTINGS_KEY = "HR_SETTINGS";

  /* =========================================================
     HELPERS
  ========================================================= */
  function uuid() {
    return crypto.randomUUID();
  }

  function daysFromNow(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function daysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  function calcDocStatus(expiryDate, warnDays = 30) {
    const now = new Date();
    const exp = new Date(expiryDate);
    const diff = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Expired";
    if (diff <= warnDays) return "Warning";
    return "OK";
  }

  /* =========================================================
     EMPLOYEES (18)
     4 departamente, 3 nivele ierarhice
  ========================================================= */
  const employees = [
    /* CEO */
    {
      id: uuid(),
      firstName: "Andrei",
      lastName: "Ionescu",
      emailCompany: "andrei.ionescu@lucidata.ro",
      emailPersonal: "andrei.ionescu@gmail.com",
      phone: "+40721111222",
      department: "IT",
      role: "CEO",
      managerId: null,
      hireDate: "2019-03-01",
      status: "Activ",
      address: "Str. Aviatorilor 10, București",
      iban: "RO49AAAA1B31007593840000",
      emergencyContact: { name: "Maria Ionescu", phone: "+40730000111" },
      tags: ["executive"],
      notes: "Fondator LuciData Tech",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
     {
      id: uuid(),
      firstName: "Panaghie",
      lastName: "Valentin",
      emailCompany: "andrei.ionescu@lucidata.ro",
      emailPersonal: "andrei.ionescu@gmail.com",
      phone: "+40721111222",
      department: "IT",
      role: "CEO",
      managerId: null,
      hireDate: "2019-03-01",
      status: "Activ",
      address: "Str. Aviatorilor 10, București",
      iban: "RO49AAAA1B31007593840000",
      emergencyContact: { name: "Maria Ionescu", phone: "+40730000111" },
      tags: ["executive"],
      notes: "Fondator LuciData Tech",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const CEO_ID = employees[0].id;

  /* Managers */
  const managers = [
    ["Ioana", "Popescu", "HR", "HR Manager"],
    ["Mihai", "Dumitru", "IT", "IT Manager"],
    ["Radu", "Marin", "Sales", "Sales Manager"],
    ["Elena", "Stan", "Call Center", "Operations Manager"]
  ].map(([fn, ln, dept, role]) => ({
    id: uuid(),
    firstName: fn,
    lastName: ln,
    emailCompany: `${fn.toLowerCase()}.${ln.toLowerCase()}@lucidata.ro`,
    emailPersonal: `${fn.toLowerCase()}.${ln.toLowerCase()}@yahoo.com`,
    phone: "+40722" + Math.floor(100000 + Math.random() * 900000),
    department: dept,
    role,
    managerId: CEO_ID,
    hireDate: daysAgo(900),
    status: "Activ",
    address: "București",
    iban: "RO49AAAA1B31007593840000",
    emergencyContact: { name: "Contact Urgență", phone: "+40731111222" },
    tags: ["manager"],
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  employees.push(...managers);

  /* Team members */
  const teamMembers = [
    ["Ana", "Georgescu", "HR", "HR Specialist", managers[0].id],
    ["Vlad", "Rusu", "IT", "Backend Developer", managers[1].id],
    ["Cristian", "Petre", "IT", "Frontend Developer", managers[1].id],
    ["Alina", "Toma", "Sales", "Sales Executive", managers[2].id],
    ["Bogdan", "Ilie", "Sales", "Account Manager", managers[2].id],
    ["Irina", "Neagu", "Call Center", "Team Lead", managers[3].id],
    ["George", "Munteanu", "Call Center", "Agent", managers[3].id],
    ["Laura", "Popa", "Call Center", "Agent", managers[3].id],
    ["Daniel", "Enache", "Call Center", "Agent", managers[3].id],
    ["Sorin", "Matei", "IT", "QA Engineer", managers[1].id],
    ["Paula", "Dobre", "HR", "Recruiter", managers[0].id],
    ["Alex", "Voicu", "Sales", "Sales Intern", managers[2].id],
    ["Monica", "Lazar", "IT", "DevOps Engineer", managers[1].id]
  ].map(([fn, ln, dept, role, mid]) => ({
    id: uuid(),
    firstName: fn,
    lastName: ln,
    emailCompany: `${fn.toLowerCase()}.${ln.toLowerCase()}@lucidata.ro`,
    emailPersonal: `${fn.toLowerCase()}.${ln.toLowerCase()}@gmail.com`,
    phone: "+40723" + Math.floor(100000 + Math.random() * 900000),
    department: dept,
    role,
    managerId: mid,
    hireDate: daysAgo(300 + Math.floor(Math.random() * 400)),
    status: "Activ",
    address: "România",
    iban: "RO49AAAA1B31007593840000",
    emergencyContact: { name: "Părinte", phone: "+40739999888" },
    tags: role.includes("Agent") ? ["shift"] : [],
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  employees.push(...teamMembers);

  /* =========================================================
     DOCUMENTS (40+)
     6 expirate, 8 warning
  ========================================================= */
  const docTypes = ["CI", "Contract", "Diploma", "Certificat"];
  const documents = [];

  employees.forEach((emp, idx) => {
    for (let i = 0; i < 2; i++) {
      const expiry =
        idx % 5 === 0
          ? daysFromNow(-10 - i)       // expired
          : idx % 4 === 0
          ? daysFromNow(10 + i)        // warning
          : daysFromNow(120 + i * 30); // ok

      documents.push({
        id: uuid(),
        employeeId: emp.id,
        tip: docTypes[i % docTypes.length],
        fileName: `${docTypes[i]}_${emp.lastName}.pdf`,
        fileType: "application/pdf",
        fileSize: 120000 + Math.floor(Math.random() * 90000),
        issueDate: daysAgo(600),
        expiryDate: expiry,
        uploadedAt: new Date().toISOString(),
        ocrExtract: {},
        status: calcDocStatus(expiry)
      });
    }
  });

  /* =========================================================
     WORKFLOWS (12)
  ========================================================= */
  const workflowTypes = [
    "Concediu",
    "Schimbare date",
    "Cerere document",
    "Echipament IT"
  ];

  const workflows = Array.from({ length: 12 }).map((_, i) => {
    const requester = employees[3 + (i % 10)];
    const status = i % 4 === 0 ? "Approved" : i % 4 === 1 ? "Pending" : i % 4 === 2 ? "Rejected" : "Draft";

    return {
      id: uuid(),
      type: workflowTypes[i % workflowTypes.length],
      requesterEmployeeId: requester.id,
      payload: {
        reason: "Cerere demo generată automat",
        days: i % 3 === 0 ? 5 : undefined
      },
      status,
      approvals: [
        {
          step: "Manager",
          approverId: requester.managerId,
          decision: status === "Draft" ? null : "Approved",
          comment: "OK",
          date: daysAgo(10)
        },
        {
          step: "HR",
          approverId: managers[0].id,
          decision: status === "Rejected" ? "Rejected" : status === "Approved" ? "Approved" : null,
          comment: status === "Rejected" ? "Lipsă documente" : "Conform",
          date: daysAgo(5)
        }
      ],
      createdAt: daysAgo(15 + i),
      updatedAt: new Date().toISOString(),
      attachments: [
        {
          fileName: "cerere.pdf",
          fileType: "application/pdf",
          fileSize: 56000,
          uploadedAt: new Date().toISOString()
        }
      ]
    };
  });

  /* =========================================================
     FEEDBACK ANONIM (25)
  ========================================================= */
  const feedbackTexts = [
    "Mă simt apreciat și îmi place echipa.",
    "Salariul este cam mic pentru volumul de muncă.",
    "Programul este flexibil, ceea ce ajută mult.",
    "Sunt foarte obosit și simt burnout.",
    "Vreau să plec dacă lucrurile nu se schimbă.",
    "Managerul este ok, dar presiunea e mare.",
    "Mediu de lucru toxic uneori.",
    "Îmi place proiectul, dar stresul e ridicat.",
    "Comunicare bună în echipă.",
    "Simt că nu mai cresc profesional."
  ];

  const feedback = Array.from({ length: 25 }).map((_, i) => ({
    id: uuid(),
    employeeId: i % 3 === 0 ? null : employees[i % employees.length].id,
    department: employees[i % employees.length].department,
    text: feedbackTexts[i % feedbackTexts.length],
    createdAt: daysAgo(Math.floor(Math.random() * 40)),
    sentimentScore: 0,
    label: "Unanalyzed"
  }));

  /* =========================================================
     INIT DB
  ========================================================= */
  const seedDB = {
    meta: {
      version: "1.0",
      createdAt: new Date().toISOString()
    },
    employees,
    documents,
    workflows,
    feedback
  };

  function init() {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify(seedDB));
      localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
      localStorage.setItem(AUDIT_KEY, JSON.stringify([]));
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          warnDays: 30,
          loaderMs: 450,
          auditActor: "HR Admin"
        })
      );
      console.info("HR_DB initialized with demo data");
    }
  }

  init();
})();
