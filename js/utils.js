/* ============================================
   UTILS.JS - Shared utility functions
   ============================================ */

const Utils = (() => {

  // ===== ID GENERATION =====
  const uid = (prefix = 'id') =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // ===== TIMESTAMP FORMATTING =====
  const formatTime = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      // Today: show time
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'long' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatFullTime = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const isSameDay = (a, b) => {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() &&
           da.getMonth() === db.getMonth() &&
           da.getDate() === db.getDate();
  };

  // ===== AVATAR =====
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderAvatar = (el, name, avatarDataUrl, sizeClass = 'medium') => {
    if (!el) return;
    el.className = `user-avatar ${sizeClass}`;
    el.innerHTML = '';
    if (avatarDataUrl) {
      const img = document.createElement('img');
      img.src = avatarDataUrl;
      img.alt = name;
      el.appendChild(img);
    } else {
      el.textContent = getInitials(name);
    }
  };

  // ===== FILE TO BASE64 =====
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // ===== ESCAPE HTML =====
  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // ===== DOWNLOAD FILE =====
  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===== DARK MODE =====
  const applyDarkMode = (isDark) => {
    document.body.classList.toggle('dark', isDark);
  };

  // ===== TOAST NOTIFICATION =====
  const showToast = (message, type = 'info', duration = 3000) => {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(0);
      background: ${type === 'error' ? '#E53935' : type === 'success' ? '#2E7D32' : '#323232'};
      color: white;
      padding: 10px 20px;
      border-radius: 24px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      animation: slideUp 0.25s ease;
      white-space: nowrap;
      max-width: 90vw;
      text-align: center;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(8px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ===== TRUNCATE =====
  const truncate = (str, len = 40) => {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
  };

  return {
    uid,
    formatTime,
    formatFullTime,
    formatDateHeader,
    isSameDay,
    getInitials,
    renderAvatar,
    fileToBase64,
    escapeHtml,
    downloadJSON,
    applyDarkMode,
    showToast,
    truncate,
  };
})();
