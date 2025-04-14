export const TeamPermission = {
    canEdit: (role?: string) => ['owner', 'admin', 'editor'].includes(role || ''),
    canDelete: (role?: string) => ['owner', 'admin'].includes(role || ''),
    canInvite: (role?: string) => ['owner', 'admin'].includes(role || '')
  };