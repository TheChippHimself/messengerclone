/* ============================================
   STORAGE.JS - Data persistence layer
   Uses localStorage with profile namespacing
   ============================================ */

const Storage = (() => {

  // ===== KEYS =====
  const KEYS = {
    PROFILES: 'msng_profiles',
    ACTIVE_PROFILE: 'msng_active_profile',
    DARK_MODE: 'msng_dark_mode',
    convKey: (profileId) => `msng_convs_${profileId}`,
    msgsKey: (profileId, convId) => `msng_msgs_${profileId}_${convId}`,
  };

  // ===== HELPERS =====
  const get = (key) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  };

  const remove = (key) => {
    try { localStorage.removeItem(key); } catch {}
  };

  // ===== PROFILES =====
  const getProfiles = () => get(KEYS.PROFILES) || [];

  const saveProfile = (profile) => {
    const profiles = getProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push(profile);
    return set(KEYS.PROFILES, profiles);
  };

  const deleteProfile = (profileId) => {
    // Remove conversations and messages
    const convs = getConversations(profileId);
    convs.forEach(c => remove(KEYS.msgsKey(profileId, c.id)));
    remove(KEYS.convKey(profileId));
    // Remove profile
    const profiles = getProfiles().filter(p => p.id !== profileId);
    set(KEYS.PROFILES, profiles);
  };

  const getActiveProfile = () => {
    const id = get(KEYS.ACTIVE_PROFILE);
    if (!id) return null;
    return getProfiles().find(p => p.id === id) || null;
  };

  const setActiveProfile = (profileId) => {
    set(KEYS.ACTIVE_PROFILE, profileId);
  };

  // ===== CONVERSATIONS =====
  const getConversations = (profileId) => {
    return get(KEYS.convKey(profileId)) || [];
  };

  const saveConversation = (profileId, conv) => {
    const convs = getConversations(profileId);
    const idx = convs.findIndex(c => c.id === conv.id);
    if (idx >= 0) convs[idx] = conv;
    else convs.unshift(conv); // newest first
    return set(KEYS.convKey(profileId), convs);
  };

  const deleteConversation = (profileId, convId) => {
    const convs = getConversations(profileId).filter(c => c.id !== convId);
    set(KEYS.convKey(profileId), convs);
    remove(KEYS.msgsKey(profileId, convId));
  };

  const reorderConversation = (profileId, convId) => {
    const convs = getConversations(profileId);
    const idx = convs.findIndex(c => c.id === convId);
    if (idx > 0) {
      const [conv] = convs.splice(idx, 1);
      convs.unshift(conv);
      set(KEYS.convKey(profileId), convs);
    }
  };

  // ===== MESSAGES =====
  const getMessages = (profileId, convId) => {
    return get(KEYS.msgsKey(profileId, convId)) || [];
  };

  const saveMessages = (profileId, convId, messages) => {
    return set(KEYS.msgsKey(profileId, convId), messages);
  };

  const addMessage = (profileId, convId, message) => {
    const msgs = getMessages(profileId, convId);
    msgs.push(message);
    return saveMessages(profileId, convId, msgs);
  };

  const updateMessage = (profileId, convId, msgId, updates) => {
    const msgs = getMessages(profileId, convId);
    const idx = msgs.findIndex(m => m.id === msgId);
    if (idx >= 0) {
      msgs[idx] = { ...msgs[idx], ...updates };
      saveMessages(profileId, convId, msgs);
      return msgs[idx];
    }
    return null;
  };

  const deleteMessage = (profileId, convId, msgId) => {
    const msgs = getMessages(profileId, convId).filter(m => m.id !== msgId);
    saveMessages(profileId, convId, msgs);
  };

  // ===== DARK MODE =====
  const getDarkMode = () => get(KEYS.DARK_MODE) === true;
  const setDarkMode = (val) => set(KEYS.DARK_MODE, val);

  // ===== EXPORT / IMPORT =====
  const exportConversation = (profileId, convId) => {
    const profile = getProfiles().find(p => p.id === profileId);
    const convs = getConversations(profileId);
    const conv = convs.find(c => c.id === convId);
    const messages = getMessages(profileId, convId);
    return {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        id: profile?.id,
        name: profile?.name,
        avatar: profile?.avatar,
      },
      conversation: conv,
      messages,
    };
  };

  const importConversation = (profileId, data) => {
    if (!data || !data.conversation || !data.messages) {
      throw new Error('Invalid import format');
    }
    // Create a new conversation with a new ID to avoid collisions
    const newConvId = 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    const conv = {
      ...data.conversation,
      id: newConvId,
      importedAt: new Date().toISOString(),
    };
    saveConversation(profileId, conv);
    // Re-map message IDs
    const msgs = data.messages.map((m, i) => ({
      ...m,
      id: 'msg_' + Date.now() + '_' + i,
    }));
    saveMessages(profileId, newConvId, msgs);
    return { conv, msgs };
  };

  return {
    getProfiles,
    saveProfile,
    deleteProfile,
    getActiveProfile,
    setActiveProfile,
    getConversations,
    saveConversation,
    deleteConversation,
    reorderConversation,
    getMessages,
    saveMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    getDarkMode,
    setDarkMode,
    exportConversation,
    importConversation,
  };
})();
