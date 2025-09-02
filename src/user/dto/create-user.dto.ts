// import { AuthProvider } from "src/auth/enums/auth-provider.enum";

export interface CreateUserDto {
  name: string;
  lastname?: string;
  email: string;
  picture?: string;
  password?: string;
  birthdate?: Date;
  // provider: AuthProvider;
  // googleId?: string;
}
