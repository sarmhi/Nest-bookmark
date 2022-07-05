import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import * as pactum from 'pactum';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from 'src/user/dto';

describe('e2e test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    app.listen(3333);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'sam@test.com',
      password: 'password',
    };
    describe('Signup', () => {
      it('Should throw error if no email', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('Should throw error if no password', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('Should throw error if no body', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });

      it('Should Signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });
    describe('Signin', () => {
      it('Should throw error if no email', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });

      it('Should throw error if no password', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });

      it('Should throw error if no body', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });

      it('Should Signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });
    describe('Edit User', () => {
      it('Should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Esther',
          email: 'esther@test.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains('firstName')
          .expectBodyContains('email');
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Create Bookmarks', () => { });
    describe('Get Bookmarks', () => { });
    describe('Get Bookmark by Id', () => { });
    describe('Edit Bookmark by Id', () => { });
    describe('Delete Bookmark', () => { });
  });
});
