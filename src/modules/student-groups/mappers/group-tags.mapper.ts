import { Injectable } from '@nestjs/common';
import { GroupTagEntity } from '../entities/group-tags.entity';
import { ITagListItemModel } from '../models/tag-list-item.model';
import { ITagItemModel } from '../models/tag-item.model';
import { ITagDictionaryItem } from '../models/tag-dictionary-item.model';

@Injectable()
export class GroupTagsMapper {
  entityToListItem(tag: GroupTagEntity): ITagListItemModel {
    const { id, name, } = tag;
    return { id, name, };
  }

  entityToItem(tag: GroupTagEntity): ITagItemModel {
    const { id, name, } = tag;
    return { id, name, };
  }

  entityToDictionaryItem(tag: GroupTagEntity): ITagDictionaryItem {
    const { id, name, } = tag;
    return { id, name, };
  }
}
