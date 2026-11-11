import { ITeacherProfileModel } from './teacher-profile.model';
import { IStudentProfileModel } from './student-profile.model';

export interface IUserItemModel {
  id: string;
  email: string;
  fullName: string;
  roleIds: string[];
  createdAt: Date;
  lastLoginAt: Date | null;
  teacher: ITeacherProfileModel | null;
  student: IStudentProfileModel | null;
  /** Whether the requesting user may edit this user, their profiles and roles */
  canManage: boolean;
};
