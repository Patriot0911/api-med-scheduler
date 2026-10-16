import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
import { LessonEntity } from '../entities/lesson.entity';
import { IGetLessonsFiltersModel } from '../models/lessons/get-lessons-filter.model';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { LessonsMapper } from '../mappers/lessons.mapper';
import { ILessonListItemModel } from '../models/lessons/lesson-list-item.model';
import { ILessonItemModel } from '../models/lessons/lesson-item.model';
import { ICreateLessonModel } from '../models/lessons/create-lesson.model';
import { IEditLessonModel } from '../models/lessons/edit-lesson.model';
import { ITeacherUpdateLessonModel } from '../models/lessons/teacher-update-lesson.model';
import { LessonVisibility } from '../models/lesson-visibility.enum';
import { TeacherLessonEntity } from '../entities/teacher-lesson.entity';
import { StudentGroupLessonEntity } from '../entities/student-group-lesson.entity';
import { TeacherEntity } from 'src/modules/users/entities/teacher.entity';
import { StudentEntity } from 'src/modules/users/entities/student.entity';
import { Permission } from 'src/shared/models/permission.enum';
import { LessonsGroupEntity } from '../entities/lessons-group.entity';
import { LessonAccessService } from './lesson-access.service';
import { ILessonManageScopeModel } from '../models/lesson-manage-scope.model';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(LessonEntity)
    private lessonsRepository: Repository<LessonEntity>,
    @InjectRepository(TeacherLessonEntity)
    private teacherLessonRepository: Repository<TeacherLessonEntity>,
    @InjectRepository(StudentGroupLessonEntity)
    private studentGroupLessonRepository: Repository<StudentGroupLessonEntity>,
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    @InjectRepository(StudentEntity)
    private studentsRepository: Repository<StudentEntity>,
    @InjectRepository(LessonsGroupEntity)
    private lessonGroupsRepository: Repository<LessonsGroupEntity>,
    private readonly lessonsMapper: LessonsMapper,
    private readonly lessonAccessService: LessonAccessService,
  ) {}

  async getAll(
    params: IGetLessonsFiltersModel,
    userId: string,
    permissions: Permission[],
  ): Promise<IGenericListPayloadResponse<ILessonListItemModel>> {
    const { page, pageSize, dateFrom, dateTo, group, teacher, } = params;
    const lessonsQb = this.lessonsRepository
      .createQueryBuilder('ls')
      .leftJoin('ls.teacherLessons', 'teacherLessons')
      .leftJoin('teacherLessons.teacher', 'teacher')
      .leftJoin('teacher.user', 'teacherUser')
      .leftJoin('ls.studentGroupLessons', 'studentGroupLessons')
      .leftJoin('studentGroupLessons.studentGroup', 'studentGroup')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (dateFrom) {
      lessonsQb.andWhere('(ls.date >= :dateFrom)', { dateFrom, });
    }
    if (dateTo) {
      lessonsQb.andWhere('(ls.date <= :dateTo)', { dateTo, });
    }
    if (teacher) {
      lessonsQb.andWhere('teacherUser.fullName LIKE :teacher', { teacher: `%${teacher}%`, });
    }
    if (group) {
      lessonsQb.andWhere('studentGroup.name LIKE :group', { group: `%${group}%`, });
    }

    await this.applyVisibilityFilter(lessonsQb, userId, permissions);

    const [lsData, total] = await lessonsQb
      .distinct(true)
      .getManyAndCount();

    const lessonsWithRelations = lsData.length
      ? await this.lessonsRepository.find({
        where: { id: In(lsData.map((lesson) => lesson.id)), },
        relations: { teacherLessons: true, studentGroupLessons: true, },
      })
      : [];
    const lessonsById = new Map(lessonsWithRelations.map((lesson) => [lesson.id, lesson]));

    return {
      items: lsData.map(
        (s) => this.lessonsMapper.entityToListItem(lessonsById.get(s.id) ?? s)
      ),
      meta: { count: total, },
    };
  };

  async getById(id: string): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });
    return this.lessonsMapper.entityToItem(lesson);
  }

  async getByIdForUser(id: string, userId: string, permissions: Permission[]): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id, },
      relations: { teacherLessons: true, studentGroupLessons: true, },
    });

    await this.assertLessonVisible(lesson, userId, permissions);

    return this.lessonsMapper.entityToItem(lesson);
  }

  async createLesson({ teacherIds, studentGroupIds, ...data }: ICreateLessonModel): Promise<ILessonItemModel> {
    const lesson = this.lessonsRepository.create({
      ...data,
    },);
    const createdLesson = await this.lessonsRepository.save(lesson);

    if (teacherIds && teacherIds.length > 0) {
      const lessonTeachers = teacherIds.map((teacherId) =>
        this.teacherLessonRepository.create({
          lessonId: createdLesson.id,
          teacherId: teacherId,
        }),
      );

      await this.teacherLessonRepository.save(lessonTeachers);
    }

    if (studentGroupIds && studentGroupIds.length > 0) {
      const lessonGroups = studentGroupIds.map((groupId) =>
        this.studentGroupLessonRepository.create({
          lessonId: createdLesson.id,
          studentGroupId: groupId,
        }),
      );

      await this.studentGroupLessonRepository.save(lessonGroups);
    }

    return this.getById(createdLesson.id);
  }

  async createLessonForUser(data: ICreateLessonModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    await this.lessonAccessService.assertCanAssignTeachers(scope, data.teacherIds);
    if (data.lessonGroupId) {
      const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
        where: { id: data.lessonGroupId, },
      });
      this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    }
    return this.createLesson(data);
  }

  async editLessonForUser(lessonId: string, data: IEditLessonModel, scope: ILessonManageScopeModel): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
      relations: { teacherLessons: true, },
    });
    await this.lessonAccessService.assertCanManageLesson(scope, lesson);
    if (data.teacherIds !== undefined) {
      await this.lessonAccessService.assertCanAssignTeachers(scope, data.teacherIds);
    }
    if (data.lessonGroupId && data.lessonGroupId !== lesson.lessonGroupId) {
      const lessonGroup = await this.lessonGroupsRepository.findOneOrFail({
        where: { id: data.lessonGroupId, },
      });
      this.lessonAccessService.assertCanUseGroup(scope, lessonGroup);
    }
    return this.editLesson(lessonId, data);
  }

  async deleteLessonForUser(lessonId: string, scope: ILessonManageScopeModel): Promise<void> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
      relations: { teacherLessons: true, },
    });
    await this.lessonAccessService.assertCanManageLesson(scope, lesson);
    await this.lessonsRepository.remove(lesson);
  }

  async editLesson(lessonId: string, { teacherIds, studentGroupIds, ...data }: IEditLessonModel): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
    });

    Object.assign(lesson, { ...data, });

    if (teacherIds) {
      await this.teacherLessonRepository.delete({ lessonId });

      if (teacherIds.length > 0) {
        await this.teacherLessonRepository.insert(
          teacherIds.map((teacherId) => ({
            lessonId,
            teacherId,
          })),
        );
      }
    }

    if (studentGroupIds) {
      await this.studentGroupLessonRepository.delete({ lessonId });

      if (studentGroupIds.length > 0) {
        await this.studentGroupLessonRepository.insert(
          studentGroupIds.map((studentGroupId) => ({
            lessonId,
            studentGroupId,
          })),
        );
      }
    }

    await this.lessonsRepository.save(lesson);

    return this.getById(lessonId);
  }

  async updateLessonAsTeacher(
    lessonId: string,
    userId: string,
    permissions: Permission[],
    data: ITeacherUpdateLessonModel,
  ): Promise<ILessonItemModel> {
    const lesson = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, },
      relations: { teacherLessons: true, },
    });

    const teacherProfile = await this.teachersRepository.findOne({
      where: { userId, },
    });

    const isAssignedTeacher = !!teacherProfile
      && lesson.teacherLessons.some((teacherLesson) => teacherLesson.teacherId === teacherProfile.id);
    const hasManageAccess = permissions.includes(Permission.ADMIN) || permissions.includes(Permission.MANAGE_LESSONS);

    if (!isAssignedTeacher && !hasManageAccess) {
      throw new ForbiddenException('Only a teacher assigned to this lesson can update it');
    }

    if (data.note !== undefined) {
      lesson.note = data.note;
    }
    if (data.delayedDate !== undefined) {
      lesson.delayedDate = data.delayedDate;
    }

    await this.lessonsRepository.save(lesson);

    return this.getById(lessonId);
  }

  async deleteLesson(lessonId: string): Promise<void> {
    const lessonData = await this.lessonsRepository.findOneOrFail({
      where: { id: lessonId, }
    });
    await this.lessonsRepository.remove(lessonData);
  }

  private hasManageLessonsAccess(permissions: Permission[]): boolean {
    return permissions.includes(Permission.ADMIN) || permissions.includes(Permission.MANAGE_LESSONS);
  }

  private async getVisibleDepartmentId(
    lesson: Pick<LessonEntity, 'visibility'>,
    permissions: Permission[],
    teacherProfile: TeacherEntity | null,
  ): Promise<string | null> {
    const headDepartmentId = await this.lessonAccessService.getHeadedDepartmentId(teacherProfile, permissions);
    if (headDepartmentId) {
      return headDepartmentId;
    }
    if (lesson.visibility === LessonVisibility.DEPARTMENT) {
      return teacherProfile?.departmentId ?? null;
    }
    return null;
  }

  private isLessonVisibleToUser(
    lesson: Pick<LessonEntity, 'visibility' | 'teacherLessons' | 'studentGroupLessons'>,
    teacherProfile: TeacherEntity | null,
    studentProfile: StudentEntity | null,
  ): boolean {
    if (lesson.visibility === LessonVisibility.PUBLIC) {
      return true;
    }
    if (lesson.visibility === LessonVisibility.TEACHERS) {
      return !!teacherProfile;
    }

    const isAssignedTeacher = !!teacherProfile
      && lesson.teacherLessons.some((teacherLesson) => teacherLesson.teacherId === teacherProfile.id);
    const isInAssignedGroup = !!studentProfile?.studentGroupId
      && lesson.studentGroupLessons.some((studentGroupLesson) => studentGroupLesson.studentGroupId === studentProfile.studentGroupId);

    return isAssignedTeacher || isInAssignedGroup;
  }

  private async assertLessonVisible(lesson: LessonEntity, userId: string, permissions: Permission[]): Promise<void> {
    if (this.hasManageLessonsAccess(permissions)) {
      return;
    }

    const [teacherProfile, studentProfile] = await Promise.all([
      this.teachersRepository.findOne({ where: { userId, }, }),
      this.studentsRepository.findOne({ where: { userId, }, }),
    ]);

    if (this.isLessonVisibleToUser(lesson, teacherProfile, studentProfile)) {
      return;
    }

    const departmentId = await this.getVisibleDepartmentId(lesson, permissions, teacherProfile);
    if (departmentId) {
      const lessonTeacherIds = lesson.teacherLessons.map((teacherLesson) => teacherLesson.teacherId);
      if (lessonTeacherIds.length > 0) {
        const departmentTeachersCount = await this.teachersRepository.count({
          where: { id: In(lessonTeacherIds), departmentId, },
        });
        if (departmentTeachersCount > 0) {
          return;
        }
      }
    }

    throw new ForbiddenException('You do not have access to this lesson');
  }

  private async applyVisibilityFilter(
    qb: SelectQueryBuilder<LessonEntity>,
    userId: string,
    permissions: Permission[],
  ): Promise<void> {
    if (this.hasManageLessonsAccess(permissions)) {
      return;
    }

    const [teacherProfile, studentProfile] = await Promise.all([
      this.teachersRepository.findOne({ where: { userId, }, }),
      this.studentsRepository.findOne({ where: { userId, }, }),
    ]);

    const headDepartmentId = await this.lessonAccessService.getHeadedDepartmentId(teacherProfile, permissions);

    qb.andWhere(new Brackets((visibilityQb) => {
      visibilityQb.where('ls.visibility = :publicVisibility', { publicVisibility: LessonVisibility.PUBLIC, });

      // department-visible lessons are a superset of restricted ones: assigned teachers/groups still see them
      const assignedVisibilities = [LessonVisibility.RESTRICTED, LessonVisibility.DEPARTMENT];

      if (teacherProfile) {
        visibilityQb.orWhere('ls.visibility = :teachersVisibility', { teachersVisibility: LessonVisibility.TEACHERS, });
        visibilityQb.orWhere(
          `(ls.visibility IN (:...assignedVisibilities) AND EXISTS (
            SELECT 1 FROM teacher_lesson vtl WHERE vtl.lesson_id = ls.id AND vtl.teacher_id = :myTeacherId
          ))`,
          { assignedVisibilities, myTeacherId: teacherProfile.id, },
        );
      }

      if (teacherProfile?.departmentId) {
        visibilityQb.orWhere(
          `(ls.visibility = :departmentVisibility AND EXISTS (
            SELECT 1 FROM teacher_lesson vdtl
            INNER JOIN teachers vdt ON vdt.id = vdtl.teacher_id
            WHERE vdtl.lesson_id = ls.id AND vdt.department_id = :myTeacherDepartmentId
          ))`,
          { departmentVisibility: LessonVisibility.DEPARTMENT, myTeacherDepartmentId: teacherProfile.departmentId, },
        );
      }

      if (headDepartmentId) {
        visibilityQb.orWhere(
          `EXISTS (
            SELECT 1 FROM teacher_lesson dtl
            INNER JOIN teachers dt ON dt.id = dtl.teacher_id
            WHERE dtl.lesson_id = ls.id AND dt.department_id = :myDepartmentId
          )`,
          { myDepartmentId: headDepartmentId, },
        );
      }

      if (studentProfile?.studentGroupId) {
        visibilityQb.orWhere(
          `(ls.visibility IN (:...assignedVisibilities) AND EXISTS (
            SELECT 1 FROM student_group_lesson vsgl WHERE vsgl.lesson_id = ls.id AND vsgl.student_group_id = :myStudentGroupId
          ))`,
          { assignedVisibilities, myStudentGroupId: studentProfile.studentGroupId, },
        );
      }
    }));
  }
}
