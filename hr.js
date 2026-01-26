/* =========================================================
   LuciData Tech — HR Core (SINGLE FILE)
   Firestore ONLY · No localStorage · No modules
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

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();

  /* =========================
     HELPERS
  ========================= */
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));
  const isoNow = () => new Date().toISOString();

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

    const titles = {
      overview: "Dashboard HR",
      employees: "Angajați",
      documents: "Dosar Digital",
      workflows: "Workflows",
      ai: "AI Center",
      settings: "Setări",
      portal: "Employee Portal",
    };

    if ($("#pageTitle")) $("#pageTitle").textContent = titles[route] || "HR";
  }

  /* =========================
     GLOBAL UI DISPATCHER
     data-open / data-close / data-nav
  ========================= */
  function bindGlobalUI() {
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
        activateRoute(navBtn.dataset.nav);
      }
    });

    $$(".nav__item").forEach(btn => {
      btn.addEventListener("click", () => {
        activateRoute(btn.dataset.route);
      });
    });
  }

  /* =========================
     FIRESTORE COLLECTIONS
  ========================= */
  const colEmployees = db.collection("employees");
  const colDocuments = db.collection("documents");
  const colRequests = db.collection("requests");

  /* =========================
     EMPLOYEES
  ========================= */
  const Employees = {
    list: [],

    async load() {
      const snap = await colEmployees.orderBy("lastName").get();
      this.list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },

    async save(emp) {
      emp.updatedAt = isoNow();
      if (emp.id) {
        await colEmployees.doc(emp.id).set(emp, { merge: true });
      } else {
        emp.createdAt = isoNow();
        await colEmployees.add(emp);
      }
    },
  };

  function renderEmployees() {
    const tb = $("#empTbody");
    if (!tb) return;
    tb.innerHTML = "";

    Employees.list.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.firstName} ${e.lastName}</td>
        <td>${e.department}</td>
        <td>${e.role}</td>
        <td>${e.emailCompany}</td>
        <td>
          <span class="badge ${e.status === "Activ" ? "badge--ok" : "badge--danger"}">
            ${e.status}
          </span>
        </td>
        <td class="col-actions">
          <button class="btn btn--ghost btn--sm" data-edit-emp="${e.id}">Edit</button>
        </td>
      `;
      tb.appendChild(tr);
    });
  }

  /* =========================
     EMPLOYEE MODAL
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
        notes: $("#empNotes").value.trim(),
      };

      await Employees.save(emp);
      await Employees.load();
      renderEmployees();
      $("#modalEmployee").close();
      toast("Angajat salvat");
    });
  }

  /* =========================
     DOCUMENTS (UPLOAD METADATA)
  ========================= */
  function bindDocumentForm() {
    $("#formDocument")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const file = $("#docFile").files[0];
      if (!file) return;

      const doc = {
        employeeId: $("#docEmployee").value,
        type: $("#docTip").value,
        fileName: file.name,
        size: file.size,
        issueDate: $("#docIssueDate").value,
        expiryDate: $("#docExpiryDate").value,
        createdAt: isoNow(),
      };

      await colDocuments.add(doc);
      $("#modalDocument").close();
      toast("Document încărcat");
    });
  }

  /* =========================
     REQUESTS (WORKFLOWS)
  ========================= */
  function bindRequestForm() {
    $("#formRequest")?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const req = {
        type: $("#reqTypeModal").value,
        requester: $("#reqRequester").value,
        department: $("#reqDepartment").value,
        status: $("#reqStatusModal").value,
        motiv: $("#reqMotiv").value.trim(),
        createdAt: isoNow(),
        timeline: [
          {
            at: isoNow(),
            action: "Creat",
            by: $("#reqRequester").value,
          },
        ],
      };

      await colRequests.add(req);
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

    await Employees.load();
    renderEmployees();

    activateRoute("overview");
    showApp();

    console.info("HR Core READY — single hr.js, Firestore only");
  }

  document.addEventListener("DOMContentLoaded", init);

  window.HR_APP = { reloadEmployees: Employees.load };
})();
