/* =========================================================
   LuciData Tech — HR Core (SINGLE FILE)
   Firestore ONLY · No localStorage · No modules
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

  function showApp() {
    $("#appLoader")?.remove();
    $("#app") && ($("#app").hidden = false);
  }

  /* =========================
     ROUTING
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
  }

  function bindGlobalUI() {
    document.addEventListener("click", async (e) => {
      const openBtn = e.target.closest("[data-open]");
      if (openBtn) {
        const dlg = document.getElementById(openBtn.dataset.open);
        if (dlg?.showModal) {
          if (dlg.id === "modalRequest") {
            await loadEmployeesIntoSelect($("#reqRequester"));
          }
          if (dlg.id === "modalDocument") {
            await loadEmployeesIntoSelect($("#docEmployee"));
          }
          dlg.showModal();
        }
        return;
      }

      const closeBtn = e.target.closest("[data-close]");
      if (closeBtn) {
        document.getElementById(closeBtn.dataset.close)?.close();
        return;
      }

      const navBtn = e.target.closest("[data-nav]");
      if (navBtn) activateRoute(navBtn.dataset.nav);
    });
  }

  /* =========================
     FIRESTORE COLLECTIONS
  ========================= */
  const colEmployees = db.collection("employees");
  const colDocuments = db.collection("documents");
  const colRequests = db.collection("requests");

  /* =========================
     EMPLOYEES CACHE
  ========================= */
  const employeeMap = {};

  async function loadEmployeeMap() {
    const snap = await colEmployees.orderBy("lastName").get();
    snap.docs.forEach(d => {
      employeeMap[d.id] = d.data();
    });
  }

  async function loadEmployeesIntoSelect(selectEl) {
    if (!selectEl) return;
    selectEl.innerHTML = "";

    if (!Object.keys(employeeMap).length) {
      await loadEmployeeMap();
    }

    Object.entries(employeeMap).forEach(([id, e]) => {
      if (e.status !== "Activ") return;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = `${e.firstName} ${e.lastName} — ${e.department}`;
      selectEl.appendChild(opt);
    });
  }

  /* =========================
     EMPLOYEES LIST
  ========================= */
  async function renderEmployees() {
    const tb = $("#empTbody");
    if (!tb) return;
    tb.innerHTML = "";

    const snap = await colEmployees.orderBy("lastName").get();

    snap.docs.forEach(d => {
      const e = d.data();
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
      `;
      tb.appendChild(tr);
    });
  }

  /* =========================
     EMPLOYEE FORM
  ========================= */
  $("#formEmployee")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = $("#empId").value || null;

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
      notes: $("#empNotes").value.trim(),
      updatedAt: isoNow()
    };

    if (id) {
      await colEmployees.doc(id).set(emp, { merge: true });
    } else {
      emp.createdAt = isoNow();
      await colEmployees.add(emp);
    }

    await loadEmployeeMap();
    await renderEmployees();
    $("#modalEmployee").close();
    toast("Angajat salvat");
  });

  /* =========================
     DOCUMENTS
  ========================= */
  $("#formDocument")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = $("#docFile").files[0];
    if (!file) return;

    await colDocuments.add({
      employeeId: $("#docEmployee").value,
      type: $("#docTip").value,
      fileName: file.name,
      size: file.size,
      issueDate: $("#docIssueDate").value,
      expiryDate: $("#docExpiryDate").value,
      createdAt: isoNow()
    });

    $("#modalDocument").close();
    toast("Document încărcat");
  });

  /* =========================
     WORKFLOWS / REQUESTS
  ========================= */
  $("#formRequest")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const requesterId = $("#reqRequester").value;

    await colRequests.add({
      type: $("#reqTypeModal").value,
      requester: requesterId,
      department: employeeMap[requesterId]?.department || "",
      status: $("#reqStatusModal").value,
      motiv: $("#reqMotiv").value.trim(),
      createdAt: isoNow(),
      timeline: [
        {
          at: isoNow(),
          action: "Creat",
          by: requesterId
        }
      ]
    });

    $("#modalRequest").close();
    toast("Cerere creată");
  });

  /* =========================
     INIT
  ========================= */
  async function init() {
    bindGlobalUI();
    await loadEmployeeMap();
    await renderEmployees();
    activateRoute("overview");
    showApp();
    console.info("HR Core READY — Firestore only");
  }

  document.addEventListener("DOMContentLoaded", init);

  window.HR_APP = {
    reloadEmployees: loadEmployeeMap
  };
})();
