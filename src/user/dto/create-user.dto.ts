import { AuthProvider } from "src/auth/enums/auth-provider.enum";

export interface CreateUserDto {
  name: string;
  lastname?: string;
  email: string;
  picture?: string;
  googleId?: string;
  provider: AuthProvider;
  password?: string;
  birthdate?: Date;
}
