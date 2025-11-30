import { Injectable } from '@nestjs/common';
import { Permission } from 'src/shared/models/permission.enum';

@Injectable()
export class DictionariesService {
  constructor() {}

  getPermissions() {
    return Object.values(Permission);
  }
}
