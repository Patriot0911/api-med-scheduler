import { Injectable } from '@nestjs/common';
import { Permission } from 'src/shared/models/permission.enum';

@Injectable()
export class DictionariesService {
  getPermissions() {
    return Object.values(Permission);
  }
}
