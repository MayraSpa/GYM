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
// CERRAR SIDEBAR
// TOCANDO AFUERA
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
