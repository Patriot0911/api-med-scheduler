import { ICreateTagModel } from '../models/create-tag.model';
import { EditTagRequestDto } from './edit-tag-request.dto';

export class CreateTagRequestDto extends EditTagRequestDto implements ICreateTagModel {}
