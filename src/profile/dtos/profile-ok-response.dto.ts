import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/user/entities/user.entity";

// 1. Clase base con todo lo común
export class ProfileOkResponseDto {
    @ApiProperty({ description: 'Id del perfil', example: '403444ee-6810-4a6d-bd1c-a291c58957bb' })
    id: string;

    @ApiProperty({ description: 'Nombre del perfil', example: 'franco-1234' })
    profileName: string;

    @ApiProperty({ description: 'Imagen del perfil', example: 'https://example.com/image.jpg' })
    image: string;

    @ApiProperty({ description: 'Direccion del perfil', example: 'Calle 123' })
    address: string;

    @ApiProperty({ description: 'Ciudad del perfil', example: 'Benito Juarez' })
    city: string;

    @ApiProperty({ description: 'Pais del perfil', example: 'Argentina' })
    country: string;

    @ApiProperty({ description: 'Provincia del perfil', example: 'Buenos Aires' })
    province: string;
}

// 2. Clase extendida que incluye el usuario
export class ProfileWithUserResponseDto extends ProfileOkResponseDto {
    @ApiProperty({
        description: 'Estadísticas del perfil',
        example: {
            averageRating: 4.5,
            countCompletedByDriver: 10,
            countCompletedByPassenger: 5
        }
    })
    stats: {
        averageRating: number;
        countCompletedByDriver: number;
        countCompletedByPassenger: number;
    };

    @ApiProperty({
        description: 'Usuario del perfil',
        example: {
            id: "dfea7f6d-de51-4558-9e65-4cae57265ef2",
            name: "Juan Cruz",
            lastname: "Rodriguez",
            birthdate: "2000-02-29",
            createdAt: "2025-11-01T18:14:04.714Z"
        }
    })
    user: Pick<User, 'id' | 'name' | 'lastname' | 'birthdate' | 'createdAt'>;
}