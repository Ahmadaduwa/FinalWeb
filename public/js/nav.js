
function closeMobileSidebar() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    mobileSidebar.classList.add('-translate-x-full');
  }
function openMobileSidebar() {
    const mobileSidebar = document.getElementById('mobileSidebar');
    mobileSidebar.classList.remove('-translate-x-full');
}
