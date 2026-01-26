/* /assets/js/hr.js
   LuciData Tech — Core HR (Firebase Firestore + fallback localStorage)
   Namespace: window.HR_APP

   UI auto-bind (opțional, dacă există în hr.html):
   - #kpiEmployeesTotal
   - #kpiDepartments
   - #kpiActive
   - #tblEmployees (tbody)
   - #empSearch
   - #empDeptFilter
   - #btnEmpNew
   - #empModal (container modal) + #empModalClose
   - form fields:
       #empId, #empName, #empEmail, #empPhone, #empDepartment, #empRole, #empStatus, #empHireDate, #empNotes
     buttons:
       #btnEmpSave, #btnEmpDelete
   - #toastStack (pentru notificări)
*/

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

(function () {
  "use strict";

  /* =========================
     CONFIG
     ========================= */
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAltOFeJKk1BhjpqZYd9cb7u_GmZ0EVXVE",
    authDomain: "lucidata-hr.firebaseapp.com",
    projectId: "lucidata-hr",
    storageBucket: "lucidata-hr.firebasestorage.app",
    messagingSenderId: "13908534678",
    appId: "1:13908534678:web:c92caad4b9eb7d442be9b7",
    measurementId: "G-Q0RKKGKS8Q",
  };

  const LS_KEY = "HR_DB_v1"; // fallback

  /* =========================
     HELPERS
     ========================= */
  const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));
  const safe = (q) => document.querySelector(q);

  const uid = () => "emp-" + Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
  const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);

  function toast(msg, type = "info") {
    const host = safe("#toastStack");
    if (!host) return console.info("[HR]", msg);
    const el = document.createElement("div");
    el.className = "card";
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function normalizeEmployee(payload) {
    const p = payload || {};
    const name = (p.name || "").trim();
    return {
      id: (p.id || "").trim() || null,
      name,
      email: (p.email || "").trim(),
      phone: (p.phone || "").trim(),
      department: (p.department || "General").trim(),
      role: (p.role || "Employee").trim(),
      status: (p.status || "Active").trim(), // Active / Inactive
      hireDate: (p.hireDate || isoDate()).trim(),
      notes: (p.notes || "").trim(),
      updatedAt: p.updatedAt || null,
      createdAt: p.createdAt || null,
    };
  }

  /* =========================
     STORAGE (fallback)
     ========================= */
  const LocalStore = {
    load() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return { employees: [] };
        const db = JSON.parse(raw);
        if (!db || !Array.isArray(db.employees)) return { employees: [] };
        return db;
      } catch {
        return { employees: [] };
      }
    },
    save(db) {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    },
    ensureSeed() {
      const db = this.load();
      if (db.employees.length) return db;

      db.employees = [
        {
          id: "emp-1001",
          name: "Andrei Popescu",
          email: "andrei.popescu@company.ro",
          phone: "+40 723 000 111",
          department: "Operations",
          role: "Store Manager",
          status: "Active",
          hireDate: "2024-03-12",
          notes: "Responsabil magazin, inventar, pontaj.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "emp-1002",
          name: "Maria Ionescu",
          email: "maria.ionescu@company.ro",
          phone: "+40 722 000 222",
          department: "Sales",
          role: "Cashier",
          status: "Active",
          hireDate: "2024-07-01",
          notes: "Casier principal, închidere zilnică.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "emp-1003",
          name: "Radu Georgescu",
          email: "radu.georgescu@company.ro",
          phone: "+40 721 000 333",
          department: "Warehouse",
          role: "Stock Associate",
          status: "Inactive",
          hireDate: "2023-10-18",
          notes: "În concediu medical prelungit.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      this.save(db);
      return db;
    },
  };

  /* =========================
     FIREBASE
     ========================= */
  function initFirebase() {
    try {
      const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      return { ok: true, app, db };
    } catch (e) {
      console.warn("Firebase init failed:", e);
      return { ok: false, error: e };
    }
  }

  /* =========================
     DATA ACCESS LAYER
     ========================= */
  function makeRepo(fb) {
    const hasFirestore = !!(fb && fb.ok && fb.db);

    // Firestore collection: hr_employees
    const employeesCol = hasFirestore ? collection(fb.db, "hr_employees") : null;

    return {
      hasFirestore,

      async listEmployees() {
        if (!hasFirestore) {
          const db = LocalStore.ensureSeed();
          return db.employees.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }

        try {
          const qy = query(employeesCol, orderBy("name"));
          const snap = await getDocs(qy);
          const out = [];
          snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
          return out.map(normalizeEmployee);
        } catch (e) {
          console.warn("Firestore list failed -> fallback localStorage:", e);
          toast("Firestore indisponibil. Se folosește fallback local.", "warn");
          const db = LocalStore.ensureSeed();
          return db.employees.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        }
      },

      async getEmployee(id) {
        if (!id) return null;

        if (!hasFirestore) {
          const db = LocalStore.load();
          return db.employees.find((x) => x.id === id) || null;
        }

        try {
          const ref = doc(fb.db, "hr_employees", id);
          const snap = await getDoc(ref);
          if (!snap.exists()) return null;
          return normalizeEmployee({ id: snap.id, ...snap.data() });
        } catch (e) {
          console.warn("Firestore get failed:", e);
          const db = LocalStore.load();
          return db.employees.find((x) => x.id === id) || null;
        }
      },

      async upsertEmployee(payload) {
        const emp = normalizeEmployee(payload);
        if (!emp.name) throw new Error("Numele este obligatoriu.");

        if (!hasFirestore) {
          const db = LocalStore.load();
          const now = new Date().toISOString();
          if (!emp.id) emp.id = uid();

          const idx = db.employees.findIndex((x) => x.id === emp.id);
          const item = {
            ...emp,
            createdAt: idx >= 0 ? db.employees[idx].createdAt : now,
            updatedAt: now,
          };
          if (idx >= 0) db.employees[idx] = item;
          else db.employees.push(item);

          LocalStore.save(db);
          return item;
        }

        // Firestore
        try {
          const nowServer = serverTimestamp();

          if (emp.id) {
            const ref = doc(fb.db, "hr_employees", emp.id);
            await setDoc(
              ref,
              {
                ...emp,
                updatedAt: nowServer,
                createdAt: emp.createdAt || nowServer,
              },
              { merge: true }
            );
            return emp;
          } else {
            const created = await addDoc(employeesCol, {
              ...emp,
              createdAt: nowServer,
              updatedAt: nowServer,
            });
            return { ...emp, id: created.id };
          }
        } catch (e) {
          console.warn("Firestore upsert failed -> fallback localStorage:", e);
          toast("Nu s-a putut salva în Firestore. S-a salvat local.", "warn");
          // fallback local
          const db = LocalStore.load();
          const now = new Date().toISOString();
          const local = { ...emp, id: emp.id || uid(), updatedAt: now, createdAt: emp.createdAt || now };
          const idx = db.employees.findIndex((x) => x.id === local.id);
          if (idx >= 0) db.employees[idx] = local;
          else db.employees.push(local);
          LocalStore.save(db);
          return local;
        }
      },

      async deleteEmployee(id) {
        if (!id) return;

        if (!hasFirestore) {
          const db = LocalStore.load();
          db.employees = db.employees.filter((x) => x.id !== id);
          LocalStore.save(db);
          return;
        }

        try {
          await deleteDoc(doc(fb.db, "hr_employees", id));
        } catch (e) {
          console.warn("Firestore delete failed -> fallback localStorage:", e);
          const db = LocalStore.load();
          db.employees = db.employees.filter((x) => x.id !== id);
          LocalStore.save(db);
        }
      },
    };
  }

  /* =========================
     UI LAYER (optional auto-bind)
     ========================= */
  const UI = {
    state: {
      employees: [],
      filtered: [],
      selectedId: null,
    },

    computeKPIs(list) {
      const total = list.length;
      const active = list.filter((e) => (e.status || "").toLowerCase() === "active").length;
      const depts = new Set(list.map((e) => e.department || "General")).size;
      safe("#kpiEmployeesTotal") && (safe("#kpiEmployeesTotal").textContent = total);
      safe("#kpiActive") && (safe("#kpiActive").textContent = active);
      safe("#kpiDepartments") && (safe("#kpiDepartments").textContent = depts);
    },

    renderDeptFilter(list) {
      const sel = safe("#empDeptFilter");
      if (!sel) return;
      const cur = sel.value || "";
      const depts = ["", ...Array.from(new Set(list.map((e) => e.department || "General"))).sort()];
      sel.innerHTML = depts
        .map((d) => `<option value="${d}">${d ? d : "Toate departamentele"}</option>`)
        .join("");
      if (depts.includes(cur)) sel.value = cur;
    },

    renderTable(list) {
      const tb = safe("#tblEmployees");
      if (!tb) return;
      tb.innerHTML = "";

      list.forEach((e) => {
        const tr = document.createElement("tr");
        tr.dataset.id = e.id;
        tr.innerHTML = `
          <td><strong>${escapeHtml(e.name || "")}</strong><div class="muted">${escapeHtml(e.email || "-")}</div></td>
          <td>${escapeHtml(e.department || "-")}</td>
          <td>${escapeHtml(e.role || "-")}</td>
          <td><span class="badge ${badgeClass(e.status)}">${escapeHtml(e.status || "-")}</span></td>
          <td>${escapeHtml(e.hireDate || "-")}</td>
          <td class="right">
            <button class="btn btn-ghost btn-xs" data-action="edit">Edit</button>
          </td>
        `;
        tb.appendChild(tr);
      });
    },

    applyFilters() {
      const q = (safe("#empSearch")?.value || "").trim().toLowerCase();
      const dept = (safe("#empDeptFilter")?.value || "").trim();

      let list = this.state.employees.slice();
      if (dept) list = list.filter((e) => (e.department || "") === dept);
      if (q) {
        list = list.filter((e) => {
          const blob = `${e.name || ""} ${e.email || ""} ${e.phone || ""} ${e.role || ""}`.toLowerCase();
          return blob.includes(q);
        });
      }
      this.state.filtered = list;
      this.renderTable(list);
      this.computeKPIs(this.state.employees);
    },

    openModal(emp) {
      const modal = safe("#empModal");
      if (!modal) return;

      modal.classList.remove("hidden");

      safe("#empId") && (safe("#empId").value = emp?.id || "");
      safe("#empName") && (safe("#empName").value = emp?.name || "");
      safe("#empEmail") && (safe("#empEmail").value = emp?.email || "");
      safe("#empPhone") && (safe("#empPhone").value = emp?.phone || "");
      safe("#empDepartment") && (safe("#empDepartment").value = emp?.department || "General");
      safe("#empRole") && (safe("#empRole").value = emp?.role || "Employee");
      safe("#empStatus") && (safe("#empStatus").value = emp?.status || "Active");
      safe("#empHireDate") && (safe("#empHireDate").value = emp?.hireDate || isoDate());
      safe("#empNotes") && (safe("#empNotes").value = emp?.notes || "");

      const delBtn = safe("#btnEmpDelete");
      if (delBtn) delBtn.disabled = !emp?.id;
    },

    closeModal() {
      safe("#empModal")?.classList.add("hidden");
    },

    readForm() {
      return normalizeEmployee({
        id: safe("#empId")?.value || "",
        name: safe("#empName")?.value || "",
        email: safe("#empEmail")?.value || "",
        phone: safe("#empPhone")?.value || "",
        department: safe("#empDepartment")?.value || "General",
        role: safe("#empRole")?.value || "Employee",
        status: safe("#empStatus")?.value || "Active",
        hireDate: safe("#empHireDate")?.value || isoDate(),
        notes: safe("#empNotes")?.value || "",
      });
    },
  };

  function badgeClass(status) {
    const s = (status || "").toLowerCase();
    if (s === "active") return "badge-soft";
    if (s === "inactive") return "badge-warn";
    return "badge-soft";
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* =========================
     APP (public API)
     ========================= */
  const fb = initFirebase();
  const repo = makeRepo(fb);

  const HR_APP = {
    fb,
    repo,
    ui: UI,

    async refresh() {
      UI.state.employees = await repo.listEmployees();
      UI.renderDeptFilter(UI.state.employees);
      UI.applyFilters();
      return UI.state.employees;
    },

    async createNew() {
      UI.openModal({
        id: "",
        name: "",
        email: "",
        phone: "",
        department: "General",
        role: "Employee",
        status: "Active",
        hireDate: isoDate(),
        notes: "",
      });
    },

    async editById(id) {
      const emp = await repo.getEmployee(id);
      UI.openModal(emp || null);
    },

    async saveFromModal() {
      const payload = UI.readForm();
      const saved = await repo.upsertEmployee(payload);
      toast("Angajat salvat.");
      UI.closeModal();
      await this.refresh();
      return saved;
    },

    async deleteFromModal() {
      const id = safe("#empId")?.value || "";
      if (!id) return;
      await repo.deleteEmployee(id);
      toast("Angajat șters.");
      UI.closeModal();
      await this.refresh();
    },
  };

  window.HR_APP = HR_APP;

  /* =========================
     AUTO BIND UI (safe)
     ========================= */
  async function bindUI() {
    // Search + filter
    safe("#empSearch")?.addEventListener("input", () => UI.applyFilters());
    safe("#empDeptFilter")?.addEventListener("change", () => UI.applyFilters());

    // New
    safe("#btnEmpNew")?.addEventListener("click", () => HR_APP.createNew());

    // Table edit click
    safe("#tblEmployees")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action='edit']");
      if (!btn) return;
      const tr = e.target.closest("tr");
      const id = tr?.dataset?.id;
      if (id) HR_APP.editById(id);
    });

    // Modal controls
    safe("#empModalClose")?.addEventListener("click", () => UI.closeModal());
    safe("#btnEmpSave")?.addEventListener("click", async () => {
      try {
        await HR_APP.saveFromModal();
      } catch (err) {
        toast(err?.message || "Eroare la salvare.", "err");
      }
    });

    safe("#btnEmpDelete")?.addEventListener("click", async () => {
      try {
        await HR_APP.deleteFromModal();
      } catch (err) {
        toast(err?.message || "Eroare la ștergere.", "err");
      }
    });

    // ESC close modal
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") UI.closeModal();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await bindUI();
    await HR_APP.refresh();

    // indicator clar în consolă
    console.info("HR_APP ready. Firestore:", HR_APP.repo.hasFirestore ? "ON" : "OFF (fallback localStorage)");
  });
})();
