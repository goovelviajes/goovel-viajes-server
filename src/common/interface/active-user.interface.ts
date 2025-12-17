import { RolesEnum } from "../../user/enums/roles.enum";

export interface ActiveUserInterface {
  id: string;
  role: RolesEnum;
}
