import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '../models/platform.model';
import { getRoleDisplayName } from '../utils/role.utils';

@Pipe({
  name: 'roleDisplayName',
  standalone: true
})
export class RoleDisplayNamePipe implements PipeTransform {
  transform(role: UserRole): string {
    return getRoleDisplayName(role);
  }
}
