import { ICreateTeacherProfileModel } from '../models/create-teacher-profile.model';
import { EditTeacherProfileRequestDto } from './edit-teacher-profile-request.dto';

export class CreateTeacherProfileRequestDto extends EditTeacherProfileRequestDto implements ICreateTeacherProfileModel {}
