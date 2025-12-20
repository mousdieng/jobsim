import { Pipe, PipeTransform } from '@angular/core';
import { getLifecycleStatusDisplayName, getLifecycleStatusColor } from '../utils/role.utils';

@Pipe({
  name: 'lifecycleStatusName',
  standalone: true
})
export class LifecycleStatusNamePipe implements PipeTransform {
  transform(status: string): string {
    return getLifecycleStatusDisplayName(status);
  }
}

@Pipe({
  name: 'lifecycleStatusColor',
  standalone: true
})
export class LifecycleStatusColorPipe implements PipeTransform {
  transform(status: string): string {
    return getLifecycleStatusColor(status);
  }
}
