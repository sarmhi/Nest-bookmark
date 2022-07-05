import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, Bookmark } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) { }
  async signup(dto: AuthDto) {
    try {
      // hash the password
      const hash = await argon2.hash(dto.password);

      // save user in db
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    // find the user by email
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // if user doesn't not exist, throw exception
    if (!user) {
      throw new ForbiddenException('User wih email does not exist.');
    }

    // Compare passwords
    const pwdMatches = await argon2.verify(user.hash, dto.password);
    // If password incorrect, throw exception
    if (!pwdMatches) {
      throw new ForbiddenException('Incorrect password');
    }
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });
    return { access_token: token };
  }
}
