const SUPABASE_URL =
"https://afutdksveitsuqtwdfaz.supabase.co";

const SUPABASE_KEY =
"sb_publishable_IhVAJzBwBkLyuMcvyVtQSA_bZ9tTdRP";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

/* ------------------------- */
/* INIT */
/* ------------------------- */

checkSession();

/* ------------------------- */
/* SIDEBAR */
/* ------------------------- */

function toggleSidebar(){

  const sidebar =
  document.getElementById("sidebar");

  sidebar.classList.toggle("active");
}

/* ------------------------- */
/* SECTIONS */
/* ------------------------- */

function showSection(section){

  document
  .getElementById("dashboardSection")
  .classList.add("hidden");

  document
  .getElementById("clientsSection")
  .classList.add("hidden");

  document
  .getElementById("routinesSection")
  .classList.add("hidden");

  document
  .getElementById("profileSection")
  .classList.add("hidden");

  if(section === "dashboard"){
    document
    .getElementById("dashboardSection")
    .classList.remove("hidden");
  }

  if(section === "clients"){
    document
    .getElementById("clientsSection")
    .classList.remove("hidden");
  }

  if(section === "routines"){
    document
    .getElementById("routinesSection")
    .classList.remove("hidden");
  }

  if(section === "profile"){
    document
    .getElementById("profileSection")
    .classList.remove("hidden");
  }

  if(window.innerWidth < 900){
    toggleSidebar();
  }
}

/* ------------------------- */
/* AUTH */
/* ------------------------- */

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

  const isAdmin =
  email === "yeraariel0@gmail.com";

  let trainerId = null;

  if(!isAdmin){

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

  const { data, error } =
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
    email:email,
    role:isAdmin ? "admin" : "client",
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
  await supabaseClient.auth.signInWithPassword({
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

/* ------------------------- */
/* SESSION */
/* ------------------------- */

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

  loadProfile(user.id);

  loadClients(user.id);

  loadRoutines(user.id);
}

/* ------------------------- */
/* PROFILE */
/* ------------------------- */

async function loadProfile(userId){

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  const { data:profile } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

  const profileBox =
  document.getElementById("profileData");

  profileBox.innerHTML = `
    <p><strong>Email:</strong> ${userData?.email || ""}</p>
    <br>
    <p><strong>Nombre:</strong> ${profile?.full_name || "-"}</p>
    <p><strong>Peso:</strong> ${profile?.weight || "-"}</p>
    <p><strong>Altura:</strong> ${profile?.height || "-"}</p>
    <p><strong>Objetivo:</strong> ${profile?.goal || "-"}</p>
  `;
}

/* ------------------------- */
/* CLIENTS */
/* ------------------------- */

async function loadClients(userId){

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id", userId)
  .maybeSingle();

  if(userData.role !== "admin"){
    return;
  }

  const { data:clients } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("trainer_id", userId);

  const clientsList =
  document.getElementById("clientsList");

  clientsList.innerHTML = "";

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
          Objetivo:
          ${profile?.goal || "-"}
        </p>

      </div>
    `;
  }
}

/* ------------------------- */
/* ROUTINES */
/* ------------------------- */

async function createRoutine(){

  const {
    data:{ user }
  } =
  await supabaseClient.auth.getUser();

  const routineName =
  document.getElementById("routineName").value;

  const routineExercises =
  document.getElementById("routineExercises").value;

  if(!routineName || !routineExercises){
    alert("Completa todo");
    return;
  }

  const { error } =
  await supabaseClient
  .from("routine_templates")
  .insert({
    trainer_id:user.id,
    name:routineName,
    exercises:routineExercises
  });

  if(error){
    alert(error.message);
    return;
  }

  document.getElementById("routineName").value = "";
  document.getElementById("routineExercises").value = "";

  loadRoutines(user.id);
}

async function loadRoutines(userId){

  const { data:routines } =
  await supabaseClient
  .from("routine_templates")
  .select("*")
  .eq("trainer_id", userId)
  .order("id", { ascending:false });

  const routinesList =
  document.getElementById("routinesList");

  routinesList.innerHTML = "";

  routines.forEach(routine=>{

    routinesList.innerHTML += `
      <div class="routine-card">

        <h3>
          ${routine.name}
        </h3>

        <pre>
${routine.exercises}
        </pre>

      </div>
    `;
  });
}
