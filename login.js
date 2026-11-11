const $ = id => document.getElementById(id);

const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch (e) {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  }
};

const isMobile = v => /^01[3-9]\d{8}$/.test(v);
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const valid = v => isMobile(v) || isEmail(v);
const isCid = v => /^[A-Z0-9][A-Z0-9-]{4,15}$/.test(v);

let mode = "contact";

/* theme */
const curTheme=()=>document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
function themeIcon(){$("themeBtn").querySelector("i").className=curTheme()==="dark"?"fa-solid fa-sun":"fa-solid fa-moon"}
(function(){const s=store.get("regTheme");if(s)document.documentElement.setAttribute("data-theme",s)})();
$("themeBtn").onclick=()=>{
  const n=curTheme()==="dark"?"light":"dark";
  document.documentElement.setAttribute("data-theme",n);store.set("regTheme",n);themeIcon();
};
themeIcon();

/* views */
function show(v) {
  $("login").style.display = v === "login" ? "block" : "none";
  $("reset").style.display = v === "reset" ? "block" : "none";

  if (v === "reset" && !$("rid").value) $("rid").value = $("id").value;

  (v === "reset" ? $("rid") : $("id")).focus();
}

$("toForgot").onclick = e => {
  e.preventDefault();
  show("reset");
};

$("toLogin").onclick = e => {
  e.preventDefault();
  show("login");
};

/* helpers */
const errOf = el => (el.closest(".pw") || el).parentElement.querySelector(".err");

function setErr(el, msg) {
  el.classList.toggle("bad", !!msg);
  errOf(el).textContent = msg || "";
}

function say(box, msg, ok) {
  box.textContent = msg;
  box.classList.add("show");
  box.classList.toggle("okk", !!ok);
}

function shake() {
  $("card").classList.remove("shake");
  void $("card").offsetWidth;
  $("card").classList.add("shake");
}

/* remember me */
function setMode(m, keep) {
  mode = m;

  document.querySelectorAll(".tab").forEach(b => {
    const on = b.dataset.mode === m;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on);
  });

  const c = m === "cid";
  const i = $("id");

  $("idLabel").firstChild.textContent = c ? "Candidate ID " : "Mobile / Email ";
  i.placeholder = c ? "যেমন: CAND-123456" : "01XXXXXXXXX বা email@example.com";
  i.autocomplete = "username";
  i.autocapitalize = c ? "characters" : "off";
  $("idHint").hidden = !c;

  if (!keep) i.value = "";
  setErr(i, "");
}

document.querySelectorAll(".tab").forEach(b => {
  b.addEventListener("click", () => {
    setMode(b.dataset.mode);
    $("id").focus();
  });
});

const saved = store.get("loginId");
if (saved) {
  setMode(store.get("loginMode") === "cid" ? "cid" : "contact", true);
  $("id").value = saved;
  $("rem").checked = true;
}

/* mobile: digits only when it looks like a number */
$("id").addEventListener("input", e => {
  const v = e.target.value;

  if (mode === "cid") {
    e.target.value = v.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 16);
  } else if (/^\d/.test(v) && !/@/.test(v)) {
    e.target.value = v.replace(/\D/g, "").slice(0, 11);
  }

  setErr(e.target, "");
});

$("pw").addEventListener("input", e => setErr(e.target, ""));
$("rid").addEventListener("input", e => setErr(e.target, ""));

/* show/hide + caps lock */
$("eye").onclick = () => {
  const i = $("pw");
  i.type = i.type === "password" ? "text" : "password";
$("eye").querySelector("i").className=i.type==="password"?"fa-solid fa-eye":"fa-solid fa-eye-slash"
};

$("pw").addEventListener("keyup", e => {
  $("caps").hidden = !(e.getModifierState && e.getModifierState("CapsLock"));
});

$("pw").addEventListener("blur", () => $("caps").hidden = true);

/* login submit (demo: replace fake call with your API) */
let tries = 0, lockUntil = 0;

$("f").addEventListener("submit", async ev => {
  ev.preventDefault();
  $("alert").classList.remove("show");

  if (Date.now() < lockUntil) {
    say(
      $("alert"),
      "অনেকবার ভুল হয়েছে। " + Math.ceil((lockUntil - Date.now()) / 1000) + " সেকেন্ড পরে চেষ্টা করুন।"
    );
    return shake();
  }

  const id = $("id").value.trim();
  const pw = $("pw").value;
  let ok = true;

  if (mode === "cid") {
    if (!isCid(id)) {
      setErr($("id"), "সঠিক ক্যান্ডিডেট আইডি দিন (৫–১৬ অক্ষর, ইংরেজি বড় হাতের অক্ষর/সংখ্যা/হাইফেন)।");
      ok = false;
    }
  } else if (!valid(id)) {
    setErr($("id"), "সঠিক মোবাইল নম্বর বা ইমেইল দিন।");
    ok = false;
  }

  if (pw.length < 1) {
    setErr($("pw"), "পাসওয়ার্ড লিখুন।");
    ok = false;
  }

  if (!ok) {
    shake();
    (document.querySelector(".bad") || { focus() {} }).focus();
    return;
  }

  $("go").disabled = true;
  $("go").textContent = "অপেক্ষা করুন…";

  await new Promise(r => setTimeout(r, 900)); // fake network delay
  const success = pw === "Demo1234"; // demo only: use password Demo1234

  $("go").disabled = false;
  $("go").textContent = "Log in";

  if (success) {
    if ($("rem").checked) {
      store.set("loginId", id);
      store.set("loginMode", mode);
    } else {
      store.del("loginId");
      store.del("loginMode");
    }

    tries = 0;
    say($("alert"), "লগইন সফল হয়েছে! আপনাকে ড্যাশবোর্ডে নেওয়া হচ্ছে…", true);
  } else {
    tries++;
    shake();

    if (tries >= 5) {
      lockUntil = Date.now() + 30000;
      tries = 0;
      say($("alert"), "৫ বার ভুল হয়েছে। ৩০ সেকেন্ড অপেক্ষা করুন।");
    } else {
      say($("alert"), "নম্বর/ইমেইল বা পাসওয়ার্ড ভুল। বাকি চেষ্টা: " + (5 - tries));
    }
  }
});

/* reset submit */
let cool = 0;

$("rf").addEventListener("submit", ev => {
  ev.preventDefault();
  const v = $("rid").value.trim();

  if (!valid(v)) {
    setErr($("rid"), "সঠিক মোবাইল নম্বর বা ইমেইল দিন।");
    return shake();
  }

  say(
    $("ralert"),
    "রিসেট কোড পাঠানো হয়েছে " + (isEmail(v) ? "ইমেইলে" : "মোবাইলে") + "। ৬০ সেকেন্ড পরে আবার চেষ্টা করতে পারবেন।",
    true
  );

  $("rgo").disabled = true;
  cool = 60;

  const t = setInterval(() => {
    cool--;
    $("rgo").textContent = cool > 0 ? "আবার পাঠান (" + cool + "s)" : "Send reset code";
    if (cool <= 0) {
      clearInterval(t);
      $("rgo").disabled = false;
    }
  }, 1000);
});
