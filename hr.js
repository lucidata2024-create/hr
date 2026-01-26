/* =========================================================
   LuciData Tech — HR Core
   Firebase Firestore ONLY
   Compatible 1:1 with provided hr.html
   Namespace: window.HR_APP
========================================================= */
(function () {
  "use strict";

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

  if (!window.firebase?.apps?.length) {
    firebase.initializeApp(firebaseConfig);
  }

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
    setTimeout(() => el.remove(), 3200);
  };

  const nowISO = () => new Date().toISOString();

  /* =========================
     LOADER CONTROL
  ========================= */
  function showApp() {
    $("#appLoader")?.remove();
    const app = $("#app");
    if (app) app.hidden = false;
  }

  /* =========================
     ROUTING (SIDEBAR)
  ========================= */
  function activateRoute(route) {
    $$(".route").forEach(r =>
      r.classList.toggle("is-active", r.dataset.routeView === route)
    );

    $$(".nav__item").forEach(n => {
      const active = n.dataset.route === route;
      n.classList.toggle("is-active", active);
      n.setAttribute("aria-current", active ? "page" : "false");
    });

    const titleMap = {
      overview: "Dashboard HR",
      employees: "Angajați",
      documents: "Dosar Digital",
      orgchart: "Organigramă",
      workflows: "Workflows",
      ai: "AI Center",
      settings: "Setări",
      portal: "Employee Portal",
    };

    $("#pageTitle").textContent = titleMap[route] || "HR";
  }

  function bindNavigation() {
    $$(".nav__item").forEach(btn => {
      btn.addEventListener("click", () => {
        activateRoute(btn.dataset.route);
      });
    });
  }

  /* =========================
     GLOBAL ACTION BINDER
     (data-open / data-close / data-nav)
  ========================= */
  function bindGlobalActions() {
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest("[data-open]");
      if (openBtn) {
        const dlg = document.getElementById(openBtn.dataset.open);
        if (dlg?.showModal) dlg.showModal();
        return;
      }

      const closeBtn = e.target.closest("[data-close]");
      if (closeBtn) {
        const dlg = document.getElementById(closeBtn.dataset.close);
        if (dlg?.close) dlg.close();
        return;
      }

      const navBtn = e.target.closest("[data-nav]");
      if (navBtn) {
        document
          .querySelector(`.nav__item[data-route="${navBtn.dataset.nav}"]`)
          ?.click();
      }
    });
  }

  /* =========================
     EMPLOYEES (FIRESTORE)
  ========================= */
  const Employees = {
    list: [],

    async load() {
      const snap = await db.collection("employees").orderBy("lastName").get();
      this.list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async save(emp) {
      emp.updatedAt = nowISO();
      if (emp.id) {
        await db.collection("employees").doc(emp.id).set(emp, { merge: true });
      } else {
        emp.createdAt = nowISO();
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
    $("#kpiEmployeesActive").textContent = active;
    $("#kpiEmployeesInactive").textContent = Employees.list.length - active;
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
     EMPLOYEE MODAL
  ========================= */
  function bindEmployeeModal() {
    const dlg = $("#modalEmployee");
    if (!dlg) return;

    $("#formEmployee").addEventListener("submit", async (e) => {
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
        notes: $("#empNotes").value.trim(),
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
     INIT
  ========================= */
  async function init() {
    bindNavigation();
    bindGlobalActions();
    bindEmployeeModal();

    await Employees.load();
    renderKPI();
    renderEmployeesTable();

    activateRoute("overview");
    showApp();

    console.info("HR Core READY — Firebase only");
  }

  document.addEventListener("DOMContentLoaded", init);

  /* =========================
     PUBLIC API
  ========================= */
  window.HR_APP = {
    reload: async () => {
      await Employees.load();
      renderKPI();
      renderEmployeesTable();
    }
  };
})();
