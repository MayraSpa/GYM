/* ================================= */
/* SUPABASE */
/* ================================= */

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
/* GLOBALS */
/* ================================= */

let currentUser = null;
let currentUserData = null;

/* ================================= */
/* INIT */
/* ================================= */

window.addEventListener(
  "DOMContentLoaded",
  async ()=>{

    await checkSession();
  }
);

/* ================================= */
/* LOGIN */
/* ================================= */

async function login(){

  try{

    const email =
    document
    .getElementById("email")
    .value
    .trim();

    const password =
    document
    .getElementById("password")
    .value
    .trim();

    if(!email || !password){

      alert(
        "Completa todos los campos"
      );

      return;
    }

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

    await checkSession();

  }

  catch(error){

    console.error(error);

    alert(
      "Error iniciando sesión"
    );
  }
}

/* ================================= */
/* REGISTRO */
/* ================================= */

async function signUp(){

  try{

    const email =
    document
    .getElementById("email")
    .value
    .trim();

    const password =
    document
    .getElementById("password")
    .value
    .trim();

    const inviteCode =
    document
    .getElementById("inviteCode")
    .value
    .trim();

    if(!email || !password){

      alert(
        "Completa todos los campos"
      );

      return;
    }

    const isSuperAdmin =
    email.toLowerCase() ===
    "yeraariel0@gmail.com";

    let role = "client";

    let trainerId = null;

    let inviteData = null;

    if(!isSuperAdmin){

      const {
        data
      } =
      await supabaseClient
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode)
      .eq("used", false)
      .maybeSingle();

      inviteData = data;

      if(!inviteData){

        alert(
          "Código inválido"
        );

        return;
      }

      trainerId =
      inviteData.created_by;
    }

    else{

      role =
      "super_admin";
    }

    const {
      data,
      error
    } =
    await supabaseClient
    .auth
    .signUp({

      email,
      password
    });

    if(error){

      alert(error.message);

      return;
    }

    const user =
    data.user;

    await supabaseClient
    .from("users")
    .insert({

      id:user.id,

      email:user.email,

      role,

      trainer_id:trainerId
    });

    if(inviteData){

      await supabaseClient
      .from("invite_codes")
      .update({

        used:true

      })
      .eq("id", inviteData.id);
    }

    alert(
      "Cuenta creada"
    );

  }

  catch(error){

    console.error(error);

    alert(
      "Error creando cuenta"
    );
  }
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
/* SESSION */
/* ================================= */

async function checkSession(){

  const {
    data:{ session }
  } =
  await supabaseClient
  .auth
  .getSession();

  const authScreen =
  document.getElementById(
    "authScreen"
  );

  const appScreen =
  document.getElementById(
    "appScreen"
  );

  if(!session){

    authScreen
    ?.classList
    .remove("hidden");

    appScreen
    ?.classList
    .add("hidden");

    return;
  }

  currentUser =
  session.user;

  authScreen
  ?.classList
  .add("hidden");

  appScreen
  ?.classList
  .remove("hidden");

  await loadCurrentUser();

  await applyRoleUI();

  showSection(
    "dashboard"
  );

  await loadDashboard();

  await loadProfile(
    currentUser.id
  );
}

/* ================================= */
/* CURRENT USER */
/* ================================= */

async function loadCurrentUser(){

  const {
    data
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq(
    "id",
    currentUser.id
  )
  .maybeSingle();

  currentUserData =
  data;
}

/* ================================= */
/* ROLE UI */
/* ================================= */

async function applyRoleUI(){

  const isClient =
  currentUserData.role ===
  "client";

  document
  .getElementById(
    "clientsBtn"
  )
  ?.classList
  .toggle(
    "hidden",
    isClient
  );

  document
  .getElementById(
    "routinesBtn"
  )
  ?.classList
  .toggle(
    "hidden",
    isClient
  );

  document
  .getElementById(
    "codesBtn"
  )
  ?.classList
  .toggle(
    "hidden",
    isClient
  );

  document
  .getElementById(
    "paymentsBtn"
  )
  ?.classList
  .toggle(
    "hidden",
    isClient
  );
}

/* ================================= */
/* SIDEBAR */
/* ================================= */

function toggleSidebar(){

  document
  .getElementById(
    "sidebar"
  )
  ?.classList
  .toggle("active");
}

/* ================================= */
/* SECTIONS */
/* ================================= */

function showSection(
  section
){

  const sections = [

    "dashboardSection",
    "clientsSection",
    "routinesSection",
    "paymentsSection",
    "codesSection",
    "profileSection"
  ];

  sections.forEach(id=>{

    document
    .getElementById(id)
    ?.classList
    .add("hidden");
  });

  document
  .getElementById(
    section + "Section"
  )
  ?.classList
  .remove("hidden");

  if(
    window.innerWidth < 900
  ){

    document
    .getElementById(
      "sidebar"
    )
    ?.classList
    .remove("active");
  }
}

/* ================================= */
/* AUTH LISTENER */
/* ================================= */

supabaseClient
.auth
.onAuthStateChange(
  async ()=>{
    await checkSession();
  }
);
/* ================================= */
/* PROFILE */
/* ================================= */

async function loadProfile(userId){

  const {
    data
  } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

  const profile =
  data || {};

  const container =
  document.getElementById(
    "profileData"
  );

  if(!container) return;

  container.innerHTML = `

  <input
    id="fullName"
    placeholder="Nombre completo"
    value="${profile.full_name || ""}"
  >

  <input
    id="phone"
    placeholder="Teléfono"
    value="${profile.phone || ""}"
  >

  <input
    id="age"
    placeholder="Edad"
    value="${profile.age || ""}"
  >

  <input
    id="weight"
    placeholder="Peso"
    value="${profile.weight || ""}"
  >

  <input
    id="height"
    placeholder="Altura"
    value="${profile.height || ""}"
  >

  <input
    id="bodyFat"
    placeholder="% grasa"
    value="${profile.body_fat || ""}"
  >

  <input
    id="goal"
    placeholder="Objetivo"
    value="${profile.goal || ""}"
  >

  <textarea
    id="injuries"
    placeholder="Lesiones"
  >${profile.injuries || ""}</textarea>

  <button onclick="saveProfile()">
    Guardar perfil
  </button>

  <button onclick="deleteMyAccount()">
    Eliminar cuenta
  </button>
  `;
}

async function saveProfile(){

  await supabaseClient
  .from("profiles")
  .upsert({

    user_id:
    currentUser.id,

    full_name:
    document.getElementById("fullName").value,

    phone:
    document.getElementById("phone").value,

    age:
    document.getElementById("age").value,

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

  alert(
    "Perfil actualizado"
  );
}

/* ================================= */
/* DELETE ACCOUNT */
/* ================================= */

async function deleteMyAccount(){

  if(
    !confirm(
      "¿Eliminar cuenta?"
    )
  ){
    return;
  }

  await supabaseClient
  .from("profiles")
  .delete()
  .eq(
    "user_id",
    currentUser.id
  );

  await supabaseClient
  .from("users")
  .delete()
  .eq(
    "id",
    currentUser.id
  );

  alert(
    "Cuenta eliminada"
  );

  logout();
}

/* ================================= */
/* CLIENTS */
/* ================================= */

async function loadClientsPage(){

  if(
    currentUserData.role ===
    "client"
  ){
    return;
  }

  let query =
  supabaseClient
  .from("users")
  .select("*");

  if(
    currentUserData.role ===
    "trainer"
  ){

    query =
    query.eq(
      "trainer_id",
      currentUser.id
    );
  }

  if(
    currentUserData.role ===
    "super_admin"
  ){

    query =
    query.eq(
      "role",
      "client"
    );
  }

  const {
    data:clients
  } =
  await query;

  const container =
  document.getElementById(
    "clientsList"
  );

  if(!container) return;

  container.innerHTML = "";

  for(
    const client
    of (clients || [])
  ){

    const {
      data:profile
    } =
    await supabaseClient
    .from("profiles")
    .select("*")
    .eq(
      "user_id",
      client.id
    )
    .maybeSingle();

    container.innerHTML += `

    <div class="client-card">

      <h3>
        ${
          profile?.full_name
          || "Sin nombre"
        }
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

      ${
        currentUserData.role ===
        "super_admin"

        ?

        `<button
          onclick="makeTrainer('${client.id}')"
        >
          Hacer entrenador
        </button>`

        :

        ""
      }

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

async function deleteClient(
  clientId
){

  if(
    !confirm(
      "¿Eliminar cliente?"
    )
  ){
    return;
  }

  await supabaseClient
  .from("profiles")
  .delete()
  .eq(
    "user_id",
    clientId
  );

  await supabaseClient
  .from("users")
  .delete()
  .eq(
    "id",
    clientId
  );

  await loadClientsPage();
}

/* ================================= */
/* MAKE TRAINER */
/* ================================= */

async function makeTrainer(
  userId
){

  if(
    currentUserData.role !==
    "super_admin"
  ){

    alert(
      "Solo super admin"
    );

    return;
  }

  await supabaseClient
  .from("users")
  .update({

    role:"trainer"

  })
  .eq(
    "id",
    userId
  );

  alert(
    "Usuario ascendido"
  );

  await loadClientsPage();
}
/* ================================= */
/* GENERAR CODIGO */
/* ================================= */

async function generateCode(){

  if(
    currentUserData.role ===
    "client"
  ){

    alert(
      "No autorizado"
    );

    return;
  }

  const code =

  Math.random()
  .toString(36)
  .substring(2,8)
  .toUpperCase();

  const {
    error
  } =
  await supabaseClient
  .from("invite_codes")
  .insert({

    code,

    created_by:
    currentUser.id,

    used:false

  });

  if(error){

    alert(error.message);

    return;
  }

  await loadCodes();

  alert(
    "Código generado"
  );
}

/* ================================= */
/* LOAD CODES */
/* ================================= */

async function loadCodes(){

  if(
    currentUserData.role ===
    "client"
  ){
    return;
  }

  let query =
  supabaseClient
  .from("invite_codes")
  .select("*")
  .order(
    "id",
    {
      ascending:false
    }
  );

  if(
    currentUserData.role ===
    "trainer"
  ){

    query =
    query.eq(
      "created_by",
      currentUser.id
    );
  }

  const {
    data:codes
  } =
  await query;

  const container =
  document.getElementById(
    "codesList"
  );

  if(!container) return;

  container.innerHTML = "";

  if(
    !codes ||
    codes.length === 0
  ){

    container.innerHTML =
    "<p>No hay códigos</p>";

    return;
  }

  codes.forEach(code=>{

    container.innerHTML += `

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

      <p>
        ${new Date(
          code.created_at
        ).toLocaleDateString()}
      </p>

    </div>
    `;
  });
}

/* ================================= */
/* CLIENTES SELECT */
/* ================================= */

async function loadClientsSelect(){

  if(
    currentUserData.role ===
    "client"
  ){
    return;
  }

  let query =
  supabaseClient
  .from("users")
  .select("*");

  if(
    currentUserData.role ===
    "trainer"
  ){

    query =
    query.eq(
      "trainer_id",
      currentUser.id
    );
  }

  const {
    data:clients
  } =
  await query;

  const routineSelect =
  document.getElementById(
    "routineClient"
  );

  const paymentSelect =
  document.getElementById(
    "paymentClient"
  );

  if(routineSelect){

    routineSelect.innerHTML =

    `<option value="">
      Seleccionar cliente
    </option>`;

    clients?.forEach(client=>{

      routineSelect.innerHTML += `

      <option
        value="${client.id}"
      >

        ${client.email}

      </option>
      `;
    });
  }

  if(paymentSelect){

    paymentSelect.innerHTML =

    `<option value="">
      Seleccionar cliente
    </option>`;

    clients?.forEach(client=>{

      paymentSelect.innerHTML += `

      <option
        value="${client.id}"
      >

        ${client.email}

      </option>
      `;
    });
  }
}

/* ================================= */
/* INIT DATA */
/* ================================= */

async function loadInitialData(){

  await loadClientsPage();

  await loadClientsSelect();

  await loadCodes();
}
/* ================================= */
/* CREATE ROUTINE */
/* ================================= */

async function createRoutine(){

  if(
    currentUserData.role ===
    "client"
  ){

    alert(
      "No permitido"
    );

    return;
  }

  const clientId =
  document.getElementById(
    "routineClient"
  ).value;

  const day =
  document.getElementById(
    "routineDay"
  ).value;

  const routineName =
  document.getElementById(
    "routineName"
  ).value;

  const exercises =
  document.getElementById(
    "routineExercises"
  ).value;

  if(
    !clientId ||
    !day ||
    !routineName ||
    !exercises
  ){

    alert(
      "Completa todos los campos"
    );

    return;
  }

  const {
    error
  } =
  await supabaseClient
  .from("client_routines")
  .insert({

    trainer_id:
    currentUser.id,

    client_id:
    clientId,

    day,

    routine_name:
    routineName,

    exercises,

    completed:false

  });

  if(error){

    alert(error.message);

    return;
  }

  alert(
    "Rutina creada"
  );

  loadTrainerRoutines();
}

/* ================================= */
/* TRAINER ROUTINES */
/* ================================= */

async function loadTrainerRoutines(){

  if(
    currentUserData.role ===
    "client"
  ){
    return;
  }

  const {
    data:routines
  } =
  await supabaseClient
  .from("client_routines")
  .select("*")
  .eq(
    "trainer_id",
    currentUser.id
  )
  .order(
    "id",
    {
      ascending:false
    }
  );

  const container =
  document.getElementById(
    "routinesList"
  );

  if(!container) return;

  container.innerHTML = "";

  if(
    !routines ||
    routines.length === 0
  ){

    container.innerHTML =
    "<p>No hay rutinas</p>";

    return;
  }

  routines.forEach(routine=>{

    container.innerHTML += `

    <div class="routine-card">

      <h3>
        ${routine.routine_name}
      </h3>

      <p>
        Día:
        ${routine.day}
      </p>

      <pre>
${routine.exercises}
      </pre>

      <p>

      ${
        routine.completed
        ? "✅ Completada"
        : "⏳ Pendiente"
      }

      </p>

    </div>
    `;
  });
}

/* ================================= */
/* MY ROUTINES */
/* ================================= */

async function loadMyRoutines(){

  if(
    currentUserData.role !==
    "client"
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

  const {
    data:routines
  } =
  await supabaseClient
  .from("client_routines")
  .select("*")
  .eq(
    "client_id",
    currentUser.id
  )
  .eq(
    "day",
    today
  );

  const dashboard =
  document.getElementById(
    "dashboardContent"
  );

  if(!dashboard) return;

  dashboard.innerHTML =

  `<h2>
    Rutina de hoy
  </h2>`;

  if(
    !routines ||
    routines.length === 0
  ){

    dashboard.innerHTML +=

    `<p>
      No tienes rutina hoy
    </p>`;

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
      onclick="
      completeRoutine(
      ${routine.id}
      )">

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

async function completeRoutine(
  routineId
){

  await supabaseClient
  .from("client_routines")
  .update({

    completed:true

  })
  .eq(
    "id",
    routineId
  );

  loadMyRoutines();
}
/* ================================= */
/* CREATE PAYMENT */
/* ================================= */

async function createPayment(){

  if(
    currentUserData.role ===
    "client"
  ){

    return;
  }

  const clientId =
  document.getElementById(
    "paymentClient"
  ).value;

  const amount =
  document.getElementById(
    "monthlyAmount"
  ).value;

  const dueDate =
  document.getElementById(
    "nextDueDate"
  ).value;

  if(
    !clientId ||
    !amount ||
    !dueDate
  ){

    alert(
      "Completa todos los campos"
    );

    return;
  }

  const {
    error
  } =
  await supabaseClient
  .from("client_payments")
  .insert({

    trainer_id:
    currentUser.id,

    client_id:
    clientId,

    amount,

    due_date:
    dueDate,

    paid:false

  });

  if(error){

    alert(error.message);

    return;
  }

  alert(
    "Mensualidad creada"
  );

  loadPayments();
}

/* ================================= */
/* LOAD PAYMENTS */
/* ================================= */

async function loadPayments(){

  if(
    currentUserData.role ===
    "client"
  ){
    return;
  }

  const {
    data:payments
  } =
  await supabaseClient
  .from("client_payments")
  .select("*")
  .eq(
    "trainer_id",
    currentUser.id
  )
  .order(
    "due_date",
    {
      ascending:true
    }
  );

  const container =
  document.getElementById(
    "paymentsList"
  );

  if(!container) return;

  container.innerHTML = "";

  if(
    !payments ||
    payments.length === 0
  ){

    container.innerHTML =
    "<p>No hay pagos</p>";

    return;
  }

  payments.forEach(payment=>{

    const vencido =

    !payment.paid &&
    new Date(payment.due_date)
    <
    new Date();

    container.innerHTML += `

    <div class="client-card">

      <h3>

        $${payment.amount}

      </h3>

      <p>

        Vence:
        ${payment.due_date}

      </p>

      <p>

        ${
          payment.paid
          ? "✅ Pagado"
          : vencido
          ? "🔴 Vencido"
          : "🟡 Pendiente"
        }

      </p>

      ${
        !payment.paid

        ?

        `<button
          onclick="
          markPaymentPaid(
          ${payment.id}
          )"
        >
          Marcar pagado
        </button>`

        :

        ""
      }

    </div>
    `;
  });
}

/* ================================= */
/* MARK PAID */
/* ================================= */

async function markPaymentPaid(
  paymentId
){

  await supabaseClient
  .from("client_payments")
  .update({

    paid:true,

    paid_at:
    new Date()
    .toISOString()

  })
  .eq(
    "id",
    paymentId
  );

  loadPayments();

  loadDashboard();
}

/* ================================= */
/* CLIENT PAYMENTS */
/* ================================= */

async function loadClientPayments(){

  if(
    currentUserData.role !==
    "client"
  ){

    return;
  }

  const {
    data:payments
  } =
  await supabaseClient
  .from("client_payments")
  .select("*")
  .eq(
    "client_id",
    currentUser.id
  );

  const dashboard =
  document.getElementById(
    "dashboardContent"
  );

  if(!dashboard) return;

  payments?.forEach(payment=>{

    const vencido =

    !payment.paid &&
    new Date(payment.due_date)
    <
    new Date();

    dashboard.innerHTML += `

    <div class="routine-card">

      <h3>
        Mensualidad
      </h3>

      <p>
        Monto:
        $${payment.amount}
      </p>

      <p>
        Vence:
        ${payment.due_date}
      </p>

      <p>

      ${
        payment.paid
        ? "✅ Pagado"
        : vencido
        ? "🔴 Vencido"
        : "🟡 Pendiente"
      }

      </p>

    </div>
    `;
  });
}

/* ================================= */
/* ALERTS */
/* ================================= */

async function loadAlerts(){

  if(
    currentUserData.role ===
    "client"
  ){

    return;
  }

  const {
    data:payments
  } =
  await supabaseClient
  .from("client_payments")
  .select("*")
  .eq(
    "trainer_id",
    currentUser.id
  );

  const container =
  document.getElementById(
    "alertsContainer"
  );

  if(!container) return;

  container.innerHTML = "";

  const today =
  new Date();

  payments?.forEach(payment=>{

    const due =
    new Date(
      payment.due_date
    );

    const diff =

    Math.ceil(

      (
        due - today
      )

      /

      86400000

    );

    if(
      !payment.paid &&
      diff <= 5
    ){

      container.innerHTML += `

      <div class="routine-card">

        🔔 Pago próximo a vencer

        (${diff} días)

      </div>
      `;
    }
  });
}
/* ================================= */
/* DASHBOARD */
/* ================================= */

async function loadDashboard(){

  if(!currentUserData){
    return;
  }

  /* CLIENTE */

  if(
    currentUserData.role ===
    "client"
  ){

    await loadMyRoutines();

    await loadClientPayments();

    return;
  }

  /* ENTRENADOR / SUPER ADMIN */

  const {
    data:clients
  } =
  await supabaseClient
  .from("users")
  .select("*")
  .eq(
    "trainer_id",
    currentUser.id
  );

  const {
    data:payments
  } =
  await supabaseClient
  .from("client_payments")
  .select("*")
  .eq(
    "trainer_id",
    currentUser.id
  );

  const {
    data:routines
  } =
  await supabaseClient
  .from("client_routines")
  .select("*")
  .eq(
    "trainer_id",
    currentUser.id
  );

  let totalIncome = 0;
  let pending = 0;

  payments?.forEach(payment=>{

    if(payment.paid){

      totalIncome +=
      Number(payment.amount || 0);

    }else{

      pending++;
    }
  });

  document.getElementById(
    "incomeCard"
  ).textContent =
  "$" + totalIncome;

  document.getElementById(
    "clientsCard"
  ).textContent =
  clients?.length || 0;

  document.getElementById(
    "pendingCard"
  ).textContent =
  pending;

  document.getElementById(
    "routinesCard"
  ).textContent =
  routines?.length || 0;

  await loadAlerts();
}

/* ================================= */
/* MOBILE FIX */
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
  event=>{

    if(
      event.key === "Enter"
    ){

      const auth =
      document.getElementById(
        "authScreen"
      );

      if(
        auth &&
        !auth.classList.contains(
          "hidden"
        )
      ){

        login();
      }
    }
  }
);

/* ================================= */
/* LOAD APP DATA */
/* ================================= */

async function loadAppData(){

  await loadClientsPage();

  await loadClientsSelect();

  await loadTrainerRoutines();

  await loadPayments();

  await loadCodes();

  await loadDashboard();
}

/* ================================= */
/* FIX LOGIN SCREEN */
/* ================================= */

async function checkSession(){

  const {
    data:{session}
  } =
  await supabaseClient
  .auth
  .getSession();

  const authScreen =
  document.getElementById(
    "authScreen"
  );

  const appScreen =
  document.getElementById(
    "appScreen"
  );

  if(!session){

    authScreen.classList.remove(
      "hidden"
    );

    appScreen.classList.add(
      "hidden"
    );

    return;
  }

  currentUser =
  session.user;

  authScreen.classList.add(
    "hidden"
  );

  appScreen.classList.remove(
    "hidden"
  );

  await loadCurrentUser();

  await applyRoleUI();

  await loadProfile(
    currentUser.id
  );

  await loadAppData();

  showSection(
    "dashboard"
  );
}

/* ================================= */
/* AUTH CHANGE */
/* ================================= */

supabaseClient
.auth
.onAuthStateChange(
  async ()=>{
    await checkSession();
  }
);

/* ================================= */
/* START */
/* ================================= */

console.log(
  "GYM PRO READY"
);