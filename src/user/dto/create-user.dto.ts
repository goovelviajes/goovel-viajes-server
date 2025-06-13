export interface CreateUserDto {
  name: string;
  lastname: string;
  email: string;
  password: string;
  birthdate: Date;
  phone?: string;
}
