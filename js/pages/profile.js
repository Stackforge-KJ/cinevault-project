import { renderHeader, avatarHTML, esc } from "../ui.js";
import { configured } from "../firebase.js";
import { requireAuth, updateAccount, friendly } from "../auth.js";
import { getWishlist } from "../store.js";

renderHeader("");
const main = document.getElementById("main");

if (!configured) {
  main.innerHTML = `<p class="msg">Firebase is not set up yet. Paste your config into js/firebase-config.js.</p>`;
} else {
  let user = await requireAuth();

  const draw = () => {
    main.innerHTML = `
      <section class="profile-head">
        ${avatarHTML(user, "avatar-lg")}
        <div>
          <h1 style="font-size:1.75rem">${esc(user.username)}</h1>
          <p class="hint">${esc(user.email)}</p>
          <span class="badge${user.isSubscribed ? " on" : ""}">${user.isSubscribed ? "Subscriber" : "Free account"}</span>
        </div>
        <div class="stats"><div class="stat"><strong id="count">-</strong><span>In your list</span></div></div>
      </section>
      <form class="edit-card" id="form" novalidate>
        <h2>Edit profile</h2>
        <div class="fg"><label for="username">Username</label>
          <input id="username" name="username" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" value="${esc(user.username)}"></div>
        <div class="fg"><label for="photo">Profile picture</label>
          <input id="photo" name="photo" type="file" accept="image/*"><small>JPG or PNG, up to 2 MB.</small></div>
        <p class="error" id="msg" role="alert"></p>
        <button class="btn btn-primary" id="save" type="submit">Save changes</button>
      </form>`;
    getWishlist(user.uid).then((l) => (document.getElementById("count").textContent = l.length)).catch(() => {});

    const form = document.getElementById("form"), msg = document.getElementById("msg"), save = document.getElementById("save");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.style.color = "";
      msg.textContent = "";
      if (!form.checkValidity()) { msg.textContent = "Username: 3 to 20 letters, numbers or underscores."; return; }
      const photo = form.photo.files[0];
      if (photo && photo.size > 2 * 1024 * 1024) { msg.textContent = "Choose a picture under 2 MB."; return; }
      save.disabled = true;
      save.textContent = "Saving...";
      try {
        user = await updateAccount(user, { username: form.username.value.trim(), photo });
        renderHeader("");
        draw();
        const m = document.getElementById("msg");
        m.style.color = "var(--muted)";
        m.textContent = "Saved.";
      } catch (err) {
        console.error(err);
        msg.textContent = friendly(err);
        save.disabled = false;
        save.textContent = "Save changes";
      }
    });
  };
  draw();
}
