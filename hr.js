/* =========================================================
   LuciData Tech — HR Core
   SINGLE FILE · ES MODULE · FIRESTORE ONLY
   FINAL, STABLE VERSION
========================================================= */

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy
} from
  "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

/* =========================
   FIREBASE INIT
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyAltOFeJKk1BhjpqZYd9cb7u_GmZ0EVXVE",
  authDomain: "lucidata-hr.firebaseapp.com",
  projectId: "lucidata-hr",
  storageBucket: "lucidata-hr.firebasestorage.app",
  messagingSenderId: "13908534678",
  appId: "1:13908534678:web:c92caad4b9eb7d442be9b7",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   HELPERS
========================= */
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const nowISO = () => new Date().toISOString();

function toast(msg) {
  const host = $("#toastHost");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

/* =========================
   LOADER
========================= */
function showApp() {
  $("#appLoader")?.remove();
  $("#app").hidden = false;
}

/* =========================
   ROUTING + SIDEBAR
========================= */
function activateRoute(route) {
  $$(".route").forEach(r => {
    r.classList.toggle("is-active", r.dataset.routeView === route);
  });

  $$(".nav__item").forEach(n => {
    const active = n.dataset.route === route;
    n.classList.toggle("is-active", active);
    n.setAttribute("aria-current", active ? "page" : "false");
  });
}

/* =========================
   GLOBAL UI DISPATCHER
========================= */
function bindGlobalUI() {
  document.addEventListener("click", (e) => {

    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
      const dlg = document.getElementById(openBtn.dataset.open);
      dlg?.showModal();
      return;
    }

    const closeBtn = e.target.closest("[data-close]");
    if (closeBtn) {
      const dlg = document.getElementById(closeBtn.dataset.close);
      dlg?.close();
      return;
    }

    const navBtn = e.target.closest("[data-nav]");
    if (navBtn) {
      activateRoute(navBtn.dataset.nav);
      return;
    }

    const sideBtn = e.target.closest(".nav__item");
    if (sideBtn) {
      activateRoute(sideBtn.dataset.route);
    }
  });
}

/* =========================
   FIRESTORE COLLECTIONS
========================= */
const colEmployees = collection(db, "employees");
const colDocuments = collection(db, "documents");
const colRequests  = collection(db, "requests");

/* =========================
   CACHE (SINGLE SOURCE)
========================= */
const HR_CACHE = {
  employees: []
};

/* =========================
   EMPLOYEES
========================= */
async function loadEmployees() {
  const q = query(colEmployees, orderBy("lastName"));
  const snap = await getDocs(q);
  HR_CACHE.employees = snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}

async function saveEmployee(emp) {
  emp.updatedAt = nowISO();

  if (emp.id) {
    await updateDoc(doc(db, "employees", emp.id), emp);
  } else {
    emp.createdAt = nowISO();
    await addDoc(colEmployees, emp);
  }
}

/* =========================
   EMPLOYEE SELECTS (GLOBAL)
========================= */
function fillEmployeeSelect(id) {
  const sel = document.getElementById(id);
  if (!sel) return;

  sel.innerHTML = `<option value="">Selectează…</option>`;

  HR_CACHE.employees
    .filter(e => e.status === "Activ")
    .forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.id;
      opt.textContent = `${e.firstName} ${e.lastName}`;
      sel.appendChild(opt);
    });
}

function refreshEmployeeBindings() {
  fillEmployeeSelect("docEmployee");
  fillEmployeeSelect("reqRequester");
  fillEmployeeSelect("portalEmployee");
  fillEmployeeSelect("empManager");
}

/* =========================
   EMPLOYEE FORM
========================= */
function bindEmployeeForm() {
  $("#formEmployee")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emp = {
      id: $("#empId").value || null,
      firstName: $("#empFirstName").value.trim(),
      lastName: $("#empLastName").value.trim(),
      emailCompany: $("#empEmailCompany").value.trim(),
      emailPersonal: $("#empEmailPersonal").value.trim(),
      phone: $("#empPhone").value.trim(),
      hireDate: $("#empHireDate").value,
      department: $("#empDepartment").value,
      role: $("#empRole").value,
      status: $("#empStatusModal").value,
    };

    await saveEmployee(emp);
    await loadEmployees();
    refreshEmployeeBindings();

    $("#modalEmployee").close();
    toast("Angajat salvat");
  });
}

/* =========================
   DOCUMENT UPLOAD
========================= */
function bindDocumentForm() {
  $("#formDocument")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = $("#docFile").files[0];
    if (!file) return;

    await addDoc(colDocuments, {
      employeeId: $("#docEmployee").value,
      type: $("#docTip").value,
      fileName: file.name,
      size: file.size,
      issueDate: $("#docIssueDate").value,
      expiryDate: $("#docExpiryDate").value,
      createdAt: nowISO(),
    });

    $("#modalDocument").close();
    toast("Document încărcat");
  });
}

/* =========================
   WORKFLOWS / REQUESTS
========================= */
function bindRequestForm() {
  $("#formRequest")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    await addDoc(colRequests, {
      type: $("#reqTypeModal").value,
      requesterId: $("#reqRequester").value,
      department: $("#reqDepartment").value,
      status: $("#reqStatusModal").value,
      motiv: $("#reqMotiv").value.trim(),
      createdAt: nowISO(),
    });

    $("#modalRequest").close();
    toast("Cerere creată");
  });
}

/* =========================
   INIT
========================= */
async function init() {
  bindGlobalUI();
  bindEmployeeForm();
  bindDocumentForm();
  bindRequestForm();

  await loadEmployees();
  refreshEmployeeBindings();

  activateRoute("overview");
  showApp();

  console.info("HR Core READY — FINAL, STABLE");
}

document.addEventListener("DOMContentLoaded", init);

/* =========================
   PUBLIC API
========================= */
window.HR_APP = {
  reloadEmployees: async () => {
    await loadEmployees();
    refreshEmployeeBindings();
  }
};
