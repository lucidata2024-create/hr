/* =========================================================
   LuciData Tech — HR Core
   Firebase Firestore ONLY (no localStorage)
   Namespace: window.HR_APP
========================================================= */

(function () {
  "use strict";

  /* =========================
     FIREBASE INIT (GLOBAL)
  ========================= */
  const firebaseConfig = {
    apiKey: "AIzaSyAltOFeJKk1BhjpqZYd9cb7u_GmZ0EVXVE",
    authDomain: "lucidata-hr.firebaseapp.com",
    projectId: "lucidata-hr",
    storageBucket: "lucidata-hr.firebasestorage.app",
    messagingSenderId: "13908534678",
    appId: "1:13908534678:web:c92caad4b9eb7d442be9b7",
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  /* =========================
     HELPERS
  ========================= */
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));

  const toast = (msg) => {
    const host = $("#toastHost");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  /* =========================
     LOADER CONTROL
  ========================= */
  function showApp() {
    const loader = $("#appLoader");
    const app = $("#app");
    if (loader) loader.style.display = "none";
    if (app) app.hidden = false;
  }

  /* =========================
     DATA: EMPLOYEES
  ========================= */
  const Employees = {
    list: [],

    async load() {
      const snap = await db.collection("employees").orderBy("lastName").get();
      this.list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async save(emp) {
      if (emp.id) {
        await db.collection("employees").doc(emp.id).set(emp, { merge: true });
      } else {
        await db.collection("employees").add(emp);
      }
    },

    async remove(id) {
      await db.collection("employees").doc(id).delete();
    }
  };

  /* =========================
     DASHBOARD KPI
  ========================= */
  function renderKPI() {
    $("#kpiEmployees").textContent = Employees.list.length;

    const active = Employees.list.filter(e => e.status === "Activ").length;
    const inactive = Employees.list.length - active;

    $("#kpiEmployeesActive").textContent = active;
    $("#kpiEmployeesInactive").textContent = inactive;
  }

  /* =========================
     EMPLOYEES TABLE
  ========================= */
  function renderEmployeesTable() {
    const tb = $("#empTbody");
    if (!tb) return;
    tb.innerHTML = "";

    Employees.list.forEach(emp => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${emp.firstName} ${emp.lastName}</td>
        <td>${emp.department}</td>
        <td>${emp.role}</td>
        <td>${emp.emailCompany}</td>
        <td>
          <span class="badge ${emp.status === "Activ" ? "badge--ok" : "badge--danger"}">
            ${emp.status}
          </span>
        </td>
        <td class="col-actions">
          <button class="btn btn--ghost btn--sm" data-edit="${emp.id}">Edit</button>
        </td>
      `;
      tb.appendChild(tr);
    });
  }

  /* =========================
     MODAL: EMPLOYEE
  ========================= */
  function bindEmployeeModal() {
    const dlg = $("#modalEmployee");
    if (!dlg) return;

    $("#btnQuickAddEmployee")?.addEventListener("click", () => dlg.showModal());

    $("#formEmployee").addEventListener("submit", async (e) => {
      e.preventDefault();

      const emp = {
        firstName: $("#empFirstName").value.trim(),
        lastName: $("#empLastName").value.trim(),
        emailCompany: $("#empEmailCompany").value.trim(),
        emailPersonal: $("#empEmailPersonal").value.trim(),
        phone: $("#empPhone").value.trim(),
        hireDate: $("#empHireDate").value,
        department: $("#empDepartment").value,
        role: $("#empRole").value,
        status: $("#empStatusModal").value,
        notes: $("#empNotes").value,
        updatedAt: new Date().toISOString(),
      };

      await Employees.save(emp);
      await Employees.load();
      renderKPI();
      renderEmployeesTable();
      dlg.close();
      toast("Angajat salvat");
    });
  }

  /* =========================
     ROUTING
  ========================= */
  function bindNavigation() {
    $$(".nav__item").forEach(btn => {
      btn.addEventListener("click", () => {
        const route = btn.dataset.route;
        $$(".route").forEach(r => r.classList.toggle("is-active", r.dataset.routeView === route));
        $("#pageTitle").textContent = btn.textContent.trim();
      });
    });
  }

  /* =========================
     INIT
  ========================= */
  async function init() {
    await Employees.load();
    renderKPI();
    renderEmployeesTable();
    bindEmployeeModal();
    bindNavigation();
    showApp();

    console.info("HR Core READY — Firebase only");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
