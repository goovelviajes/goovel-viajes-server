import { ApiProperty } from "@nestjs/swagger";

export class DeletedReponseDto {
    @ApiProperty({ example: "Vehicle deleted successfully", description: "Mensaje de exito" })
    message: string;

    @ApiProperty({ example: "656790cc-73a2-486b-ab94-70eac13f573e", description: "Id del vehiculo eliminado" })
    id: string;
}