export type AuthUser = {
  nickname: string;
  email: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type SignUpPayload = AuthCredentials & {
  nickname: string;
};
