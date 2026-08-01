import { ICreateStudentProfileModel } from '../models/create-student-profile.model';
import { EditStudentProfileRequestDto } from './edit-student-profile-request.dto';

export class CreateStudentProfileRequestDto extends EditStudentProfileRequestDto implements ICreateStudentProfileModel {}
