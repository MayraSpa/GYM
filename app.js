const SUPABASE_URL =
"https://afutdksveitsuqtwdfaz.supabase.co";

const SUPABASE_KEY =
"sb_publishable_IhVAJzBwBkLyuMcvyVtQSA_bZ9tTdRP";

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

  const fullName =
  document.getElementById("fullName").value;

  const weight =
  document.getElementById("weight").value;

  const height =
  document.getElementById("height").value;

  const bodyFat =
  document.getElementById("bodyFat").value;

  const goal =
  document.getElementById("goal").value;

  const injuries =
  document.getElementById("injuries").value;

  await supabaseClient
  .from("profiles")
  .upsert({

    user_id:user.id,

    full_name:fullName,

    weight:weight,

    height:height,

    body_fat:bodyFat,

    goal:goal,

    injuries:injuries
  });

  alert("Perfil guardado");

  loadProfile(user.id);
}

/* ================================= */
/* CLIENTES */
/* ================================= */

async function loadClients(userId){

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  if(
    userData.role === "client"
  ){

    return;
  }

  let clients = [];

  /* SUPER ADMIN */

  if(userData.role === "super_admin"){

    const { data } =
    await supabaseClient
    .from("users")
    .select("*")
    .eq("role","client");

    clients = data || [];
  }

  /* TRAINER */

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

  clientsList.innerHTML = "";

  if(clients.length === 0){

    clientsList.innerHTML = `
      <p>No hay clientes</p>
    `;

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

        <p>

          Peso:
          ${profile?.weight || "-"}

        </p>

        <p>

          Altura:
          ${profile?.height || "-"}

        </p>

        <p>

          Grasa:
          ${profile?.body_fat || "-"}

        </p>

        <p>

          Objetivo:
          ${profile?.goal || "-"}

        </p>

        <p>

          Lesiones:
          ${profile?.injuries || "-"}

        </p>

        <button onclick="deleteClient('${client.id}')">

          Eliminar

        </button>

      </div>
    `;
  }
}
/* ================================= */
/* CREAR RUTINA */
/* ================================= */

async function createRoutine(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const routineName =
  document.getElementById("routineName").value;

  const routineExercises =
  document.getElementById("routineExercises").value;

  const clientId =
  document.getElementById("routineClient").value;

  if(
    !routineName ||
    !routineExercises ||
    !clientId
  ){

    alert("Completa todo");

    return;
  }

  await supabaseClient
  .from("client_routines")
  .insert({

    trainer_id:user.id,

    client_id:clientId,

    routine_name:routineName,

    exercises:routineExercises
  });

  alert("Rutina asignada");

  loadRoutines(user.id);
}

/* ================================= */
/* LOAD RUTINAS TRAINER */
/* ================================= */

async function loadRoutines(userId){

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  /* CLIENTES NO VEN ESTO */

  if(userData.role === "client"){

    return;
  }

  const { data:routines } =
  await supabaseClient
  .from("client_routines")
  .select("*")
  .eq("trainer_id", userId)
  .order("id",{ ascending:false });

  const routinesList =
  document.getElementById("routinesList");

  routinesList.innerHTML = "";

  if(routines.length === 0){

    routinesList.innerHTML = `
      <p>No hay rutinas</p>
    `;

    return;
  }

  routines.forEach(routine=>{

    routinesList.innerHTML += `

      <div class="routine-card">

        <h3>

          ${routine.routine_name}

        </h3>

        <pre>

${routine.exercises}

        </pre>

      </div>
    `;
  });

  loadClientsSelect(userId);
}

/* ================================= */
/* SELECT CLIENTES */
/* ================================= */

async function loadClientsSelect(userId){

  const { data:clients } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("trainer_id", userId);

  const select =
  document.getElementById("routineClient");

  if(!select){

    return;
  }

  select.innerHTML = `

    <option value="">

      Selecciona cliente

    </option>
  `;

  clients.forEach(client=>{

    select.innerHTML += `

      <option value="${client.id}">

        ${client.email}

      </option>
    `;
  });
}

/* ================================= */
/* RUTINAS CLIENTE */
/* ================================= */

async function loadMyRoutines(userId){

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  if(userData.role !== "client"){

    return;
  }

  const { data:routines } =
  await supabaseClient
  .from("client_routines")
  .select("*")
  .eq("client_id", userId)
  .order("id",{ ascending:false });

  const dashboard =
  document.getElementById("dashboardSection");

  let html = `

    <div class="card">

      <h2>

        Mis rutinas

      </h2>
  `;

  if(routines.length === 0){

    html += `
      <p>
        No tienes rutinas todavía
      </p>
    `;
  }

  routines.forEach(routine=>{

    html += `

      <div class="routine-card">

        <h3>

          ${routine.routine_name}

        </h3>

        <pre>

${routine.exercises}

        </pre>

        <button
          onclick="completeRoutine(${routine.id})"
        >

          ${routine.completed
            ? "Completada"
            : "Marcar completada"}

        </button>

      </div>
    `;
  });

  html += `
    </div>
  `;

  dashboard.innerHTML = html;
}
/* ================================= */
/* COMPLETAR RUTINA */
/* ================================= */

async function completeRoutine(routineId){

  await supabaseClient
  .from("client_routines")
  .update({

    completed:true

  })
  .eq("id", routineId);

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  loadMyRoutines(user.id);
}

/* ================================= */
/* GENERAR CODIGO */
/* ================================= */

async function generateCode(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  /* CLIENTE NO PUEDE */

  if(userData.role === "client"){

    alert("No permitido");

    return;
  }

  const code =
  Math.random()
  .toString(36)
  .substring(2,8)
  .toUpperCase();

  await supabaseClient
  .from("invite_codes")
  .insert({

    code,

    created_by:user.id,

    used:false
  });

  loadCodes();
}

/* ================================= */
/* LOAD CODES */
/* ================================= */

async function loadCodes(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  if(userData.role === "client"){

    return;
  }

  const { data:codes } =
  await supabaseClient
  .from("invite_codes")
  .select("*")
  .eq("created_by", user.id)
  .order("id",{ ascending:false });

  const codesList =
  document.getElementById("codesList");

  if(!codesList){

    return;
  }

  codesList.innerHTML = "";

  if(codes.length === 0){

    codesList.innerHTML = `
      <p>
        No hay códigos
      </p>
    `;

    return;
  }

  codes.forEach(code=>{

    codesList.innerHTML += `

      <div class="routine-card">

        <h3>

          ${code.code}

        </h3>

        <p>

          ${code.used
            ? "USADO"
            : "DISPONIBLE"}

        </p>

      </div>
    `;
  });
}

/* ================================= */
/* ELIMINAR CLIENTE */
/* ================================= */

async function deleteClient(clientId){

  const confirmDelete =
  confirm("Eliminar cliente?");

  if(!confirmDelete){

    return;
  }

  await supabaseClient
  .from("profiles")
  .delete()
  .eq("user_id", clientId);

  await supabaseClient
  .from("client_routines")
  .delete()
  .eq("client_id", clientId);

  await supabaseClient
  .from("users")
  .delete()
  .eq("id", clientId);

  alert("Cliente eliminado");

  location.reload();
}

/* ================================= */
/* ELIMINAR MI CUENTA */
/* ================================= */

async function deleteMyAccount(){

  const confirmDelete =
  confirm("Eliminar cuenta?");

  if(!confirmDelete){

    return;
  }

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  await supabaseClient
  .from("profiles")
  .delete()
  .eq("user_id", user.id);

  await supabaseClient
  .from("client_routines")
  .delete()
  .eq("client_id", user.id);

  await supabaseClient
  .from("users")
  .delete()
  .eq("id", user.id);

  await supabaseClient.auth.signOut();

  location.reload();
}

/* ================================= */
/* HACER TRAINER */
/* ================================= */

async function makeTrainer(userId){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const { data:me } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  if(me.role !== "super_admin"){

    alert("No permitido");

    return;
  }

  await supabaseClient
  .from("users")
  .update({

    role:"trainer"

  })
  .eq("id", userId);

  alert("Ahora es entrenador");

  location.reload();
}

/* ================================= */
/* AUTH LISTENER */
/* ================================= */

supabaseClient
.auth
.onAuthStateChange(()=>{

  checkSession();
});

/* ================================= */
/* RESPONSIVE */
/* ================================= */

window.addEventListener("resize",()=>{

  const sidebar =
  document.getElementById("sidebar");

  if(window.innerWidth > 900){

    sidebar.classList.remove("active");
  }
});

/* ================================= */
/* ENTER LOGIN */
/* ================================= */

document.addEventListener("keydown",(e)=>{

  if(e.key === "Enter"){

    const authScreen =
    document.getElementById("authScreen");

    if(
      !authScreen.classList.contains("hidden")
    ){

      login();
    }
  }
});

/* ================================= */
/* READY */
/* ================================= */

console.log("Gym SaaS listo");
