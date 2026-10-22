export interface IEditMeModel {
  email: string;
  fullName: string;
  /** Required when the email changes: the email is the login */
  currentPassword?: string;
};
