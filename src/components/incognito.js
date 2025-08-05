export function initIncognitoMode() {
  const incognitoToggle = document.getElementById('incognito-toggle');
  const incognitoButton = document.getElementById('incognito-mode');

  incognitoToggle.addEventListener('change', function () {
    incognitoButton.style.backgroundColor = this.checked ? 'var(--accent)' : '';
  });

  incognitoButton.addEventListener('click', function () {
    incognitoToggle.checked = !incognitoToggle.checked;
    this.style.backgroundColor = incognitoToggle.checked ? 'var(--accent)' : '';
  });
}
