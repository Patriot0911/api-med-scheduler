import { Permission } from "src/shared/models/permission.enum";
import { ITeacherProfileModel } from "src/modules/users/models/teacher-profile.model";
import { IStudentProfileModel } from "src/modules/users/models/student-profile.model";

export interface IUserPayload {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: Permission[];
  teacher: ITeacherProfileModel | null;
  student: IStudentProfileModel | null;
};
