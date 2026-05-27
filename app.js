
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



// =========================
// REGISTER
// =========================

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
        .eq("used",false)
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

      role:isMainAdmin
        ? "admin"
        : "client",

      trainer_id:trainerId

    });


  alert("Cuenta creada");

  loadDashboard();
}



// =========================
// LOGIN
// =========================

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
// =========================
// LOAD DASHBOARD
// =========================

async function loadDashboard(){

  document
    .querySelectorAll(".screen")
    .forEach(screen=>{

      screen.classList.add("hidden");

    });


  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


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
      .innerText =
        profile.full_name;


    document
      .getElementById("sidebarUserName")
      .innerText =
        profile.full_name;


    document
      .getElementById("profileData")
      .innerHTML = `

        <p>Nombre: ${profile.full_name}</p>

        <p>Peso: ${profile.weight}</p>

        <p>Altura: ${profile.height}</p>

        <p>Edad: ${profile.age}</p>

        <p>Objetivo: ${profile.goal}</p>

      `;


    loadExercises();
    loadProgress();
  }
}
// =========================
// SAVE PROFILE
// =========================

async function saveProfile(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


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

      age:
        document.getElementById("age").value,

      goal:
        document.getElementById("goal").value

    });


  loadDashboard();
}



// =========================
// LOGOUT
// =========================

async function logout(){

  await supabaseClient.auth.signOut();

  location.reload();
}



// =========================
// SIDEBAR
// =========================

function toggleSidebar(id){

  const sidebar =
    document.getElementById(id);


  sidebar.classList.toggle(
    "sidebarOpen"
  );
}



// =========================
// ADMIN SECTIONS
// =========================

function showAdminSection(id){

  document
    .querySelectorAll(".adminSection")
    .forEach(section=>{

      section.classList.add("hidden");

    });


  document
    .getElementById(id)
    .classList.remove("hidden");
}



// =========================
// CLIENT SECTIONS
// =========================

function showClientSection(id){

  document
    .querySelectorAll(".clientSection")
    .forEach(section=>{

      section.classList.add("hidden");

    });


  document
    .getElementById(id)
    .classList.remove("hidden");
}
// =========================
// GENERAR CODIGO
// =========================

async function generateCode(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


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



// =========================
// CARGAR CODIGOS
// =========================

async function loadCodes(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


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

        <p>
          ${code.used
            ? "Usado"
            : "Disponible"}
        </p>

      </div>

    `;
  });
}



// =========================
// CLIENTES
// =========================

async function loadClients(){

  const authData =
    await supabaseClient.auth.getUser();

  const currentUser =
    authData.data.user;


  const { data:users } =
    await supabaseClient
      .from("users")
      .select("*")
      .eq("trainer_id",currentUser.id);


  const list =
    document.getElementById("clientsList");

  list.innerHTML = "";


  for(const user of users){

    const { data:profile } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id",user.id)
        .maybeSingle();


    const { data:exercises } =
      await supabaseClient
        .from("exercises")
        .select("*")
        .eq("client_id",user.id);


    const completed =
      exercises.filter(
        e=>e.completed
      ).length;


    const percent =
      exercises.length
      ? Math.round(
          (completed /
            exercises.length) * 100
        )
      : 0;


    list.innerHTML += `

      <div class="exerciseCard">

        <h3>
          ${profile?.full_name || "Sin nombre"}
        </h3>

        <p>${user.email}</p>

        <p>
          Peso:
          ${profile?.weight || "-"}
        </p>

        <p>
          Objetivo:
          ${profile?.goal || "-"}
        </p>

        <p>
          Progreso:
          ${percent}%
        </p>

        <button
          onclick="makeTrainer('${user.id}')"
        >
          Hacer entrenador
        </button>

      </div>

    `;
  }
}
// =========================
// HACER ENTRENADOR
// =========================

async function makeTrainer(userId){

  await supabaseClient
    .from("users")
    .update({

      role:"admin"

    })
    .eq("id",userId);


  loadClients();
}



// =========================
// AGREGAR EJERCICIO TEMPLATE
// =========================

function addTemplateExercise(){

  templateExercises.push({

    name:
      document.getElementById(
        "templateExercise"
      ).value,

    sets:
      document.getElementById(
        "templateSets"
      ).value,

    reps:
      document.getElementById(
        "templateReps"
      ).value,

    week_day:
      document.getElementById(
        "templateDay"
      ).value

  });


  renderTemplateExercises();
}



// =========================
// RENDER TEMPLATE
// =========================

function renderTemplateExercises(){

  const list =
    document.getElementById(
      "templateExerciseList"
    );

  list.innerHTML = "";


  templateExercises.forEach(exercise=>{

    list.innerHTML += `

      <div class="exerciseCard">

        <h3>${exercise.name}</h3>

        <p>${exercise.sets} series</p>

        <p>${exercise.reps} reps</p>

        <p>${exercise.week_day}</p>

      </div>

    `;
  });
}
// =========================
// CREAR RUTINA
// =========================

async function createTemplate(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


  const templateName =
    document.getElementById(
      "templateName"
    ).value;


  if(!templateName){

    alert("Pon nombre");

    return;
  }


  if(templateExercises.length === 0){

    alert("Agrega ejercicios");

    return;
  }


  const { data:template } =
    await supabaseClient
      .from("routine_templates")
      .insert({

        name:templateName,

        created_by:user.id

      })
      .select()
      .maybeSingle();


  for(const exercise of templateExercises){

    await supabaseClient
      .from("template_exercises")
      .insert({

        template_id:template.id,

        name:exercise.name,

        sets:exercise.sets,

        reps:exercise.reps,

        week_day:exercise.week_day

      });
  }


  templateExercises = [];

  renderTemplateExercises();

  loadTemplates();

  alert("Rutina guardada");
}



// =========================
// CARGAR RUTINAS
// =========================

async function loadTemplates(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


  const { data } =
    await supabaseClient
      .from("routine_templates")
      .select("*")
      .eq("created_by",user.id);


  const list =
    document.getElementById(
      "templatesList"
    );

  const select =
    document.getElementById(
      "assignTemplate"
    );


  list.innerHTML = "";

  select.innerHTML = "";


  data.forEach(template=>{

    list.innerHTML += `

      <div class="exerciseCard">

        <h3>${template.name}</h3>

      </div>

    `;


    select.innerHTML += `

      <option value="${template.id}">
        ${template.name}
      </option>

    `;
  });
}



// =========================
// LOAD ASSIGN DATA
// =========================

async function loadAssignData(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


  const { data:clients } =
    await supabaseClient
      .from("users")
      .select("*")
      .eq("trainer_id",user.id);


  const select =
    document.getElementById(
      "assignClient"
    );

  select.innerHTML = "";


  for(const client of clients){

    const { data:profile } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("user_id",client.id)
        .maybeSingle();


    select.innerHTML += `

      <option value="${client.id}">

        ${
          profile?.full_name
          || client.email
        }

      </option>

    `;
  }
}
// =========================
// ASIGNAR RUTINA
// =========================

async function assignTemplateToClient(){

  const templateId =
    document.getElementById(
      "assignTemplate"
    ).value;

  const clientId =
    document.getElementById(
      "assignClient"
    ).value;


  const { data:exercises } =
    await supabaseClient
      .from("template_exercises")
      .select("*")
      .eq("template_id",templateId);


  for(const exercise of exercises){

    await supabaseClient
      .from("exercises")
      .insert({

        client_id:clientId,

        name:exercise.name,

        sets:exercise.sets,

        reps:exercise.reps,

        week_day:exercise.week_day,

        completed:false

      });
  }


  alert("Rutina asignada");
}



// =========================
// LOAD EXERCISES
// =========================

async function loadExercises(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


  const { data } =
    await supabaseClient
      .from("exercises")
      .select("*")
      .eq("client_id",user.id);


  const list =
    document.getElementById(
      "exerciseList"
    );

  list.innerHTML = "";


  data.forEach(exercise=>{

    list.innerHTML += `

      <div class="exerciseCard">

        <div class="exerciseTop">

          <h3>${exercise.name}</h3>

          <input
            type="checkbox"

            ${
              exercise.completed
              ? "checked"
              : ""
            }

            onchange="
              toggleExercise(
                '${exercise.id}',
                ${exercise.completed}
              )
            "
          >

        </div>

        <p>${exercise.sets} series</p>

        <p>${exercise.reps} reps</p>

        <p>${exercise.week_day}</p>

      </div>

    `;
  });
}
// =========================
// TOGGLE EXERCISE
// =========================

async function toggleExercise(id,current){

  await supabaseClient
    .from("exercises")
    .update({

      completed:!current

    })
    .eq("id",id);


  loadExercises();
  loadProgress();
}



// =========================
// LOAD PROGRESS
// =========================

async function loadProgress(){

  const authData =
    await supabaseClient.auth.getUser();

  const user =
    authData.data.user;


  const { data } =
    await supabaseClient
      .from("exercises")
      .select("*")
      .eq("client_id",user.id);


  const completed =
    data.filter(
      e=>e.completed
    ).length;


  const percent =
    data.length
    ? Math.round(
        (completed / data.length) * 100
      )
    : 0;


  document
    .getElementById("progressFill")
    .style.width =
      `${percent}%`;


  document
    .getElementById("progressText")
    .innerText =
      `${percent}% completado`;
}
