const SUPABASE_URL =
"https://afutdksveitsuqtwdfaz.supabase.co";

const SUPABASE_KEY =
"sb_publishable_IhVAJzBwBkLyuMcvyVtQSA_bZ9tTdRP";

const SUPABASE_URL =
"https://TU-PROYECTO.supabase.co";

const SUPABASE_KEY =
"TU_SUPABASE_ANON_KEY";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* ================================= */
/* INIT */
/* ================================= */

checkSession();

/* ================================= */
/* SIDEBAR */
/* ================================= */

function toggleSidebar(){

  const sidebar =
  document.getElementById("sidebar");

  sidebar.classList.toggle("active");
}

/* ================================= */
/* SECTIONS */
/* ================================= */

function showSection(section){

  const sections = [

    "dashboardSection",
    "clientsSection",
    "routinesSection",
    "codesSection",
    "profileSection"

  ];

  sections.forEach(id=>{

    const el =
    document.getElementById(id);

    if(el){

      el.classList.add("hidden");
    }
  });

  document
  .getElementById(section + "Section")
  ?.classList.remove("hidden");

  if(section === "codes"){

    loadCodes();
  }

  if(window.innerWidth < 900){

    document
    .getElementById("sidebar")
    .classList.remove("active");
  }
}

/* ================================= */
/* SIGNUP */
/* ================================= */

async function signUp(){

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  const inviteCode =
  document.getElementById("inviteCode").value;

  if(!email || !password){

    alert("Completa todo");

    return;
  }

  const isSuperAdmin =
  email === "yeraariel0@gmail.com";

  let role = "client";

  let trainerId = null;

  let codeData = null;

  if(isSuperAdmin){

    role = "super_admin";
  }

  else{

    const { data } =
    await supabaseClient
    .from("invite_codes")
    .select("*")
    .eq("code", inviteCode)
    .eq("used", false)
    .maybeSingle();

    codeData = data;

    if(!codeData){

      alert("Código inválido");

      return;
    }

    trainerId = codeData.created_by;
  }

  const { data,error } =
  await supabaseClient.auth.signUp({

    email,
    password
  });

  if(error){

    alert(error.message);

    return;
  }

  await supabaseClient
  .from("users")
  .insert({

    id:data.user.id,

    email,

    role,

    trainer_id:trainerId
  });

  if(codeData){

    await supabaseClient
    .from("invite_codes")
    .update({

      used:true

    })
    .eq("id", codeData.id);
  }

  alert("Cuenta creada");
}

/* ================================= */
/* LOGIN */
/* ================================= */

async function login(){

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  const { error } =
  await supabaseClient
  .auth
  .signInWithPassword({

    email,
    password
  });

  if(error){

    alert(error.message);

    return;
  }

  checkSession();
}

/* ================================= */
/* LOGOUT */
/* ================================= */

async function logout(){

  await supabaseClient.auth.signOut();

  location.reload();
}

/* ================================= */
/* SESSION */
/* ================================= */

async function checkSession(){

  const {
    data:{ session }
  } =
  await supabaseClient.auth.getSession();

  if(!session){

    document
    .getElementById("authScreen")
    .classList.remove("hidden");

    document
    .getElementById("appScreen")
    .classList.add("hidden");

    return;
  }

  const user = session.user;

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  /* FIX USER NULL */

  if(!userData){

    await supabaseClient
    .from("users")
    .insert({

      id:user.id,

      email:user.email,

      role:
        user.email === "yeraariel0@gmail.com"
        ? "super_admin"
        : "client"
    });

    return checkSession();
  }

  /* CLIENTE */

  if(userData.role === "client"){

    document
    .getElementById("clientsBtn")
    ?.classList.add("hidden");

    document
    .getElementById("codesBtn")
    ?.classList.add("hidden");

    document
    .getElementById("routinesBtn")
    ?.classList.add("hidden");
  }

  document
  .getElementById("authScreen")
  .classList.add("hidden");

  document
  .getElementById("appScreen")
  .classList.remove("hidden");

  loadProfile(user.id);

  loadClients(user.id);

  loadRoutines(user.id);

  loadCodes();

  loadMyRoutines(user.id);
}

/* ================================= */
/* PROFILE */
/* ================================= */

async function loadProfile(userId){

  const { data:profile } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

  const profileData =
  document.getElementById("profileData");

  profileData.innerHTML = `

    <input
      type="text"
      id="fullName"
      placeholder="Nombre"
      value="${profile?.full_name || ""}"
    >

    <input
      type="text"
      id="weight"
      placeholder="Peso"
      value="${profile?.weight || ""}"
    >

    <input
      type="text"
      id="height"
      placeholder="Altura"
      value="${profile?.height || ""}"
    >

    <input
      type="text"
      id="bodyFat"
      placeholder="Grasa corporal"
      value="${profile?.body_fat || ""}"
    >

    <input
      type="text"
      id="goal"
      placeholder="Objetivo"
      value="${profile?.goal || ""}"
    >

    <textarea
      id="injuries"
      placeholder="Lesiones"
    >${profile?.injuries || ""}</textarea>

    <button onclick="saveProfile()">
      Guardar perfil
    </button>

    <button onclick="deleteMyAccount()">
      Eliminar cuenta
    </button>
  `;
}

/* ================================= */
/* SAVE PROFILE */
/* ================================= */

async function saveProfile(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  await supabaseClient
  .from("profiles")
  .upsert({

    user_id:user.id,

    full_name:
    document.getElementById("fullName").value,

    weight:
    document.getElementById("weight").value,

    height:
    document.getElementById("height").value,

    body_fat:
    document.getElementById("bodyFat").value,

    goal:
    document.getElementById("goal").value,

    injuries:
    document.getElementById("injuries").value
  });

  alert("Perfil guardado");
}

/* ================================= */
/* LOAD CLIENTS */
/* ================================= */

async function loadClients(userId){

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  if(
    !userData ||
    userData.role === "client"
  ){

    return;
  }

  let clients = [];

  if(userData.role === "super_admin"){

    const { data } =
    await supabaseClient
    .from("users")
    .select("*")
    .eq("role","client");

    clients = data || [];
  }

  else{

    const { data } =
    await supabaseClient
    .from("users")
    .select("*")
    .eq("trainer_id", userId);

    clients = data || [];
  }

  const clientsList =
  document.getElementById("clientsList");

  if(!clientsList){

    return;
  }

  clientsList.innerHTML = "";

  if(clients.length === 0){

    clientsList.innerHTML =
    "<p>No hay clientes</p>";

    return;
  }

  for(const client of clients){

    const { data:profile } =
    await supabaseClient
    .from("profiles")
    .select("*")
    .eq("user_id", client.id)
    .maybeSingle();

    clientsList.innerHTML += `

      <div class="client-card">

        <h3>
          ${profile?.full_name || "Sin nombre"}
        </h3>

        <p>
          ${client.email}
        </p>

        <button onclick="deleteClient('${client.id}')">
          Eliminar
        </button>

      </div>
    `;
  }
}

/* ================================= */
/* AUTH LISTENER */
/* ================================= */

supabaseClient
.auth
.onAuthStateChange(()=>{

  checkSession();
});

console.log("Gym SaaS listo");
