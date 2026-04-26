export interface JwtUserPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin';
}
