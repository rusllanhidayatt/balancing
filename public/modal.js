export function openModal(src) {
  document.getElementById("modalImage").src = src;
  document.getElementById("imageModal").classList.remove("hidden");
}

export function closeModal() {
  document.getElementById("imageModal").classList.add("hidden");
}

// supaya bisa dipakai di inline onclick
window.openModal = openModal;
window.closeModal = closeModal;
