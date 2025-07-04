export function initContentModes() {
  const modeButtons = document.querySelectorAll('.mode-btn');

  modeButtons.forEach(button => {
    button.addEventListener('click', function () {
      modeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });
}
