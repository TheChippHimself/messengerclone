/* ============================================
   INDEX.JS - Profile selection page logic
   ============================================ */

(function () {
  'use strict';

  // ===== STATE =====
  let pendingAvatarData = null;

  // ===== ELEMENTS =====
  const profilesList     = document.getElementById('profilesList');
  const createProfileBtn = document.getElementById('createProfileBtn');
  const createModal      = document.getElementById('createProfileModal');
  const closeCreateBtn   = document.getElementById('closeCreateModal');
  const cancelCreateBtn  = document.getElementById('cancelCreateProfile');
  const saveCreateBtn    = document.getElementById('saveCreateProfile');
  const nameInput        = document.getElementById('createProfileName');
  const avatarInput      = document.getElementById('createAvatarInput');
  const avatarPreview    = document.getElementById('createAvatarPreview');
  const avatarImg        = document.getElementById('createAvatarImg');
  const avatarInitial    = document.getElementById('createAvatarInitial');

  // ===== INIT =====
  function init() {
    // Apply dark mode if saved
    Utils.applyDarkMode(Storage.getDarkMode());

    renderProfiles();
    bindEvents();
  }

  // ===== RENDER PROFILES =====
  function renderProfiles() {
    const profiles = Storage.getProfiles();
    profilesList.innerHTML = '';

    if (profiles.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'profiles-empty';
      empty.textContent = 'No profiles yet. Create one to get started!';
      profilesList.appendChild(empty);
      return;
    }

    profiles.forEach(profile => {
      const card = createProfileCard(profile);
      profilesList.appendChild(card);
    });
  }

  function createProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.id = profile.id;

    // Avatar
    const avatarEl = document.createElement('div');
    avatarEl.className = 'profile-card-avatar';
    if (profile.avatar) {
      const img = document.createElement('img');
      img.src = profile.avatar;
      img.alt = profile.name;
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = Utils.getInitials(profile.name);
    }

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'profile-card-name';
    nameEl.textContent = profile.name;

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'profile-card-delete';
    delBtn.innerHTML = '&times;';
    delBtn.title = 'Delete profile';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteProfile(profile);
    });

    card.appendChild(avatarEl);
    card.appendChild(nameEl);
    card.appendChild(delBtn);

    // Click to select profile
    card.addEventListener('click', () => selectProfile(profile));

    return card;
  }

  // ===== SELECT PROFILE =====
  function selectProfile(profile) {
    Storage.setActiveProfile(profile.id);
    window.location.href = 'chat.html';
  }

  // ===== DELETE PROFILE =====
  function handleDeleteProfile(profile) {
    if (!confirm(`Delete profile "${profile.name}"? This will remove all conversations.`)) return;
    Storage.deleteProfile(profile.id);
    renderProfiles();
    Utils.showToast('Profile deleted', 'info');
  }

  // ===== CREATE PROFILE MODAL =====
  function openCreateModal() {
    pendingAvatarData = null;
    nameInput.value = '';
    avatarImg.src = '';
    avatarImg.classList.add('hidden');
    avatarInitial.textContent = '?';
    avatarInitial.style.display = '';
    createModal.classList.remove('hidden');
    setTimeout(() => nameInput.focus(), 100);
  }

  function closeCreateModal() {
    createModal.classList.add('hidden');
    pendingAvatarData = null;
  }

  function saveProfile() {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      nameInput.style.borderColor = '#E53935';
      setTimeout(() => nameInput.style.borderColor = '', 1000);
      return;
    }

    const profile = {
      id: Utils.uid('profile'),
      name,
      avatar: pendingAvatarData || null,
      createdAt: new Date().toISOString(),
    };

    Storage.saveProfile(profile);
    closeCreateModal();
    renderProfiles();
    Utils.showToast(`Profile "${name}" created!`, 'success');

    // Auto-select new profile
    selectProfile(profile);
  }

  // ===== AVATAR UPLOAD =====
  async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await Utils.fileToBase64(file);
      pendingAvatarData = dataUrl;
      avatarImg.src = dataUrl;
      avatarImg.classList.remove('hidden');
      avatarInitial.style.display = 'none';
    } catch {
      Utils.showToast('Failed to load image', 'error');
    }
    e.target.value = '';
  }

  // ===== BIND EVENTS =====
  function bindEvents() {
    createProfileBtn.addEventListener('click', openCreateModal);
    closeCreateBtn.addEventListener('click', closeCreateModal);
    cancelCreateBtn.addEventListener('click', closeCreateModal);
    saveCreateBtn.addEventListener('click', saveProfile);
    avatarInput.addEventListener('change', handleAvatarUpload);

    // Make avatar preview clickable
    avatarPreview.addEventListener('click', () => avatarInput.click());

    // Enter key in name input
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveProfile();
    });

    // Close modal on backdrop click
    createModal.addEventListener('click', (e) => {
      if (e.target === createModal) closeCreateModal();
    });
  }

  // ===== BOOT =====
  document.addEventListener('DOMContentLoaded', init);

})();
