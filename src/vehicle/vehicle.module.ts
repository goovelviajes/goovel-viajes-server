import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { UserModule } from '../user/user.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle]), forwardRef(() => UserModule)],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [VehicleService]
})
export class VehicleModule { }
