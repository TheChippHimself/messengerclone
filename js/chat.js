/* ============================================
   CHAT.JS - Main messenger chat page logic
   ============================================ */

(function () {
  'use strict';

  // ===== STATE =====
  let activeProfile = null;
  let activeConvId  = null;
  let allConvs      = [];
  let pendingImage  = null; // { dataUrl, filename }
  let contextTarget = null; // { profileId, convId, msgId }
  let isMobile      = window.innerWidth <= 768;

  // ===== DOM REFS =====
  const sidebar            = document.getElementById('sidebar');
  const sidebarAvatar      = document.getElementById('sidebarAvatar');
  const sidebarUsername    = document.getElementById('sidebarUsername');
  const newChatBtn         = document.getElementById('newChatBtn');
  const logoutBtn          = document.getElementById('logoutBtn');
  const searchChats        = document.getElementById('searchChats');
  const convsList          = document.getElementById('conversationsList');
  const emptyConvs         = document.getElementById('emptyConversations');
  const startFirstChat     = document.getElementById('startFirstChat');

  const chatEmptyState     = document.getElementById('chatEmptyState');
  const chatWindow         = document.getElementById('chatWindow');
  const emptyNewChat       = document.getElementById('emptyNewChat');

  const chatHeaderAvatar   = document.getElementById('chatHeaderAvatar');
  const chatHeaderName     = document.getElementById('chatHeaderName');
  const messagesArea       = document.getElementById('messagesArea');
  const messagesInner      = document.getElementById('messagesInner');

  const messageInput       = document.getElementById('messageInput');
  const sendBtn            = document.getElementById('sendBtn');
  const imageUploadInput   = document.getElementById('imageUploadInput');
  const imagePreviewBar    = document.getElementById('imagePreviewBar');
  const previewImg         = document.getElementById('previewImg');
  const previewFilename    = document.getElementById('previewFilename');
  const removePreview      = document.getElementById('removePreview');

  const backBtn            = document.getElementById('backBtn');
  const exportChatBtn      = document.getElementById('exportChatBtn');
  const importChatBtn      = document.getElementById('importChatBtn');
  const importFileInput    = document.getElementById('importFileInput');
  const darkModeBtn        = document.getElementById('darkModeBtn');

  const newChatModal       = document.getElementById('newChatModal');
  const closeNewChatModal  = document.getElementById('closeNewChatModal');
  const cancelNewChat      = document.getElementById('cancelNewChat');
  const saveNewChatBtn     = document.getElementById('saveNewChat');
  const chatPersonName     = document.getElementById('chatPersonName');
  const chatAvatarInput    = document.getElementById('chatAvatarInput');
  const chatAvatarPreview  = document.getElementById('chatAvatarPreview');
  const chatAvatarImg      = document.getElementById('chatAvatarImg');
  const chatAvatarInitial  = document.getElementById('chatAvatarInitial');

  const imageZoomModal     = document.getElementById('imageZoomModal');
  const zoomedImage        = document.getElementById('zoomedImage');
  const zoomClose          = document.getElementById('zoomClose');

  const contextMenu        = document.getElementById('contextMenu');
  const ctxDelete          = document.getElementById('ctxDelete');

  // ===== INIT =====
  function init() {
    activeProfile = Storage.getActiveProfile();
    if (!activeProfile) {
      window.location.href = 'index.html';
      return;
    }

    // Apply dark mode
    const isDark = Storage.getDarkMode();
    Utils.applyDarkMode(isDark);

    // Render sidebar profile
    Utils.renderAvatar(sidebarAvatar, activeProfile.name, activeProfile.avatar, 'small');
    sidebarUsername.textContent = activeProfile.name;

    // Load conversations
    allConvs = Storage.getConversations(activeProfile.id);
    renderConversationsList(allConvs);

    bindEvents();
    setupDragDrop();

    // Auto-open first conversation on desktop
    if (!isMobile && allConvs.length > 0) {
      openConversation(allConvs[0].id);
    }
  }

  // ===================================================================
  //  CONVERSATIONS LIST
  // ===================================================================

  function renderConversationsList(convs) {
    // Remove existing items (keep emptyConvs)
    Array.from(convsList.querySelectorAll('.conversation-item')).forEach(el => el.remove());

    if (convs.length === 0) {
      emptyConvs.style.display = '';
      return;
    }
    emptyConvs.style.display = 'none';

    convs.forEach(conv => {
      const item = createConvItem(conv);
      convsList.appendChild(item);
    });
  }

  function createConvItem(conv) {
    const item = document.createElement('div');
    item.className = 'conversation-item';
    item.dataset.convId = conv.id;
    if (conv.id === activeConvId) item.classList.add('active');

    // Avatar wrapper
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'conv-avatar';
    const avatarEl = document.createElement('div');
    avatarEl.className = 'user-avatar medium';
    if (conv.avatar) {
      const img = document.createElement('img');
      img.src = conv.avatar;
      img.alt = conv.name;
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = Utils.getInitials(conv.name);
    }
    const onlineDot = document.createElement('div');
    onlineDot.className = 'conv-online-dot';
    avatarWrap.appendChild(avatarEl);
    avatarWrap.appendChild(onlineDot);

    // Info
    const info = document.createElement('div');
    info.className = 'conv-info';
    const nameEl = document.createElement('div');
    nameEl.className = 'conv-name';
    nameEl.textContent = conv.name;
    const preview = document.createElement('div');
    preview.className = 'conv-preview';
    preview.textContent = conv.lastMessage || 'Start a conversation';
    info.appendChild(nameEl);
    info.appendChild(preview);

    // Meta
    const meta = document.createElement('div');
    meta.className = 'conv-meta';
    const timeEl = document.createElement('div');
    timeEl.className = 'conv-time';
    timeEl.textContent = conv.lastTime ? Utils.formatTime(conv.lastTime) : '';
    meta.appendChild(timeEl);

    item.appendChild(avatarWrap);
    item.appendChild(info);
    item.appendChild(meta);

    item.addEventListener('click', () => openConversation(conv.id));
    return item;
  }

  function updateConvItemPreview(convId, text, time) {
    const item = convsList.querySelector(`[data-conv-id="${convId}"]`);
    if (!item) return;
    const preview = item.querySelector('.conv-preview');
    const timeEl = item.querySelector('.conv-time');
    if (preview) preview.textContent = Utils.truncate(text, 35);
    if (timeEl) timeEl.textContent = Utils.formatTime(time);
  }

  // ===================================================================
  //  OPEN CONVERSATION
  // ===================================================================

  function openConversation(convId) {
    activeConvId = convId;

    // Update active state in sidebar
    document.querySelectorAll('.conversation-item').forEach(el => {
      el.classList.toggle('active', el.dataset.convId === convId);
    });

    const conv = allConvs.find(c => c.id === convId);
    if (!conv) return;

    // Update header
    chatHeaderName.textContent = conv.name;
    chatHeaderAvatar.innerHTML = '';
    if (conv.avatar) {
      const img = document.createElement('img');
      img.src = conv.avatar;
      img.alt = conv.name;
      chatHeaderAvatar.appendChild(img);
    } else {
      chatHeaderAvatar.textContent = Utils.getInitials(conv.name);
    }

    // Show chat window
    chatEmptyState.classList.add('hidden');
    chatWindow.classList.remove('hidden');

    // On mobile: hide sidebar
    if (isMobile) {
      sidebar.classList.add('hidden-mobile');
    }

    // Render messages
    renderMessages(convId);
    scrollToBottom(true);
    messageInput.focus();
  }

  // ===================================================================
  //  MESSAGES RENDERING
  // ===================================================================

  function renderMessages(convId) {
    const messages = Storage.getMessages(activeProfile.id, convId);
    messagesInner.innerHTML = '';

    if (messages.length === 0) return;

    const conv = allConvs.find(c => c.id === convId);
    let lastDate = null;
    let currentGroup = null;
    let lastSender = null;

    messages.forEach((msg, idx) => {
      const isLast = idx === messages.length - 1;

      // Date separator
      if (!lastDate || !Utils.isSameDay(lastDate, msg.timestamp)) {
        lastDate = msg.timestamp;
        const sep = document.createElement('div');
        sep.className = 'date-separator';
        sep.innerHTML = `<span>${Utils.formatDateHeader(msg.timestamp)}</span>`;
        messagesInner.appendChild(sep);
        currentGroup = null;
        lastSender = null;
      }

      // Group by sender (consecutive messages)
      const isSender = msg.sender === 'me';
      if (!currentGroup || lastSender !== msg.sender) {
        currentGroup = document.createElement('div');
        currentGroup.className = `msg-group ${isSender ? 'sender' : 'receiver'}`;
        messagesInner.appendChild(currentGroup);
      }
      lastSender = msg.sender;

      // Render message row
      const row = createMessageRow(msg, conv, isLast, messages, idx);
      currentGroup.appendChild(row);
    });

    // Seen status for last sent message
    const lastSentMsg = [...messages].reverse().find(m => m.sender === 'me');
    if (lastSentMsg && lastSentMsg.seen) {
      appendSeenStatus(conv);
    }
  }

  function createMessageRow(msg, conv, isLast, allMsgs, idx) {
    const isSender = msg.sender === 'me';
    const row = document.createElement('div');
    row.className = 'msg-row';
    row.dataset.msgId = msg.id;

    // Receiver avatar (only for last in group)
    if (!isSender) {
      const nextMsg = allMsgs[idx + 1];
      const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;
      const avatarEl = document.createElement('div');
      avatarEl.className = 'msg-avatar' + (isLastInGroup ? '' : ' hidden-avatar');
      if (conv.avatar) {
        const img = document.createElement('img');
        img.src = conv.avatar;
        img.alt = conv.name;
        avatarEl.appendChild(img);
      } else {
        avatarEl.textContent = Utils.getInitials(conv.name);
      }
      row.appendChild(avatarEl);
    }

    // Bubble
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.dataset.msgId = msg.id;

    if (msg.type === 'image') {
      bubble.classList.add('msg-image');
      const img = document.createElement('img');
      img.src = msg.content;
      img.alt = 'Image';
      img.loading = 'lazy';
      img.addEventListener('click', () => openImageZoom(msg.content));
      bubble.appendChild(img);
    } else {
      bubble.textContent = msg.content;
    }

    // Reaction
    if (msg.reaction) {
      const reactionEl = document.createElement('div');
      reactionEl.className = 'msg-reaction';
      reactionEl.textContent = msg.reaction;
      bubble.appendChild(reactionEl);
    }

    // Context menu on right-click
    bubble.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, msg.id);
    });

    row.appendChild(bubble);
    return row;
  }

  function appendSeenStatus(conv) {
    const seenEl = document.createElement('div');
    seenEl.className = 'seen-status';
    seenEl.id = 'seenStatus';

    const avatarEl = document.createElement('div');
    avatarEl.className = 'seen-avatar';
    if (conv.avatar) {
      const img = document.createElement('img');
      img.src = conv.avatar;
      img.alt = conv.name;
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = Utils.getInitials(conv.name);
    }

    seenEl.appendChild(avatarEl);
    seenEl.appendChild(document.createTextNode('Seen'));
    messagesInner.appendChild(seenEl);
  }

  // ===================================================================
  //  SEND MESSAGE
  // ===================================================================

  function sendMessage() {
    if (!activeConvId) return;

    const text = messageInput.value.trim();
    const hasText = text.length > 0;
    const hasImage = pendingImage !== null;

    if (!hasText && !hasImage) return;

    const now = new Date().toISOString();

    // Send image if pending
    if (hasImage) {
      const imgMsg = {
        id: Utils.uid('msg'),
        type: 'image',
        content: pendingImage.dataUrl,
        sender: 'me',
        timestamp: now,
        seen: false,
        reaction: null,
      };
      saveAndDisplayMessage(imgMsg);
      clearImagePreview();
    }

    // Send text
    if (hasText) {
      const textMsg = {
        id: Utils.uid('msg'),
        type: 'text',
        content: text,
        sender: 'me',
        timestamp: now,
        seen: false,
        reaction: null,
      };
      saveAndDisplayMessage(textMsg);
      messageInput.value = '';
      autoResizeTextarea();
    }

    scrollToBottom(true);
    messageInput.focus();
  }

  function saveAndDisplayMessage(msg) {
    // Save
    Storage.addMessage(activeProfile.id, activeConvId, msg);

    // Update conversation preview
    const conv = allConvs.find(c => c.id === activeConvId);
    const preview = msg.type === 'image' ? '📷 Photo' : msg.content;
    conv.lastMessage = preview;
    conv.lastTime = msg.timestamp;
    Storage.saveConversation(activeProfile.id, conv);
    Storage.reorderConversation(activeProfile.id, activeConvId);

    // Refresh conversations list
    allConvs = Storage.getConversations(activeProfile.id);
    renderConversationsList(allConvs);

    // Add bubble to DOM
    appendMessageToDOM(msg, conv);

    // Remove previous seen status
    const oldSeen = document.getElementById('seenStatus');
    if (oldSeen) oldSeen.remove();

    // Simulate seen + reaction after delay
    simulateReceipt(msg.id);
  }

  function appendMessageToDOM(msg, conv) {
    const isSender = msg.sender === 'me';

    // Check if we need a new group or date sep
    const allMsgs = Storage.getMessages(activeProfile.id, activeConvId);
    const msgIndex = allMsgs.findIndex(m => m.id === msg.id);
    const prevMsg = allMsgs[msgIndex - 1];

    // Date separator if needed
    if (!prevMsg || !Utils.isSameDay(prevMsg.timestamp, msg.timestamp)) {
      const sep = document.createElement('div');
      sep.className = 'date-separator';
      sep.innerHTML = `<span>${Utils.formatDateHeader(msg.timestamp)}</span>`;
      messagesInner.appendChild(sep);
    }

    // Find or create group
    let group = messagesInner.lastElementChild;
    const needsNewGroup = !group ||
      !group.classList.contains('msg-group') ||
      (isSender && !group.classList.contains('sender')) ||
      (!isSender && !group.classList.contains('receiver'));

    if (needsNewGroup) {
      group = document.createElement('div');
      group.className = `msg-group ${isSender ? 'sender' : 'receiver'}`;
      messagesInner.appendChild(group);
    }

    const row = createMessageRow(msg, conv, true, allMsgs, msgIndex);
    group.appendChild(row);
  }

  // ===================================================================
  //  SIMULATE RECEIPT (Seen + Reaction)
  // ===================================================================

  function simulateReceipt(msgId) {
    // Mark as seen after 1.5s
    setTimeout(() => {
      Storage.updateMessage(activeProfile.id, activeConvId, msgId, { seen: true });

      // Only show seen if this is still the active conv and msg is last
      if (activeConvId) {
        const msgs = Storage.getMessages(activeProfile.id, activeConvId);
        const last = [...msgs].reverse().find(m => m.sender === 'me');
        if (last && last.id === msgId) {
          const oldSeen = document.getElementById('seenStatus');
          if (oldSeen) oldSeen.remove();
          const conv = allConvs.find(c => c.id === activeConvId);
          if (conv) appendSeenStatus(conv);
          scrollToBottom(false);
        }
      }
    }, 1500);

    // Add reaction after 2.5s
    setTimeout(() => {
      Storage.updateMessage(activeProfile.id, activeConvId, msgId, { reaction: '🫀' });

      // Add reaction to DOM bubble
      const bubble = messagesInner.querySelector(`[data-msg-id="${msgId}"].msg-bubble`);
      if (bubble && !bubble.querySelector('.msg-reaction')) {
        const reactionEl = document.createElement('div');
        reactionEl.className = 'msg-reaction';
        reactionEl.textContent = '🫀';
        bubble.appendChild(reactionEl);
        scrollToBottom(false);
      }
    }, 2500);
  }

  // ===================================================================
  //  NEW CHAT MODAL
  // ===================================================================

  let pendingChatAvatar = null;

  function openNewChatModal() {
    pendingChatAvatar = null;
    chatPersonName.value = '';
    chatAvatarImg.src = '';
    chatAvatarImg.classList.add('hidden');
    chatAvatarInitial.textContent = '?';
    chatAvatarInitial.style.display = '';
    newChatModal.classList.remove('hidden');
    setTimeout(() => chatPersonName.focus(), 100);
  }

  function closeNewChatModalFn() {
    newChatModal.classList.add('hidden');
    pendingChatAvatar = null;
  }

  function saveNewConversation() {
    const name = chatPersonName.value.trim();
    if (!name) {
      chatPersonName.focus();
      chatPersonName.style.borderColor = '#E53935';
      setTimeout(() => chatPersonName.style.borderColor = '', 1000);
      return;
    }

    const conv = {
      id: Utils.uid('conv'),
      name,
      avatar: pendingChatAvatar || null,
      lastMessage: '',
      lastTime: null,
      createdAt: new Date().toISOString(),
    };

    Storage.saveConversation(activeProfile.id, conv);
    allConvs = Storage.getConversations(activeProfile.id);
    renderConversationsList(allConvs);
    closeNewChatModalFn();
    openConversation(conv.id);
    Utils.showToast(`Chat with ${name} created!`, 'success');
  }

  // ===================================================================
  //  IMAGE UPLOAD
  // ===================================================================

  async function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      Utils.showToast('Please select an image file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      Utils.showToast('Image must be under 10MB', 'error');
      return;
    }

    try {
      const dataUrl = await Utils.fileToBase64(file);
      pendingImage = { dataUrl, filename: file.name };
      previewImg.src = dataUrl;
      previewFilename.textContent = file.name;
      imagePreviewBar.classList.remove('hidden');
      messageInput.focus();
    } catch {
      Utils.showToast('Failed to load image', 'error');
    }
  }

  function clearImagePreview() {
    pendingImage = null;
    imagePreviewBar.classList.add('hidden');
    previewImg.src = '';
    imageUploadInput.value = '';
  }

  // ===================================================================
  //  EXPORT / IMPORT
  // ===================================================================

  function exportChat() {
    if (!activeConvId) {
      Utils.showToast('Open a conversation first', 'info');
      return;
    }
    const data = Storage.exportConversation(activeProfile.id, activeConvId);
    const conv = allConvs.find(c => c.id === activeConvId);
    const filename = `messenger_${(conv?.name || 'chat').replace(/\s+/g, '_')}_${Date.now()}.json`;
    Utils.downloadJSON(data, filename);
    Utils.showToast('Chat exported!', 'success');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const { conv } = Storage.importConversation(activeProfile.id, data);
        allConvs = Storage.getConversations(activeProfile.id);
        renderConversationsList(allConvs);
        openConversation(conv.id);
        Utils.showToast('Chat imported successfully!', 'success');
      } catch (err) {
        Utils.showToast('Invalid file format', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ===================================================================
  //  IMAGE ZOOM
  // ===================================================================

  function openImageZoom(src) {
    zoomedImage.src = src;
    imageZoomModal.classList.remove('hidden');
  }

  function closeImageZoom() {
    imageZoomModal.classList.add('hidden');
    zoomedImage.src = '';
  }

  // ===================================================================
  //  CONTEXT MENU
  // ===================================================================

  function showContextMenu(x, y, msgId) {
    contextTarget = { profileId: activeProfile.id, convId: activeConvId, msgId };
    contextMenu.style.left = Math.min(x, window.innerWidth - 180) + 'px';
    contextMenu.style.top = Math.min(y, window.innerHeight - 80) + 'px';
    contextMenu.classList.remove('hidden');
  }

  function hideContextMenu() {
    contextMenu.classList.add('hidden');
    contextTarget = null;
  }

  function deleteMessage() {
    if (!contextTarget) return;
    Storage.deleteMessage(contextTarget.profileId, contextTarget.convId, contextTarget.msgId);
    hideContextMenu();
    renderMessages(activeConvId);
    scrollToBottom(false);
    Utils.showToast('Message deleted', 'info');
  }

  // ===================================================================
  //  SEARCH
  // ===================================================================

  function handleSearch(e) {
    const q = e.target.value.toLowerCase().trim();
    const all = Storage.getConversations(activeProfile.id);
    const filtered = q ? all.filter(c => c.name.toLowerCase().includes(q)) : all;
    allConvs = filtered;
    renderConversationsList(filtered);
  }

  // ===================================================================
  //  SCROLL
  // ===================================================================

  function scrollToBottom(instant = false) {
    requestAnimationFrame(() => {
      messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior: instant ? 'instant' : 'smooth',
      });
    });
  }

  // ===================================================================
  //  TEXTAREA AUTO-RESIZE
  // ===================================================================

  function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    const maxH = 120;
    const newH = Math.min(messageInput.scrollHeight, maxH);
    messageInput.style.height = newH + 'px';
  }

  // ===================================================================
  //  DARK MODE
  // ===================================================================

  function toggleDarkMode() {
    const isDark = !document.body.classList.contains('dark');
    Utils.applyDarkMode(isDark);
    Storage.setDarkMode(isDark);
  }

  // ===================================================================
  //  DRAG AND DROP
  // ===================================================================

  function setupDragDrop() {
    const main = document.querySelector('.chat-main');
    if (!main) return;

    main.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (activeConvId) main.classList.add('drag-over');
    });

    main.addEventListener('dragleave', () => {
      main.classList.remove('drag-over');
    });

    main.addEventListener('drop', async (e) => {
      e.preventDefault();
      main.classList.remove('drag-over');
      if (!activeConvId) return;
      const file = e.dataTransfer.files[0];
      if (file) await handleImageUpload(file);
    });
  }

  // ===================================================================
  //  BIND EVENTS
  // ===================================================================

  function bindEvents() {
    // Sidebar actions
    newChatBtn.addEventListener('click', openNewChatModal);
    startFirstChat.addEventListener('click', openNewChatModal);
    emptyNewChat.addEventListener('click', openNewChatModal);
    logoutBtn.addEventListener('click', () => {
      Storage.setActiveProfile(null);
      window.location.href = 'index.html';
    });

    // Search
    searchChats.addEventListener('input', handleSearch);

    // New chat modal
    closeNewChatModal.addEventListener('click', closeNewChatModalFn);
    cancelNewChat.addEventListener('click', closeNewChatModalFn);
    saveNewChatBtn.addEventListener('click', saveNewConversation);
    chatPersonName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveNewConversation();
    });
    newChatModal.addEventListener('click', (e) => {
      if (e.target === newChatModal) closeNewChatModalFn();
    });

    // Chat avatar in new chat modal
    chatAvatarInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await Utils.fileToBase64(file);
        pendingChatAvatar = dataUrl;
        chatAvatarImg.src = dataUrl;
        chatAvatarImg.classList.remove('hidden');
        chatAvatarInitial.style.display = 'none';
      } catch { Utils.showToast('Failed to load image', 'error'); }
      e.target.value = '';
    });
    chatAvatarPreview.addEventListener('click', () => chatAvatarInput.click());

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    messageInput.addEventListener('input', autoResizeTextarea);

    // Image upload
    imageUploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) await handleImageUpload(file);
      e.target.value = '';
    });
    removePreview.addEventListener('click', clearImagePreview);

    // Back button (mobile)
    backBtn.addEventListener('click', () => {
      sidebar.classList.remove('hidden-mobile');
      chatEmptyState.classList.remove('hidden');
      chatWindow.classList.add('hidden');
      activeConvId = null;
      document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
    });

    // Export / import
    exportChatBtn.addEventListener('click', exportChat);
    importChatBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImportFile);

    // Dark mode
    darkModeBtn.addEventListener('click', toggleDarkMode);

    // Image zoom
    zoomClose.addEventListener('click', closeImageZoom);
    imageZoomModal.addEventListener('click', (e) => {
      if (e.target === imageZoomModal || e.target === document.querySelector('.image-zoom-container')) {
        closeImageZoom();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeImageZoom();
        hideContextMenu();
        closeNewChatModalFn();
      }
    });

    // Context menu
    ctxDelete.addEventListener('click', deleteMessage);
    document.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target)) hideContextMenu();
    });

    // Paste image
    messageInput.addEventListener('paste', async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) await handleImageUpload(file);
          break;
        }
      }
    });

    // Resize
    window.addEventListener('resize', () => {
      isMobile = window.innerWidth <= 768;
      if (!isMobile) {
        sidebar.classList.remove('hidden-mobile');
      }
    });
  }

  // ===================================================================
  //  BOOT
  // ===================================================================

  document.addEventListener('DOMContentLoaded', init);

})();
