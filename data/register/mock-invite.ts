export interface InviteMock {
  /** Visible copy: "Mateo" */
  childName: string;
  /** Visible copy: "Sala Soles" */
  classroomName: string;
  /** Mock invite code shown in the form, e.g. "7K4P9" */
  inviteCode: string;
  /** Mock email shown in the form */
  email: string;
  /** Mock password shown in the form */
  password: string;
}

export const mockInvite: InviteMock = {
  childName: "Mateo",
  classroomName: "Sala Soles",
  inviteCode: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  password: "contraseña",
};
