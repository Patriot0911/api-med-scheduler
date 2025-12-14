import { ICreateStudentGroupModel } from "../models/create-student-group.model";
import { EditStudentGroupRequestDto } from "./edit-student-group-request.dto";

export class CreateStudentGroupRequestDto extends EditStudentGroupRequestDto implements ICreateStudentGroupModel {}
