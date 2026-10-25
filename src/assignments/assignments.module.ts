import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { TimesheetAutoApprovalService } from './timesheet-auto-approval.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, TimesheetAutoApprovalService]
})
export class AssignmentsModule {}
