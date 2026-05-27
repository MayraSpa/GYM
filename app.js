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
// SIDEBAR
// =========================

function toggleSidebar(id){

  const sidebar =
    document.getElementById(id);

  sidebar.classList.toggle("open");
}



// =========================
// CERRAR SIDEBAR AFUERA
// =========================

document.addEventListener(
  "click",
  function(event){

    const adminSidebar =
      document.getElementById(
        "adminSidebar"
      );

    const clientSidebar =
      document.getElementById(
        "clientSidebar"
      );

    const menuButtons =
      document.querySelectorAll(
        ".menuBtn"
      );

    let clickedMenu = false;

    menuButtons.forEach(btn=>{

      if(btn.contains(event.target)){

        clickedMenu = true;
      }

    });

    if(
      adminSidebar &&
      !adminSidebar.contains(event.target) &&
      !clickedMenu
    ){

      adminSidebar.classList.remove(
        "open"
      );
    }

    if(
      clientSidebar &&
      !clientSidebar.contains(event.target) &&
      !clickedMenu
    ){

      clientSidebar.classList.remove(
        "open"
      );
    }

  }
);



// =========================
// REGISTER
// =========================

async function signUp(){

  const email =
    document.getElementById(
      "email"
    ).value;

  const password =
    document.getElementById(
      "password"
    ).value;

  const inviteCode =
    document.getElementById(
      "inviteCode"
    ).value;


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
    document.getElementById(
      "email"
    ).value;

  const password =
    document.getElementById(
      "password"
    ).value;


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


  loadDashboard();
}



// =========================
// LOGOUT
// =========================

async function logout(){

  await supabaseClient
    .auth
    .signOut();

  location.reload();
}



// =========================
// LOAD DASHBOARD
// =========================

async function loadDashboard(){

  document
    .querySelectorAll(".screen")
    .forEach(screen=>{

      screen.classList.add(
        "hidden"
      );

    });


  const authData =
    await supabaseClient
      .auth
      .getUser();

  const user =
    authData.data.user;


  if(!user){

    document
      .getElementById(
        "authScreen"
      )
      .classList.remove(
        "hidden"
      );

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
      .getElementById(
        "profileSetupScreen"
      )
      .classList.remove(
        "hidden"
      );

    return;
  }


  if(userData.role === "admin"){

    document
      .getElementById(
        "adminDashboard"
      )
      .classList.remove(
        "hidden"
      );

    loadClients();
    loadCodes();
    loadTemplates();
    loadAssignData();

  }else{

    document
      .getElementById(
        "clientDashboard"
      )
      .classList.remove(
        "hidden"
      );

    document
      .getElementById(
        "welcomeName"
      )
      .innerText =
        profile.full_name;

    document
      .getElementById(
        "sidebarUserName"
      )
      .innerText =
        profile.full_name;

    document
      .getElementById(
        "profileData"
      )
      .innerHTML = `

        <p>
          Nombre:
          ${profile.full_name}
        </p>

        <p>
          Peso:
          ${profile.weight}
        </p>

        <p>
          Altura:
          ${profile.height}
        </p>

        <p>
          Edad:
          ${profile.age}
        </p>

        <p>
          Objetivo:
          ${profile.goal}
        </p>

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
    await supabaseClient
      .auth
      .getUser();

  const user =
    authData.data.user;


  await supabaseClient
    .from("profiles")
    .upsert({

      user_id:user.id,

      full_name:
        document.getElementById(
          "fullName"
        ).value,

      weight:
        document.getElementById(
          "weight"
        ).value,

      height:
        document.getElementById(
          "height"
        ).value,

      age:
        document.getElementById(
          "age"
        ).value,

      goal:
        document.getElementById(
          "goal"
        ).value

    });


  loadDashboard();
}



// =========================
// ADMIN SECTIONS
// =========================

function showAdminSection(id){

  document
    .querySelectorAll(
      ".adminSection"
    )
    .forEach(section=>{

      section.classList.add(
        "hidden"
      );

    });

  document
    .getElementById(id)
    .classList.remove(
      "hidden"
    );
}



// =========================
// CLIENT SECTIONS
// =========================

function showClientSection(id){

  document
    .querySelectorAll(
      ".clientSection"
    )
    .forEach(section=>{

      section.classList.add(
        "hidden"
      );

    });

  document
    .getElementById(id)
    .classList.remove(
      "hidden"
    );
}
// =========================
// GENERAR CODIGO
// =========================

async function generateCode(){

  const authData =
    await supabaseClient
      .auth
      .getUser();

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
// LOAD CODES
// =========================

async function loadCodes(){

  const authData =
    await supabaseClient
      .auth
      .getUser();

  const user =
    authData.data.user;


  const { data } =
    await supabaseClient
      .from("invite_codes")
      .select("*")
      .eq("created_by",user.id);


  const list =
    document.getElementById(
      "codesList"
    );

  list.innerHTML = "";


  data.forEach(code=>{

    list.innerHTML += `

      <div class="exerciseCard">

        <h3>${code.code}</h3>

      </div>

    `;
  });
}
