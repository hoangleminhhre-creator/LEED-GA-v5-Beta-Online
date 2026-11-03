function updateUI(currentUser) {
  user = currentUser;

  var loginButton = el('login-btn');
  var logoutButton = el('logout-btn');
  var syncButton = el('sync-btn');
  var userLabel = el('sync-user');

  if (currentUser) {
    loginButton.classList.add('hidden');
    logoutButton.classList.remove('hidden');
    syncButton.disabled = false;

    var displayName =
      currentUser.displayName &&
      currentUser.displayName.trim()
        ? currentUser.displayName.trim()
        : 'Người dùng';

    var email =
      currentUser.email &&
      currentUser.email.trim()
        ? currentUser.email.trim()
        : '';

    userLabel.textContent = email
      ? displayName + ' · ' + email
      : displayName;

    userLabel.title = email;
    userLabel.classList.remove('hidden');

    status('Đã đăng nhập', 'online');
  } else {
    loginButton.classList.remove('hidden');
    logoutButton.classList.add('hidden');
    syncButton.disabled = true;

    userLabel.textContent = '';
    userLabel.title = '';
    userLabel.classList.add('hidden');

    status('Chưa đăng nhập', '');
  }
}
