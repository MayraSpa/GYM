const SUPABASE_URL =
"https://afutdksveitsuqtwdfaz.supabase.co";

const SUPABASE_KEY =
"sb_publishable_IhVAJzBwBkLyuMcvyVtQSA_bZ9tTdRP";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let templateExercises = [];

loadDashboard();


function toggleSidebar(id){

  const sidebar =
  document.getElementById(id);

  sidebar.classList.toggle("open");
}


document.addEventListener(
  "click",
  function(event){

    const sidebars =
    document.querySelectorAll(".sidebar");

    const menuBtns =
    document.querySelectorAll(".menuBtn");

    let clickedBtn = false;

    menuBtns.forEach(btn=>{
      if(btn.contains(event.target)){
        clickedBtn = true;
      }
    });

    sidebars.forEach(sidebar=>{

      if(
        !sidebar.contains(event.target)
        &&
        !clickedBtn
      ){
        sidebar.classList.remove("open");
      }

    });

  }
);


async function signUp(){

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  const inviteCode =
  document.getElementById("inviteCode").value;

  const isMainAdmin =
  email === "yeraariel0@gmail.com";

  let trainerId = null;

  if(!isMainAdmin){

    const { data:codeData } =
    await supabaseClient
    .from("invite_codes")
    .select("*")
    .eq("code",inviteCode)
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
    role:isMainAdmin ? "admin" : "client",
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

  loadDashboard();
}


async function logout(){

  await supabaseClient.auth.signOut();

  location.reload();
}


async function loadDashboard(){

  document.querySelectorAll(".screen")
  .forEach(screen=>{
    screen.classList.add("hidden");
  });

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  if(!user){

    document
    .getElementById("authScreen")
    .classList.remove("hidden");

    return;
  }

  const { data:userData } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("id",user.id)
  .maybeSingle();

  const { data:profile } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id",user.id)
  .maybeSingle();

  if(!profile){

    document
    .getElementById("profileSetupScreen")
    .classList.remove("hidden");

    return;
  }

  if(userData.role === "admin"){

    document
    .getElementById("adminDashboard")
    .classList.remove("hidden");

    loadClients();
    loadCodes();
    loadTemplates();
    loadAssignData();

  }else{

    document
    .getElementById("clientDashboard")
    .classList.remove("hidden");

    document
    .getElementById("welcomeName")
    .innerText = profile.full_name;

    document
    .getElementById("profileData")
    .innerHTML = `
      <p>Nombre: ${profile.full_name}</p>
      <p>Peso: ${profile.weight}</p>
      <p>Altura: ${profile.height}</p>
      <p>Edad: ${profile.age}</p>
      <p>Objetivo: ${profile.goal}</p>
    `;

    loadClientRoutine();
  }
}


async function saveProfile(){

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  await supabaseClient
  .from("profiles")
  .upsert({
    user_id:user.id,
    full_name:document.getElementById("fullName").value,
    weight:document.getElementById("weight").value,
    height:document.getElementById("height").value,
    age:document.getElementById("age").value,
    goal:document.getElementById("goal").value
  });

  loadDashboard();
}


function showAdminSection(id){

  document.querySelectorAll(".adminSection")
  .forEach(section=>{
    section.classList.add("hidden");
  });

  document
  .getElementById(id)
  .classList.remove("hidden");
}


function showClientSection(id){

  document.querySelectorAll(".clientSection")
  .forEach(section=>{
    section.classList.add("hidden");
  });

  document
  .getElementById(id)
  .classList.remove("hidden");
}


async function generateCode(){

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

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

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  const { data } =
  await supabaseClient
  .from("invite_codes")
  .select("*")
  .eq("created_by",user.id);

  const list =
  document.getElementById("codesList");

  list.innerHTML = "";

  data.forEach(code=>{

    list.innerHTML += `
      <div class="exerciseCard">
        <h3>${code.code}</h3>
      </div>
    `;

  });
}


function addExercise(){

  const name =
  document.getElementById("exerciseName").value;

  const sets =
  document.getElementById("exerciseSets").value;

  const reps =
  document.getElementById("exerciseReps").value;

  const rest =
  document.getElementById("exerciseRest").value;

  templateExercises.push({
    name,
    sets,
    reps,
    rest
  });

  renderExercisePreview();
}


function renderExercisePreview(){

  const preview =
  document.getElementById("exercisePreview");

  preview.innerHTML = "";

  templateExercises.forEach(ex=>{

    preview.innerHTML += `
      <div class="exerciseCard">
        <h3>${ex.name}</h3>
        <p>${ex.sets} series</p>
        <p>${ex.reps} reps</p>
        <p>${ex.rest} descanso</p>
      </div>
    `;

  });
}


async function saveTemplate(){

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  const name =
  document.getElementById("routineName").value;

  const { data } =
  await supabaseClient
  .from("routine_templates")
  .insert({
    trainer_id:user.id,
    name
  })
  .select()
  .single();

  for(const ex of templateExercises){

    await supabaseClient
    .from("template_exercises")
    .insert({
      template_id:data.id,
      exercise_name:ex.name,
      sets:ex.sets,
      reps:ex.reps,
      rest_time:ex.rest
    });

  }

  templateExercises = [];

  renderExercisePreview();

  loadTemplates();
}


async function loadTemplates(){

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  const { data } =
  await supabaseClient
  .from("routine_templates")
  .select("*")
  .eq("trainer_id",user.id);

  const list =
  document.getElementById("templatesList");

  list.innerHTML = "";

  data.forEach(template=>{

    list.innerHTML += `
      <div class="exerciseCard">
        <h3>${template.name}</h3>
      </div>
    `;

  });
}


async function loadClients(){

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  const { data } =
  await supabaseClient
  .from("users")
  .select(`
    *,
    profiles(*)
  `)
  .eq("trainer_id",user.id);

  const list =
  document.getElementById("clientsList");

  list.innerHTML = "";

  data.forEach(client=>{

    const profile = client.profiles?.[0];

    list.innerHTML += `
      <div class="clientCard">

        <h3>
          ${profile?.full_name || 'Sin nombre'}
        </h3>

        <p>${client.email}</p>

        <p>Peso: ${profile?.weight || '-'}</p>

        <p>Objetivo: ${profile?.goal || '-'}</p>

      </div>
    `;

  });
}


async function loadAssignData(){

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  const { data:clients } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq("trainer_id",user.id);

  const { data:templates } =
  await supabaseClient
  .from("routine_templates")
  .select("*")
  .eq("trainer_id",user.id);

  const clientSelect =
  document.getElementById("assignClient");

  const templateSelect =
  document.getElementById("assignTemplate");

  clientSelect.innerHTML = "";
  templateSelect.innerHTML = "";

  clients.forEach(client=>{

    clientSelect.innerHTML += `
      <option value="${client.id}">
        ${client.email}
      </option>
    `;

  });

  templates.forEach(template=>{

    templateSelect.innerHTML += `
      <option value="${template.id}">
        ${template.name}
      </option>
    `;

  });
}


async function assignRoutine(){

  const clientId =
  document.getElementById("assignClient").value;

  const templateId =
  document.getElementById("assignTemplate").value;

  const weekLabel =
  document.getElementById("weekLabel").value;

  await supabaseClient
  .from("assigned_routines")
  .insert({
    client_id:clientId,
    template_id:templateId,
    week_label:weekLabel
  });

  alert("Rutina asignada");
}


async function loadClientRoutine(){

  const authData =
  await supabaseClient.auth.getUser();

  const user = authData.data.user;

  const { data:routines } =
  await supabaseClient
  .from("assigned_routines")
  .select(`
    *,
    routine_templates(*),
    template_exercises(*)
  `)
  .eq("client_id",user.id);

  const list =
  document.getElementById("routineList");

  list.innerHTML = "";

  routines.forEach(routine=>{

    list.innerHTML += `
      <div class="exerciseCard">
        <h3>
          ${routine.routine_templates.name}
        </h3>

        <p>${routine.week_label}</p>
      </div>
    `;

  });
}
