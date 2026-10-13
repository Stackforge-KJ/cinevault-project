export const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const posterHTML = (m) =>
  `<div class="poster" style="--c1:${m.c1 || "#1a2033"};--c2:${m.c2 || "#0a0d16"}"><span>${m.title}</span>${m.poster ? `<img src="${m.poster}" alt="" loading="lazy" decoding="async" onload="this.classList.add('loaded')">` : ""}</div>`;

export const cardHTML = (m) =>
  `<a class="card" href="movie.html?id=${m.id}${m.type === "tv" ? "&type=tv" : ""}">${posterHTML(m)}
     <div class="card-title">${m.title}</div>
     <div class="card-sub">${m.year} &bull; &#9733; ${m.rating}</div></a>`;

const loggedOutHTML = `<a class="btn btn-ghost btn-sm" href="login.html">Log in</a><a class="btn btn-primary btn-sm" href="signup.html">Sign up</a>`;

export const avatarHTML = (u, cls = "avatar-sm") =>
  `<span class="${cls}">${u.photoURL ? `<img src="${esc(u.photoURL)}" alt="">` : esc(u.username.slice(0, 2).toUpperCase())}</span>`;

function drawAuthSlot(user) {
  const slot = document.getElementById("auth-slot");
  if (!user) { slot.innerHTML = loggedOutHTML; return; }
  slot.innerHTML = `${user.isSubscribed ? "" : '<a class="btn btn-primary btn-sm" href="plans.html">Subscribe</a>'}
    <details class="user-menu">
      <summary aria-label="Account menu">${avatarHTML(user)}</summary>
      <div class="menu">
        <div class="menu-name">${esc(user.username)}</div>
        <a href="profile.html">My profile</a>
        <a href="wishlist.html">My list</a>
        <a href="playlists.html">My playlists</a>${user.role === "admin" ? '<a href="admin.html">Admin dashboard</a>' : ""}
        <button id="logout" type="button">Log out</button>
      </div>
    </details>`;
  document.getElementById("logout").addEventListener("click", async () => {
    const { logout } = await import("./auth.js");
    await logout();
    location.href = "index.html";
  });
}

// Header is shared by every page. The right-hand slot follows the login state.
export function renderHeader(active = "Home") {
  const links = [["Home", "index.html"], ["Movies", "movies.html"], ["TV Shows", "tv.html"], ["Categories", "categories.html"]];
  document.getElementById("site-header").innerHTML = `
    <a class="logo" href="index.html">Cine<span>Vault</span></a>
    <nav class="nav" aria-label="Main">${links.map(([t, h]) => `<a href="${h}"${t === active ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
    <form class="search" role="search"><input type="search" placeholder="Search movies, genres, actors..." aria-label="Search"></form>
    <div class="auth-slot" id="auth-slot"></div>`;
  Promise.all([import("./firebase.js"), import("./auth.js")])
    .then(([{ configured }, { watchUser }]) => (configured ? watchUser(drawAuthSlot) : drawAuthSlot(null)))
    .catch((e) => { console.warn(e); drawAuthSlot(null); });
}

// Shimmering placeholder cards shown while data is loading
export const skeletonCards = (n = 8) =>
  Array.from({ length: n }, () => `<div class="card" aria-hidden="true"><div class="poster sk"></div><div class="sk sk-line" style="margin-top:.5rem"></div><div class="sk sk-line short"></div></div>`).join("");
