import { Injectable } from '@nestjs/common';
import { UserEntity } from '../entities/user.entity';
import { TeacherEntity } from '../entities/teacher.entity';
import { StudentEntity } from '../entities/student.entity';
import { IUserItemModel } from '../models/user-item.model';
import { IUserListItemModel } from '../models/user-list-item.model';
import { ITeacherProfileModel } from '../models/teacher-profile.model';
import { IStudentProfileModel } from '../models/student-profile.model';

@Injectable()
export class UsersMapper {
  entityToListItem(user: UserEntity): IUserListItemModel {
    return this.entityToItem(user);
  }

  entityToItem(user: UserEntity): IUserItemModel {
    const { id, email, fullName, roles, createdAt, lastLoginAt, teacher, student, } = user;
    return {
      id, email, fullName, createdAt,
      lastLoginAt: lastLoginAt ?? null,
      roleIds: (roles ?? []).map((role) => role.id),
      teacher: teacher ? this.teacherProfileToItem(teacher) : null,
      student: student ? this.studentProfileToItem(student) : null,
    };
  }

  teacherProfileToItem(teacher: TeacherEntity): ITeacherProfileModel {
    const { id, } = teacher;
    return { id, };
  }

  studentProfileToItem(student: StudentEntity): IStudentProfileModel {
    const { id, studentGroupId, isGroupMonitor, } = student;
    return { id, studentGroupId, isGroupMonitor, };
  }
}
