export enum Permission {
  ADMIN = 'admin',

  VIEW_GROUPS = 'read_groups',
  EDIT_GROUPS = 'edit_groups',
  CREATE_GROUPS = 'create_groups',
  DELETE_GROUPS = 'delete_groups',

  VIEW_ROLES = 'read_roles',
  EDIT_ROLES = 'edit_roles',
  CREATE_ROLES = 'create_roles',
  DELETE_ROLES = 'delete_roles',

  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  EDIT_USERS_ROLES = 'edit_users_roles',
  DELETE_USERS = 'delete_users',

  CREATE_LESSONS = 'create_lessons',
  EDIT_LESSONS = 'edit_lessons',
  DELETE_LESSONS = 'delete_lessons',

  VIEW_COMMENTS = 'view_comments',
  CREATE_COMMENTS = 'create_comments',
  EDIT_COMMENTS = 'edit_comments',
  DELETE_COMMENTS = 'delete_comments',
};
