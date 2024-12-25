import { Role } from "../interfaces";

export type CurrentUserType = {
  userId: string;
  username: string;
  fullName: string;
  role: Role;
}