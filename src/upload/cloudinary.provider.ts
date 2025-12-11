import { Provider } from "@nestjs/common";
import { v2 as cloudinary, ConfigOptions } from "cloudinary";
import { ConfigService } from "@nestjs/config";

// Define el token de inyección (clave para acceder a la instancia)
export const CLOUDINARY = "Cloudinary"

// Define el proveedor de Cloudinary
export const CloudinaryProvider: Provider = {
    provide: CLOUDINARY,
    // 💡 Inyectamos el ConfigService aquí
    useFactory: (configService: ConfigService) => {
        // 💡 Leer las variables DE FORMA SEGURA usando ConfigService
        cloudinary.config({
            cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
        });

        return cloudinary;
    },
    inject: [ConfigService],
};