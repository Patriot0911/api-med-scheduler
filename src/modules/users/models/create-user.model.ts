import { ICreateTeacherProfileModel } from './create-teacher-profile.model';
import { ICreateStudentProfileModel } from './create-student-profile.model';

export interface ICreateUserModel {
  email: string;
  fullName: string;
  /** Missing generates a random one */
  password?: string;
  roleIds?: string[];
  teacher?: ICreateTeacherProfileModel | null;
  student?: ICreateStudentProfileModel | null;
};
