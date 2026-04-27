import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from './useAuthStore';

const getUserId = () => useAuthStore.getState().user?.id;

export const useAppStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────
  simpleTasks: [],      // Tasks with folder_id = null
  folders: [],          // All folders for current user (owned + shared)
  groupedTasks: [],     // Tasks inside folders
  importantDates: [],   // Calendar important dates
  loading: false,
  showCreatedDates: false, // UI Preference
  myTasks: [],          // Tasks assigned to current user
  folderMembers: {},    // Map of folderId -> members array
  toggleCreatedDates: () => set(s => ({ showCreatedDates: !s.showCreatedDates })),
  
  // ── REALTIME SYNC ───────────────────────────────────
  subscription: null,
  subscribeToChanges: () => {
    const userId = getUserId();
    if (!userId) return;
    if (get().subscription) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, () => {
        get().fetchFolders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        get().fetchSimpleTasks();
        get().fetchGroupedTasks();
        get().fetchMyTasks();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'important_dates' }, () => {
        get().fetchImportantDates();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folder_members' }, () => {
        get().fetchFolders();
      })
      .subscribe();

    set({ subscription: channel });
  },
  unsubscribe: () => {
    if (get().subscription) {
      supabase.removeChannel(get().subscription);
      set({ subscription: null });
    }
  },
  // ── AUTO COLOR ───────────────────────────────────────
  SOFT_COLORS: ['blue', 'green', 'yellow', 'red', 'purple'],
  getRandomColor: () => ['blue', 'green', 'yellow', 'red', 'purple'][Math.floor(Math.random() * 5)],
  
  // ── SIMPLE TASKS (Page 1) ────────────────────────────
  fetchSimpleTasks: async () => {
    const userId = getUserId();
    if (!userId) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', userId)
      .is('folder_id', null)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });
    if (!error && data) set({ simpleTasks: data });
    set({ loading: false });
  },

  addSimpleTask: async (title, deadline = null) => {
    const userId = getUserId();
    if (!userId || !title.trim()) return;
    
    // Find max position
    const maxPos = get().simpleTasks.reduce((max, t) => Math.max(max, t.position || 0), 0);
    const position = maxPos + 1;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: title.trim(), created_by: userId, folder_id: null, deadline, color: get().getRandomColor(), position })
      .select()
      .single();
    if (!error && data) set(s => ({ simpleTasks: [...s.simpleTasks, data] }));
    return { data, error };
  },

  updateSimpleTask: async (taskId, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    if (!error && data)
      set(s => ({ simpleTasks: s.simpleTasks.map(t => t.id === taskId ? data : t) }));
    return { data, error };
  },

  updateTaskPosition: async (taskId, newPosition) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    if (!error && data) {
      set(s => ({
        simpleTasks: s.simpleTasks.map(t => t.id === taskId ? data : t),
        groupedTasks: s.groupedTasks.map(t => t.id === taskId ? data : t)
      }));
    }
    return { data, error };
  },

  deleteSimpleTask: async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);
    if (!error) set(s => ({ simpleTasks: s.simpleTasks.filter(t => t.id !== taskId) }));
  },

  // Bulk actions for simple tasks
  bulkResetSimpleTicks: async () => {
    const userId = getUserId();
    if (!userId) return;
    await supabase
      .from('tasks')
      .update({ status: 'not_done', updated_at: new Date().toISOString() })
      .eq('created_by', userId)
      .is('folder_id', null)
      .is('deleted_at', null);
    set(s => ({ simpleTasks: s.simpleTasks.map(t => ({ ...t, status: 'not_done' })) }));
  },

  bulkResetSimplePriorities: async () => {
    const userId = getUserId();
    if (!userId) return;
    await supabase
      .from('tasks')
      .update({ priority: null, updated_at: new Date().toISOString() })
      .eq('created_by', userId)
      .is('folder_id', null)
      .is('deleted_at', null);
    set(s => ({ simpleTasks: s.simpleTasks.map(t => ({ ...t, priority: null })) }));
  },

  bulkClearSimpleColors: async () => {
    const userId = getUserId();
    if (!userId) return;
    await supabase
      .from('tasks')
      .update({ color: null, updated_at: new Date().toISOString() })
      .eq('created_by', userId)
      .is('folder_id', null)
      .is('deleted_at', null);
    set(s => ({ simpleTasks: s.simpleTasks.map(t => ({ ...t, color: null })) }));
  },

  deleteAllSimpleTasks: async () => {
    const userId = getUserId();
    if (!userId) return;
    await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('created_by', userId)
      .is('folder_id', null);
    set({ simpleTasks: [] });
  },

  deleteCompletedSimpleTasks: async () => {
    const userId = getUserId();
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase
      .from('tasks')
      .update({ deleted_at: now })
      .eq('created_by', userId)
      .eq('status', 'completed')
      .is('folder_id', null);
    set(s => ({ simpleTasks: s.simpleTasks.filter(t => t.status !== 'completed') }));
  },

  // ── FOLDERS (Page 2) ─────────────────────────────────
  fetchFolders: async () => {
    const userId = getUserId();
    if (!userId) return;
    
    // Fetch owned folders
    const { data: ownedFolders } = await supabase
      .from('folders')
      .select('*')
      .eq('created_by', userId)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    // Fetch shared folders (where user is a member)
    const { data: memberships } = await supabase
      .from('folder_members')
      .select('folder_id')
      .eq('user_id', userId);

    let sharedFolders = [];
    if (memberships && memberships.length > 0) {
      let currentIdsToFetch = memberships.map(m => m.folder_id);
      let allShared = [];
      let fetchedIds = new Set();
      
      while (currentIdsToFetch.length > 0) {
        currentIdsToFetch = currentIdsToFetch.filter(id => !fetchedIds.has(id));
        if (currentIdsToFetch.length === 0) break;
        
        const { data } = await supabase
          .from('folders')
          .select('*')
          .in('id', currentIdsToFetch)
          .is('deleted_at', null)
          .order('position', { ascending: true });
          
        if (data && data.length > 0) {
          allShared = [...allShared, ...data];
          data.forEach(d => fetchedIds.add(d.id));
          
          const { data: children } = await supabase
            .from('folders')
            .select('id')
            .in('parent_id', data.map(d => d.id))
            .is('deleted_at', null);
            
          if (children && children.length > 0) {
            currentIdsToFetch = children.map(c => c.id);
          } else {
            currentIdsToFetch = [];
          }
        } else {
          currentIdsToFetch = [];
        }
      }
      sharedFolders = allShared.filter(f => f.created_by !== userId);
    }

    const allFolders = [...(ownedFolders || []), ...sharedFolders];
    set({ folders: allFolders });
  },

  addFolder: async (title, parentId = null, color = null, type = 'complete') => {
    const userId = getUserId();
    if (!userId || !title.trim()) return;

    // Find max position in this level
    const siblings = get().folders.filter(f => f.parent_id === parentId);
    const maxPos = siblings.reduce((max, f) => Math.max(max, f.position || 0), 0);
    const position = maxPos + 1;

    const { data, error } = await supabase
      .from('folders')
      .insert({ title: title.trim(), created_by: userId, parent_id: parentId, color: color || get().getRandomColor(), type, position })
      .select()
      .single();
      
    if (!error && data) {
      set(s => ({ folders: [...s.folders, data] }));
      
      // Inherit team members if parent is shared
      if (parentId) {
        const { data: parentMembers } = await supabase
          .from('folder_members')
          .select('*')
          .eq('folder_id', parentId);
          
        if (parentMembers && parentMembers.length > 0) {
          // Copy members to the new folder
          const newMembers = parentMembers.map(m => ({
            folder_id: data.id,
            user_id: m.user_id,
            role: m.role
          }));
          await supabase.from('folder_members').insert(newMembers);
          
          // Mark the new folder as shared
          await supabase
            .from('folders')
            .update({ is_shared: true })
            .eq('id', data.id);
            
          set(s => ({
            folders: s.folders.map(f => f.id === data.id ? { ...f, is_shared: true } : f)
          }));
        }
      }
    }
    
    return { data, error };
  },

  updateFolder: async (folderId, updates) => {
    const { data, error } = await supabase
      .from('folders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();
    if (!error && data)
      set(s => ({ folders: s.folders.map(f => f.id === folderId ? data : f) }));
    return { data, error };
  },

  deleteFolder: async (folderId) => {
    const allFolders = get().folders;
    const idsToDelete = [folderId];
    
    const findChildren = (id) => {
      const children = allFolders.filter(f => f.parent_id === id);
      children.forEach(child => {
        idsToDelete.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(folderId);

    const now = new Date().toISOString();

    // 1. Soft delete all folders in the hierarchy
    const { error: folderError } = await supabase
      .from('folders')
      .update({ deleted_at: now })
      .in('id', idsToDelete);

    if (folderError) return { error: folderError };

    // 2. Soft delete all tasks inside those folders
    await supabase
      .from('tasks')
      .update({ deleted_at: now })
      .in('folder_id', idsToDelete);

    // 3. Update local state
    set(s => ({ 
      folders: s.folders.filter(f => !idsToDelete.includes(f.id)),
      groupedTasks: s.groupedTasks.filter(t => !idsToDelete.includes(t.folder_id))
    }));
  },

  moveFolder: async (folderId, newParentId) => {
    const { data, error } = await supabase
      .from('folders')
      .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();
    if (!error && data)
      set(s => ({ folders: s.folders.map(f => f.id === folderId ? data : f) }));
    return { data, error };
  },

  duplicateFolder: async (folderId) => {
    const userId = getUserId();
    if (!userId) return { error: "User not found" };

    const originalFolder = get().folders.find(f => f.id === folderId);
    if (!originalFolder) return { error: "Folder not found" };

    let newFoldersList = [];

    const recursiveDuplicate = async (origFolderId, newParentId, titleOverride = null) => {
      const folder = get().folders.find(f => f.id === origFolderId);
      if (!folder) return null;

      // 1. Create new folder
      const { data: newFolder, error: fError } = await supabase
        .from('folders')
        .insert({
          title: titleOverride || folder.title,
          parent_id: newParentId,
          color: folder.color,
          type: folder.type,
          description: folder.description,
          created_by: userId
        })
        .select()
        .single();
      
      if (fError || !newFolder) return null;
      newFoldersList.push(newFolder);
      
      // 2. Fetch and copy tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('folder_id', origFolderId)
        .is('deleted_at', null);
        
      if (tasks && tasks.length > 0) {
        const tasksToInsert = tasks.map(t => ({
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          color: t.color,
          deadline: t.deadline,
          position: t.position,
          folder_id: newFolder.id,
          created_by: userId
        }));
        await supabase.from('tasks').insert(tasksToInsert);
      }
      
      // 3. Find sub-folders and recursively duplicate them
      const subFolders = get().folders.filter(f => f.parent_id === origFolderId);
      for (const sub of subFolders) {
        await recursiveDuplicate(sub.id, newFolder.id);
      }

      return newFolder;
    };

    const newRootFolder = await recursiveDuplicate(folderId, originalFolder.parent_id, `${originalFolder.title} (Copy)`);

    if (newRootFolder) {
      set(s => ({ folders: [...s.folders, ...newFoldersList] }));
      await get().fetchGroupedTasks();
      return { data: newRootFolder };
    }
    
    return { error: "Failed to duplicate folder" };
  },

  setFolderIndex: async (folderId, newIndex) => {
    const { folders } = get();
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Use the same sibling logic as GroupedTasksPage.jsx
    const siblings = folders.filter(f => {
      if (folder.parent_id) {
        // If it has a parent, siblings are folders with same parent
        // UNLESS the parent is not accessible to the user (in which case it's a "root" in the UI)
        if (!folders.some(p => p.id === folder.parent_id)) {
          // Parent is missing from state (shared child case)
          return !folders.some(p => p.id === f.parent_id);
        }
        return f.parent_id === folder.parent_id;
      }
      // No parent in DB, or its parent is missing from state
      return f.parent_id === null || !folders.some(p => p.id === f.parent_id);
    }).sort((a,b) => (a.position || 0) - (b.position || 0));
    
    const others = siblings.filter(f => f.id !== folderId);
    
    let newPos;
    if (newIndex <= 0) {
      newPos = (others[0]?.position || 0) - 1;
    } else if (newIndex >= others.length) {
      newPos = (others[others.length - 1]?.position || 0) + 1;
    } else {
      newPos = ((others[newIndex - 1]?.position || 0) + (others[newIndex]?.position || 0)) / 2;
    }

    return await get().updateFolderPosition(folderId, newPos);
  },

  setTaskIndex: async (taskId, newIndex, folderId = null) => {
    const { simpleTasks, groupedTasks } = get();
    const tasks = folderId ? groupedTasks.filter(t => t.folder_id === folderId) : simpleTasks;
    const sorted = [...tasks].sort((a,b) => (a.position || 0) - (b.position || 0));
    const others = sorted.filter(t => t.id !== taskId);

    let newPos;
    if (newIndex <= 0) {
      newPos = (others[0]?.position || 0) - 1;
    } else if (newIndex >= others.length) {
      newPos = (others[others.length - 1]?.position || 0) + 1;
    } else {
      newPos = ((others[newIndex - 1]?.position || 0) + (others[newIndex]?.position || 0)) / 2;
    }

    return await get().updateTaskPosition(taskId, newPos);
  },

  updateFolderPosition: async (folderId, newPosition) => {
    const { data, error } = await supabase
      .from('folders')
      .update({ position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();
    if (!error && data)
      set(s => ({ folders: s.folders.map(f => f.id === folderId ? data : f) }));
    return { data, error };
  },

  // ── GROUPED TASKS (Page 2) ────────────────────────────
  fetchGroupedTasks: async (folderId = null) => {
    const userId = getUserId();
    if (!userId) return;
    set({ loading: true });
    
    // Gather all folder IDs the user can see (owned + shared)
    const allFolderIds = get().folders.map(f => f.id);
    
    if (allFolderIds.length === 0) {
      set({ groupedTasks: [], loading: false });
      return;
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .in('folder_id', allFolderIds)
      .is('deleted_at', null)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) set({ groupedTasks: data });
    set({ loading: false });
  },

  addGroupedTask: async (title, folderId, deadline = null) => {
    const userId = getUserId();
    if (!userId || !folderId) return;

    // Find max position in this folder
    const folderTasks = get().groupedTasks.filter(t => t.folder_id === folderId);
    const maxPos = folderTasks.reduce((max, t) => Math.max(max, t.position || 0), 0);
    const position = maxPos + 1;

    const { data, error } = await supabase
      .from('tasks')
      .insert({ title: title.trim(), created_by: userId, folder_id: folderId, deadline, color: get().getRandomColor(), position })
      .select()
      .single();
    if (!error && data) set(s => ({ groupedTasks: [...s.groupedTasks, data] }));
    return { data, error };
  },

  updateGroupedTask: async (taskId, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    if (!error && data)
      set(s => ({ groupedTasks: s.groupedTasks.map(t => t.id === taskId ? data : t) }));
    return { data, error };
  },

  deleteGroupedTask: async (taskId) => {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);
    if (!error) set(s => ({ groupedTasks: s.groupedTasks.filter(t => t.id !== taskId) }));
  },

  // Bulk actions for a specific folder
  bulkResetFolderTicks: async (folderId) => {
    await supabase
      .from('tasks')
      .update({ status: 'not_done', updated_at: new Date().toISOString() })
      .eq('folder_id', folderId)
      .is('deleted_at', null);
    set(s => ({ groupedTasks: s.groupedTasks.map(t =>
      t.folder_id === folderId ? { ...t, status: 'not_done' } : t
    ) }));
  },

  bulkResetFolderPriorities: async (folderId) => {
    await supabase
      .from('tasks')
      .update({ priority: null, updated_at: new Date().toISOString() })
      .eq('folder_id', folderId)
      .is('deleted_at', null);
    set(s => ({ groupedTasks: s.groupedTasks.map(t =>
      t.folder_id === folderId ? { ...t, priority: null } : t
    ) }));
  },

  bulkClearFolderColors: async (folderId) => {
    await supabase
      .from('tasks')
      .update({ color: null, updated_at: new Date().toISOString() })
      .eq('folder_id', folderId)
      .is('deleted_at', null);
    set(s => ({ groupedTasks: s.groupedTasks.map(t =>
      t.folder_id === folderId ? { ...t, color: null } : t
    ) }));
  },

  deleteAllFolderTasks: async (folderId) => {
    await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('folder_id', folderId);
    set(s => ({ groupedTasks: s.groupedTasks.filter(t => t.folder_id !== folderId) }));
  },

  deleteCompletedFolderTasks: async (folderId) => {
    const now = new Date().toISOString();
    await supabase
      .from('tasks')
      .update({ deleted_at: now })
      .eq('folder_id', folderId)
      .eq('status', 'completed');
    set(s => ({ groupedTasks: s.groupedTasks.filter(t => !(t.folder_id === folderId && t.status === 'completed')) }));
  },

  // ── SHARING ──────────────────────────────────────────

  // Send a COPY of a folder to another user (no sync)
  sendFolderCopy: async (folderId, targetUsername) => {
    // 1. Find target user
    const { data: targetUser, error: uErr } = await supabase
      .from('users')
      .select('id')
      .eq('username', targetUsername.trim().toLowerCase())
      .single();
    if (uErr || !targetUser) return { error: { message: 'User not found' } };

    const originalFolder = get().folders.find(f => f.id === folderId);
    if (!originalFolder) return { error: { message: 'Folder not found' } };

    const recursiveCopy = async (origFolderId, newParentId) => {
      const folder = get().folders.find(f => f.id === origFolderId);
      if (!folder) return null;

      // 2. Create copy of folder for target user
      const { data: newFolder, error: fErr } = await supabase
        .from('folders')
        .insert({
          title: folder.title,
          color: folder.color,
          type: folder.type,
          description: folder.description,
          created_by: targetUser.id,
          parent_id: newParentId
        })
        .select()
        .single();
      if (fErr || !newFolder) return null;

      // 3. Copy all tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('folder_id', origFolderId)
        .is('deleted_at', null);
      
      if (tasks && tasks.length > 0) {
        const copies = tasks.map(t => ({
          title: t.title,
          description: t.description,
          status: 'not_done', // reset status for the recipient
          priority: t.priority,
          color: t.color,
          deadline: t.deadline,
          position: t.position,
          folder_id: newFolder.id,
          created_by: targetUser.id
        }));
        await supabase.from('tasks').insert(copies);
      }

      // 4. Find sub-folders and recursively copy them
      const subFolders = get().folders.filter(f => f.parent_id === origFolderId);
      for (const sub of subFolders) {
        await recursiveCopy(sub.id, newFolder.id);
      }

      return newFolder;
    };

    const newRootFolder = await recursiveCopy(folderId, null);
    
    if (newRootFolder) {
      return { data: newRootFolder };
    }
    
    return { error: { message: 'Failed to send folder copy' } };
  },

  // Convert folder to TEAM SHARED mode
  enableTeamShare: async (folderId) => {
    const userId = getUserId();
    if (!userId) return;

    await supabase
      .from('folders')
      .update({ is_shared: true, updated_at: new Date().toISOString() })
      .eq('id', folderId);

    // Add owner as first member to this folder and all sub-folders
    const addOwnerRecursively = async (currentId) => {
      await supabase
        .from('folder_members')
        .upsert({ folder_id: currentId, user_id: userId, role: 'owner' }, { onConflict: 'folder_id,user_id' });
        
      const children = get().folders.filter(f => f.parent_id === currentId);
      for (const child of children) {
        await addOwnerRecursively(child.id);
      }
    };
    await addOwnerRecursively(folderId);

    set(s => ({
      folders: s.folders.map(f => f.id === folderId ? { ...f, is_shared: true } : f)
    }));
  },

  // Add a member to a team shared folder
  addTeamMember: async (folderId, username) => {
    const { data: user, error: uErr } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', username.trim().toLowerCase())
      .single();
    if (uErr || !user) return { error: { message: 'User not found' } };

    const currentUserId = getUserId();
    if (user.id === currentUserId) return { error: { message: 'You are already a member' } };

    const addRecursively = async (currentId) => {
      await supabase
        .from('folder_members')
        .upsert({ folder_id: currentId, user_id: user.id, role: 'member' }, { onConflict: 'folder_id,user_id' });
        
      const children = get().folders.filter(f => f.parent_id === currentId);
      for (const child of children) {
        await addRecursively(child.id);
      }
    };
    
    await addRecursively(folderId);

    // Refresh members
    await get().fetchFolderMembers(folderId);
    return { data: user };
  },

  removeTeamMember: async (folderId, userId) => {
    const allFolders = get().folders;
    
    // 1. Find root
    let currentId = folderId;
    let rootId = folderId;
    while (currentId) {
      const f = allFolders.find(x => x.id === currentId);
      if (f && f.parent_id) {
        currentId = f.parent_id;
        rootId = currentId;
      } else {
        break;
      }
    }

    // 2. Find all tree IDs
    const treeIds = [];
    const collectDescendants = (id) => {
      treeIds.push(id);
      const children = allFolders.filter(f => f.parent_id === id);
      children.forEach(c => collectDescendants(c.id));
    };
    collectDescendants(rootId);

    // 3. Delete
    await supabase
      .from('folder_members')
      .delete()
      .eq('user_id', userId)
      .in('folder_id', treeIds);

    
    // Unassign their tasks
    await supabase
      .from('tasks')
      .update({ assigned_to: null, updated_at: new Date().toISOString() })
      .in('folder_id', treeIds)
      .eq('assigned_to', userId);
    
    await get().fetchFolderMembers(folderId);
    await get().fetchGroupedTasks();
  },

  // Fetch members for a folder (inherits from parent if nested)
  fetchFolderMembers: async (folderId) => {
    // Find the closest shared ancestor
    let currentId = folderId;
    let targetId = folderId;
    const allFolders = get().folders;

    while (currentId) {
      const f = allFolders.find(x => x.id === currentId);
      if (f?.is_shared) {
        targetId = f.id;
        break;
      }
      currentId = f?.parent_id;
    }

    const { data } = await supabase
      .from('folder_members')
      .select('user_id, role, users(username)')
      .eq('folder_id', targetId);
    
    if (data) {
      const members = data.map(m => ({
        user_id: m.user_id,
        username: m.users?.username || 'Unknown',
        role: m.role
      }));
      set(s => ({
        folderMembers: { ...s.folderMembers, [folderId]: members }
      }));
    }
  },

  // Assign a task to a user
  assignTask: async (taskId, userId) => {
    const { data, error } = await supabase
      .from('tasks')
      .update({ assigned_to: userId, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    if (!error && data) {
      set(s => ({ groupedTasks: s.groupedTasks.map(t => t.id === taskId ? data : t) }));
    }
    return { data, error };
  },

  // Fetch "My Tasks" - all tasks assigned to current user across all shared folders
  fetchMyTasks: async () => {
    const userId = getUserId();
    if (!userId) return;
    set({ loading: true });

    const { data, error } = await supabase
      .from('tasks')
      .select('*, folders(title)')
      .eq('assigned_to', userId)
      .is('deleted_at', null)
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!error && data) set({ myTasks: data });
    set({ loading: false });
  },

  // ── IMPORTANT DATES (Calendar) ────────────────────────
  fetchImportantDates: async () => {
    const userId = getUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('important_dates')
      .select('*')
      .eq('created_by', userId)
      .is('deleted_at', null)
      .order('date', { ascending: true });
    if (!error && data) set({ importantDates: data });
  },

  addImportantDate: async (title, date, color = null) => {
    const userId = getUserId();
    if (!userId) return;
    const { data, error } = await supabase
      .from('important_dates')
      .insert({ title: title.trim(), date, created_by: userId, color })
      .select()
      .single();
    if (!error && data) set(s => ({ importantDates: [...s.importantDates, data] }));
    return { data, error };
  },

  deleteImportantDate: async (dateId) => {
    const { error } = await supabase
      .from('important_dates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', dateId);
    if (!error) set(s => ({ importantDates: s.importantDates.filter(d => d.id !== dateId) }));
  },

  updateImportantDate: async (dateId, updates) => {
    const { data, error } = await supabase
      .from('important_dates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', dateId)
      .select()
      .single();
    if (!error && data)
      set(s => ({ importantDates: s.importantDates.map(d => d.id === dateId ? data : d) }));
    return { data, error };
  },

  purgeDeletedRecords: async () => {
    const userId = getUserId();
    if (!userId) return;
    
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const threshold = oneDayAgo.toISOString();

    // 1. Purge important_dates
    await supabase
      .from('important_dates')
      .delete()
      .eq('created_by', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', threshold);

    // 2. Purge tasks
    await supabase
      .from('tasks')
      .delete()
      .eq('created_by', userId)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', threshold);
  },

  softDeletePastDates: async () => {
    const userId = getUserId();
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('important_dates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('created_by', userId)
      .lt('date', today);
    if (!error) get().fetchImportantDates();
  },

  // ── CALENDAR TASKS (all tasks with deadlines) ─────────
  fetchCalendarTasks: async () => {
    const userId = getUserId();
    if (!userId) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('created_by', userId)
      .is('deleted_at', null)
      .not('deadline', 'is', null);
    return data || [];
  },

  leaveFolder: async (folderId) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    const allFolders = get().folders;
    
    // 1. Find the root of this folder's tree
    let currentId = folderId;
    let rootId = folderId;
    while (currentId) {
      const f = allFolders.find(x => x.id === currentId);
      if (f && f.parent_id) {
        currentId = f.parent_id;
        rootId = currentId;
      } else {
        break;
      }
    }

    // 2. Find all folders in this tree (root + descendants)
    const treeIds = [];
    const collectDescendants = (id) => {
      treeIds.push(id);
      const children = allFolders.filter(f => f.parent_id === id);
      children.forEach(c => collectDescendants(c.id));
    };
    collectDescendants(rootId);

    // 3. Delete membership for the user across the entire tree
    const { error } = await supabase
      .from('folder_members')
      .delete()
      .eq('user_id', user.id)
      .in('folder_id', treeIds);
    
    if (error) throw error;
    await get().fetchFolders();
  }
}));
