import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { CLOUDINARY } from "./cloudinary.provider";
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';
import { Readable } from "stream";

@Injectable()
export class FileUploadService {
    constructor(@Inject(CLOUDINARY) private cloudinaryClient: typeof cloudinary) { }

    async uploadFile(
        fileBuffer: Buffer,
        targetFolder: string,
        options: Omit<UploadApiOptions, 'folder'> = {},
    ): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {

            const uploadStream = this.cloudinaryClient.uploader.upload_stream(
                {
                    folder: targetFolder,
                    overwrite: true,
                    ...options,
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary Upload Error:', error);
                        return reject(new InternalServerErrorException('Error al subir el archivo a Cloudinary'));
                    }
                    resolve(result as UploadApiResponse);
                },
            );

            Readable.from(fileBuffer).pipe(uploadStream);
        });
    }
}