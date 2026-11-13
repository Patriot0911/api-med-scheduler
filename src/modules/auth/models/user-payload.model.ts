import { Permission } from "src/shared/models/permission.enum";
import { ITeacherProfileModel } from "src/modules/users/models/teacher-profile.model";
import { IStudentProfileModel } from "src/modules/users/models/student-profile.model";

export interface IUserPayloadTeacherModel extends ITeacherProfileModel {
  headOfDepartmentId: string | null;
}

export interface IUserPayload {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: Permission[];
  teacher: IUserPayloadTeacherModel | null;
  student: IStudentProfileModel | null;
};
