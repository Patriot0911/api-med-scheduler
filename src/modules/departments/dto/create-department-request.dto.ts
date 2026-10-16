import { ICreateDepartmentModel } from '../models/create-department.model';
import { EditDepartmentRequestDto } from './edit-department-request.dto';

export class CreateDepartmentRequestDto extends EditDepartmentRequestDto implements ICreateDepartmentModel {}
