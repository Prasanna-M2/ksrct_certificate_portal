import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'ksrct_secret_jwt_token_key_2026_super_secure';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  department: string;
  responsibilities?: string[];
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
