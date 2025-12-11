import { Module } from '@nestjs/common';
import { CloudinaryProvider } from './cloudinary.provider';
import { FileUploadService } from './file-upload.service';

@Module({
    providers: [CloudinaryProvider, FileUploadService],
    exports: [FileUploadService],
})
export class UploadModule { }