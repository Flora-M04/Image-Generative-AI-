/* =====================================================
   IMAGE GENERATIVE AI — Auth Helper
   ===================================================== */

const AUTH_SESSION_KEY = 'iga_session';
const AUTH_USERS_KEY   = 'iga_users';

function _getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]'); }
  catch { return []; }
}

function _saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function authSignup(name, email, password) {
  if (!name || !email || !password)
    return { success: false, message: 'All fields are required.' };

  const users = _getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return { success: false, message: 'An account with this email already exists.' };

  const user = {
    id:        'u_' + Date.now(),
    name:      name.trim(),
    email:     email.toLowerCase().trim(),
    password:  password,
    plan:      'free',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  _saveUsers(users);
  return { success: true };
}

function authLogin(email, password) {
  if (!email || !password)
    return { success: false, message: 'Email and password are required.' };

  const users = _getUsers();
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
  );
  if (!user)
    return { success: false, message: 'Incorrect email or password. Please try again.' };

  const session = {
    userId:  user.id,
    name:    user.name,
    email:   user.email,
    plan:    user.plan,
    loginAt: new Date().toISOString(),
  };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return { success: true };
}

function authLogout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  window.location.href = 'login.html';
}

function authGetSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null'); }
  catch { return null; }
}

function authIsLoggedIn() {
  return authGetSession() !== null;
}

function authRequire() {
  if (!authIsLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function authRedirectIfLoggedIn() {
  if (authIsLoggedIn()) window.location.href = 'query.html';
}
