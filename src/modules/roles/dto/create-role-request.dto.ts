import { ICreateRoleModel } from "../models/create-role.model";
import { EditRoleRequestDto } from "./edit-role-request.dto";

export class CreateRoleRequestDto extends EditRoleRequestDto implements ICreateRoleModel {}
