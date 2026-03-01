export function initAndroidUI() {
  const app = document.getElementById('app');
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.getElementById('mobile-sidebar-toggle');
  const backdrop = document.getElementById('mobile-sidebar-backdrop');
  const menuButtons = document.querySelectorAll('.menu-btn');

  if (!app || !sidebar || !toggle || !backdrop) return;

  const closeSidebar = () => {
    app.classList.remove('mobile-sidebar-open');
    document.body.classList.remove('lock-scroll');
  };

  const openSidebar = () => {
    app.classList.add('mobile-sidebar-open');
    document.body.classList.add('lock-scroll');
  };

  toggle.addEventListener('click', () => {
    if (app.classList.contains('mobile-sidebar-open')) {
      closeSidebar();
      return;
    }
    openSidebar();
  });

  backdrop.addEventListener('click', closeSidebar);

  menuButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 900px)').matches) {
        closeSidebar();
      }
    });
  });

  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 900px)').matches) {
      closeSidebar();
    }
  });
}
