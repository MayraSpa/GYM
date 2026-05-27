const SUPABASE_URL =
"https://afutdksveitsuqtwdfaz.supabase.co";

const SUPABASE_KEY =
"sb_publishable_IhVAJzBwBkLyuMcvyVtQSA_bZ9tTdRP";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

checkSession();

function toggleSidebar(){

  const sidebar =
  document.getElementById("sidebar");

  sidebar.classList.toggle("active");
}

function showSection(section){

  const sections = [
    "dashboardSection",
    "clientsSection",
    "routinesSection",
    "codesSection",
    "profileSection"
  ];

  sections.forEach(id=>{

    const el = document.getElementById(id);

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

  if(isSuperAdmin){

    role = "super_admin";
  }

  else{

    const { data:codeData } =
    await supabaseClient
    .from("invite_codes")
    .select("*")
    .eq("code", inviteCode)
    .maybeSingle();

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

  alert("Cuenta creada");
}

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

async function logout(){

  await supabaseClient.auth.signOut();

  location.reload();
}

async function checkSession(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  if(!user){
    return;
  }

  document
  .getElementById("authScreen")
  .classList.add("hidden");

  document
  .getElementById("appScreen")
  .classList.remove("hidden");

  loadClients(user.id);
  loadRoutines(user.id);
  loadCodes();
  loadProfile(user.id);
}

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

    <p>
      Nombre: ${profile?.full_name || "-"}
    </p>

    <p>
      Peso: ${profile?.weight || "-"}
    </p>

    <p>
      Altura: ${profile?.height || "-"}
    </p>

    <p>
      Objetivo: ${profile?.goal || "-"}
    </p>
  `;
}

async function loadClients(userId){

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  let clients = [];

  if(userData.role === "super_admin"){

    const { data } =
    await supabaseClient
    .from("users")
    .select("*")
    .eq("role","client");

    clients = data || [];
  }

  else if(
    userData.role === "trainer"
    ||
    userData.role === "gym_owner"
  ){

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

  clients.forEach(client=>{

    clientsList.innerHTML += `

      <div class="client-card">

        <p>${client.email}</p>

        <button onclick="deleteClient('${client.id}')">
          Eliminar
        </button>

        <button onclick="makeTrainer('${client.id}')">
          Hacer entrenador
        </button>

      </div>
    `;
  });
}

async function createRoutine(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const routineName =
  document.getElementById("routineName").value;

  const routineExercises =
  document.getElementById("routineExercises").value;

  await supabaseClient
  .from("routine_templates")
  .insert({

    trainer_id:user.id,

    name:routineName,

    exercises:routineExercises
  });

  loadRoutines(user.id);
}

async function loadRoutines(userId){

  const { data:routines } =
  await supabaseClient
  .from("routine_templates")
  .select("*")
  .eq("trainer_id", userId);

  const routinesList =
  document.getElementById("routinesList");

  routinesList.innerHTML = "";

  routines.forEach(routine=>{

    routinesList.innerHTML += `

      <div class="routine-card">

        <h3>${routine.name}</h3>

        <pre>${routine.exercises}</pre>

      </div>
    `;
  });
}

async function generateCode(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const code =
  Math.random()
  .toString(36)
  .substring(2,8)
  .toUpperCase();

  await supabaseClient
  .from("invite_codes")
  .insert({

    code,

    created_by:user.id
  });

  loadCodes();
}

async function loadCodes(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const { data:codes } =
  await supabaseClient
  .from("invite_codes")
  .select("*")
  .eq("created_by", user.id);

  const codesList =
  document.getElementById("codesList");

  codesList.innerHTML = "";

  codes.forEach(code=>{

    codesList.innerHTML += `

      <div class="routine-card">

        <h3>${code.code}</h3>

      </div>
    `;
  });
}

async function deleteClient(clientId){

  await supabaseClient
  .from("profiles")
  .delete()
  .eq("user_id", clientId);

  await supabaseClient
  .from("users")
  .delete()
  .eq("id", clientId);

  location.reload();
}

async function deleteMyAccount(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  await supabaseClient
  .from("profiles")
  .delete()
  .eq("user_id", user.id);

  await supabaseClient
  .from("users")
  .delete()
  .eq("id", user.id);

  await supabaseClient.auth.signOut();

  location.reload();
}

async function makeTrainer(userId){

  await supabaseClient
  .from("users")
  .update({
    role:"trainer"
  })
  .eq("id", userId);

  alert("Ahora es entrenador");

  location.reload();
}
