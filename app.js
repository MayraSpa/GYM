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

window.addEventListener(
  "DOMContentLoaded",
  ()=>{

    checkSession();
  }
);

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

  if(section === "clients"){

    loadClientsPage();
  }

  if(section === "routines"){

    loadTrainerRoutines();
  }

  if(window.innerWidth < 900){

    document
    .getElementById("sidebar")
    .classList.remove("active");
  }
}

/* ================================= */
/* SIGN UP */
/* ================================= */

async function signUp(){

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  const inviteCode =
  document.getElementById("inviteCode").value;

  if(!email || !password){

    alert("Completa todos los campos");

    return;
  }

  const isSuperAdmin =
  email === "yeraariel0@gmail.com";

  let role = "client";

  let trainerId = null;

  let inviteData = null;

  /* CLIENTE */

  if(!isSuperAdmin){

    const response =
    await supabaseClient
    .from("invite_codes")
    .select("*")
    .eq("code", inviteCode)
    .eq("used", false)
    .maybeSingle();

    inviteData = response.data;

    if(!inviteData){

      alert("Código inválido");

      return;
    }

    trainerId =
    inviteData.created_by;
  }

  else{

    role = "super_admin";
  }

  /* AUTH */

  const {
    data,
    error
  } =
  await supabaseClient.auth.signUp({

    email,
    password
  });

  if(error){

    alert(error.message);

    return;
  }

  const user =
  data.user;

  /* USERS TABLE */

  await supabaseClient
  .from("users")
  .insert({

    id:user.id,

    email:user.email,

    role,

    trainer_id:trainerId
  });

  /* USAR CODIGO */

  if(inviteData){

    await supabaseClient
    .from("invite_codes")
    .update({

      used:true

    })
    .eq("id", inviteData.id);
  }

  alert("Cuenta creada");

  checkSession();
}

/* ================================= */
/* LOGIN */
/* ================================= */

async function login(){

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  const {
    error
  } =
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

  await supabaseClient
  .auth
  .signOut();

  location.reload();
}

/* ================================= */
/* CHECK SESSION */
/* ================================= */

async function checkSession(){

  const {
    data:{ session }
  } =
  await supabaseClient.auth.getSession();

  /* NO LOGIN */

  if(!session){

    document
    .getElementById("authScreen")
    .classList.remove("hidden");

    document
    .getElementById("appScreen")
    .classList.add("hidden");

    return;
  }

  const user =
  session.user;

  /* OCULTAR LOGIN */

  document
  .getElementById("authScreen")
  .classList.add("hidden");

  document
  .getElementById("appScreen")
  .classList.remove("hidden");

  /* BUSCAR USER */

  let response =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  let userData =
  response.data;

  /* CREAR SI NO EXISTE */

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

    response =
    await supabaseClient
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

    userData =
    response.data;
  }

  /* ERROR */

  if(!userData){

    alert("Error cargando usuario");

    return;
  }

  /* CLIENT */

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

  else{

    document
    .getElementById("clientsBtn")
    ?.classList.remove("hidden");

    document
    .getElementById("codesBtn")
    ?.classList.remove("hidden");

    document
    .getElementById("routinesBtn")
    ?.classList.remove("hidden");
  }

  /* LOAD */

  loadProfile(user.id);

  loadClientsPage();

  loadTrainerRoutines();

  loadCodes();

  loadMyRoutines(user.id);
}
/* ================================= */
/* PROFILE */
/* ================================= */

async function loadProfile(userId){

  const {
    data:profile
  } =
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
      placeholder="Nombre completo"
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
  await supabaseClient
  .auth
  .getUser();

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
/* DELETE ACCOUNT */
/* ================================= */

async function deleteMyAccount(){

  const confirmDelete =
  confirm(
    "¿Eliminar cuenta?"
  );

  if(!confirmDelete){

    return;
  }

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  await supabaseClient
  .from("profiles")
  .delete()
  .eq("user_id", user.id);

  await supabaseClient
  .from("users")
  .delete()
  .eq("id", user.id);

  alert(
    "Cuenta eliminada"
  );

  logout();
}

/* ================================= */
/* CLIENTS */
/* ================================= */

async function loadClientsPage(){

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  if(!user){

    return;
  }

  const {
    data:userData
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  if(
    !userData ||
    userData.role === "client"
  ){

    return;
  }

  let clients = [];

  /* SUPER ADMIN */

  if(
    userData.role === "super_admin"
  ){

    const response =
    await supabaseClient
    .from("users")
    .select("*")
    .eq("role","client");

    clients =
    response.data || [];
  }

  /* TRAINER */

  else{

    const response =
    await supabaseClient
    .from("users")
    .select("*")
    .eq("trainer_id", user.id);

    clients =
    response.data || [];
  }

  const clientsList =
  document.getElementById("clientsList");

  clientsList.innerHTML = "";

  if(clients.length === 0){

    clientsList.innerHTML =
    "<p>No hay clientes</p>";

    return;
  }

  for(const client of clients){

    const {
      data:profile
    } =
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
          Objetivo:
          ${profile?.goal || "-"}
        </p>

        <button
          onclick="deleteClient('${client.id}')"
        >
          Eliminar cliente
        </button>

      </div>
    `;
  }
}

/* ================================= */
/* DELETE CLIENT */
/* ================================= */

async function deleteClient(clientId){

  const confirmDelete =
  confirm(
    "¿Eliminar cliente?"
  );

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

  loadClientsPage();

  alert("Cliente eliminado");
}
/* ================================= */
/* GENERATE CODE */
/* ================================= */

async function generateCode(){

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  if(!user){

    return;
  }

  const {
    data:userData
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  /* CLIENTES NO */

  if(
    !userData ||
    userData.role === "client"
  ){

    alert(
      "No permitido"
    );

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

  alert(
    "Código generado"
  );
}

/* ================================= */
/* LOAD CODES */
/* ================================= */

async function loadCodes(){

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  if(!user){

    return;
  }

  const {
    data:userData
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  if(
    !userData ||
    userData.role === "client"
  ){

    return;
  }

  const response =
  await supabaseClient
  .from("invite_codes")
  .select("*")
  .eq("created_by", user.id)
  .order("id",{

    ascending:false
  });

  const codes =
  response.data || [];

  const codesList =
  document.getElementById("codesList");

  if(!codesList){

    return;
  }

  codesList.innerHTML = "";

  if(codes.length === 0){

    codesList.innerHTML =
    "<p>No hay códigos</p>";

    return;
  }

  codes.forEach(code=>{

    codesList.innerHTML += `

      <div class="routine-card">

        <h3>
          ${code.code}
        </h3>

        <p>
          ${
            code.used
            ? "USADO"
            : "DISPONIBLE"
          }
        </p>

      </div>
    `;
  });
}

/* ================================= */
/* CREATE ROUTINE */
/* ================================= */

async function createRoutine(){

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  const day =
  document
  .getElementById("routineDay")
  .value;

  const routineName =
  document
  .getElementById("routineName")
  .value;

  const routineExercises =
  document
  .getElementById("routineExercises")
  .value;

  const clientId =
  document
  .getElementById("routineClient")
  .value;

  if(
    !day ||
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

    day,

    routine_name:routineName,

    exercises:routineExercises
  });

  alert("Rutina creada");

  loadTrainerRoutines();
}

/* ================================= */
/* LOAD CLIENTS SELECT */
/* ================================= */

async function loadClientsSelect(){

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  if(!user){

    return;
  }

  const response =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("trainer_id", user.id);

  const clients =
  response.data || [];

  const select =
  document.getElementById(
    "routineClient"
  );

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
/* LOAD TRAINER ROUTINES */
/* ================================= */

async function loadTrainerRoutines(){

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  if(!user){

    return;
  }

  const {
    data:userData
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  if(
    !userData ||
    userData.role === "client"
  ){

    return;
  }

  const response =
  await supabaseClient
  .from("client_routines")
  .select("*")
  .eq("trainer_id", user.id)
  .order("id",{

    ascending:false
  });

  const routines =
  response.data || [];

  const routinesList =
  document.getElementById(
    "routinesList"
  );

  if(!routinesList){

    return;
  }

  routinesList.innerHTML = "";

  if(routines.length === 0){

    routinesList.innerHTML =
    "<p>No hay rutinas</p>";

    loadClientsSelect();

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

        <p>
          ${
            routine.completed
            ? "COMPLETADA"
            : "PENDIENTE"
          }
        </p>

      </div>
    `;
  });

  loadClientsSelect();
}

/* ================================= */
/* LOAD MY ROUTINES */
/* ================================= */

async function loadMyRoutines(userId){

  const {
    data:userData
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  if(
    !userData ||
    userData.role !== "client"
  ){

    return;
  }

  const today =
  new Date()
  .toLocaleDateString(
    "en-US",
    {

      weekday:"long"
    }
  );

  const response =
  await supabaseClient
  .from("client_routines")
  .select("*")
  .eq("client_id", userId)
  .eq("day", today);

  const routines =
  response.data || [];

  const dashboard =
  document.getElementById(
    "dashboardContent"
  );

  dashboard.innerHTML = `

    <h2>

      Rutina de hoy

    </h2>
  `;

  if(routines.length === 0){

    dashboard.innerHTML += `

      <p>

        Hoy no tienes rutina

      </p>
    `;

    return;
  }

  routines.forEach(routine=>{

    dashboard.innerHTML += `

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

          ${
            routine.completed
            ? "Completada"
            : "Marcar completada"
          }

        </button>

      </div>
    `;
  });
}

/* ================================= */
/* COMPLETE ROUTINE */
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
  await supabaseClient
  .auth
  .getUser();

  loadMyRoutines(user.id);
}

/* ================================= */
/* MAKE TRAINER */
/* ================================= */

async function makeTrainer(userId){

  const {
    data:{ user }
  } =
  await supabaseClient
  .auth
  .getUser();

  if(!user){

    return;
  }

  const {
    data:me
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", user.id)
  .maybeSingle();

  if(
    !me ||
    me.role !== "super_admin"
  ){

    alert(
      "No permitido"
    );

    return;
  }

  await supabaseClient
  .from("users")
  .update({

    role:"trainer"

  })
  .eq("id", userId);

  alert(
    "Ahora es entrenador"
  );

  loadClientsPage();
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

window.addEventListener(
  "resize",
  ()=>{

    const sidebar =
    document.getElementById(
      "sidebar"
    );

    if(
      window.innerWidth > 900
    ){

      sidebar
      ?.classList
      .remove("active");
    }
  }
);

/* ================================= */
/* ENTER LOGIN */
/* ================================= */

document.addEventListener(
  "keydown",
  (e)=>{

    if(e.key === "Enter"){

      const authScreen =
      document.getElementById(
        "authScreen"
      );

      if(
        authScreen &&
        !authScreen
        .classList
        .contains("hidden")
      ){

        login();
      }
    }
  }
);

/* ================================= */
/* READY */
/* ================================= */

console.log(
  "Gym SaaS listo"
);
