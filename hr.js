// /assets/js/hr.js
import {
  db,
  collection, doc,
  getDocs, getDoc,
  addDoc, updateDoc, deleteDoc,
  setDoc
} from "./hr.firebase.js";

/* =========================
   STATE
========================= */
const APP = {
  state: {
    employees: [],
    documents: [],
    workflows: [],
    settings: {}
  }
};

/* =========================
   HELPERS
========================= */
const $ = (q) => document.querySelector(q);
const nowISO = () => new Date().toISOString();

/* =========================
   FIRESTORE LOADERS
========================= */
async function loadCollection(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadAll() {
  const [employees, documents, workflows] = await Promise.all([
    loadCollection("employees"),
    loadCollection("documents"),
    loadCollection("workflows")
  ]);

  APP.state.employees = employees;
  APP.state.documents = documents;
  APP.state.workflows = workflows;
}

/* =========================
   EMPLOYEES
========================= */
async function saveEmployee(e) {
  if (e.id) {
    await updateDoc(doc(db, "employees", e.id), e);
  } else {
    await addDoc(collection(db, "employees"), {
      ...e,
      createdAt: nowISO()
    });
  }
}

async function deleteEmployee(id) {
  await deleteDoc(doc(db, "employees", id));
}

/* =========================
   DOCUMENTS (metadata)
========================= */
async function saveDocument(d) {
  await addDoc(collection(db, "documents"), {
    ...d,
    createdAt: nowISO()
  });
}

/* =========================
   WORKFLOWS
========================= */
async function saveWorkflow(w) {
  await addDoc(collection(db, "workflows"), {
    ...w,
    createdAt: nowISO(),
    status: "Pending"
  });
}

/* =========================
   UI RENDER
========================= */
function renderEmployees() {
  const tbody = $("#empTbody");
  if (!tbody) return;

  tbody.innerHTML = APP.state.employees.map(e => `
    <tr>
      <td>${e.firstName} ${e.lastName}</td>
      <td>${e.department}</td>
      <td>${e.role}</td>
      <td>${e.emailCompany}</td>
      <td>
        <button data-edit="${e.id}">Edit</button>
        <button data-del="${e.id}">Delete</button>
      </td>
    </tr>
  `).join("");
}

function renderDocuments() {
  const tbody = $("#docTbody");
  if (!tbody) return;

  tbody.innerHTML = APP.state.documents.map(d => `
    <tr>
      <td>${d.employeeName}</td>
      <td>${d.type}</td>
      <td>${d.expiryDate}</td>
    </tr>
  `).join("");
}

function renderWorkflows() {
  const tbody = $("#reqTbody");
  if (!tbody) return;

  tbody.innerHTML = APP.state.workflows.map(w => `
    <tr>
      <td>${w.type}</td>
      <td>${w.employeeName}</td>
      <td>${w.status}</td>
    </tr>
  `).join("");
}

/* =========================
   EVENTS
========================= */
function wireEvents() {

  // Employee save
  $("#formEmployee")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emp = {
      firstName: $("#empFirstName").value,
      lastName: $("#empLastName").value,
      department: $("#empDepartment").value,
      role: $("#empRole").value,
      emailCompany: $("#empEmailCompany").value
    };

    await saveEmployee(emp);
    await boot();
  });

  // Employee edit / delete
  document.body.addEventListener("click", async (e) => {
    if (e.target.dataset.del) {
      await deleteEmployee(e.target.dataset.del);
      await boot();
    }
  });

  // Document save
  $("#formDocument")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    await saveDocument({
      employeeName: $("#docEmployeeName").value,
      type: $("#docType").value,
      expiryDate: $("#docExpiryDate").value
    });

    await boot();
  });

  // Workflow save
  $("#formRequest")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    await saveWorkflow({
      type: $("#reqType").value,
      employeeName: $("#reqEmployee").value
    });

    await boot();
  });
}

/* =========================
   BOOT
========================= */
async function boot() {
  await loadAll();
  renderEmployees();
  renderDocuments();
  renderWorkflows();
}

document.addEventListener("DOMContentLoaded", async () => {
  wireEvents();
  await boot();
});
